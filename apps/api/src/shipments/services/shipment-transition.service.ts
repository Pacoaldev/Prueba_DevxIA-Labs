import { BadRequestException, Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentTransitionService {
  private readonly ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.CREATED]: [ShipmentStatus.IN_WAREHOUSE, ShipmentStatus.CANCELLED],
    [ShipmentStatus.IN_WAREHOUSE]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
    [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.CANCELLED],
    [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED],
    [ShipmentStatus.DELIVERED]: [],
    [ShipmentStatus.RETURNED]: [],
    [ShipmentStatus.CANCELLED]: [],
  };

  isValidTransition(currentStatus: ShipmentStatus, newStatus: ShipmentStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  validateTransition(currentStatus: ShipmentStatus, newStatus: ShipmentStatus): void {
    if (currentStatus === newStatus) {
      throw new BadRequestException(`El envío ya se encuentra en estado ${currentStatus}`);
    }

    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Transición de estado no válida de ${currentStatus} a ${newStatus}`,
      );
    }
  }

  validateCancellation(currentStatus: ShipmentStatus): void {
    if (currentStatus === ShipmentStatus.DELIVERED) {
      throw new BadRequestException('No se puede cancelar un envío que ya ha sido entregado');
    }
    if (currentStatus === ShipmentStatus.RETURNED) {
      throw new BadRequestException('No se puede cancelar un envío devuelto');
    }
    if (currentStatus === ShipmentStatus.CANCELLED) {
      throw new BadRequestException('El envío ya se encuentra cancelado');
    }
  }

  getValidNextStatuses(currentStatus: ShipmentStatus): ShipmentStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
