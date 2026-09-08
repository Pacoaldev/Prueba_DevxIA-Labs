import { BadRequestException, Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignVehiclesDto } from '../dto/assign-vehicles.dto.js';

export interface AssignedShipment {
  shipmentId: string;
  trackingCode: string;
  weight: number;
}

export interface VehicleAssignment {
  vehicleNumber: number;
  shipments: AssignedShipment[];
  totalWeight: number;
  remainingCapacity: number;
}

export interface VehicleAssignmentResult {
  vehicles: VehicleAssignment[];
  totalVehiclesUsed: number;
  totalWeight: number;
}

@Injectable()
export class VehicleAssignmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Pure First Fit Decreasing algorithm implementation.
   */
  firstFitDecreasing(
    items: { id: string; trackingCode: string; weightKg: number }[],
    capacity: number,
  ): VehicleAssignmentResult {
    if (capacity <= 0) {
      throw new BadRequestException('La capacidad del vehículo debe ser mayor a 0');
    }

    // Check if any single item exceeds capacity
    for (const item of items) {
      if (item.weightKg > capacity) {
        throw new BadRequestException(
          `El envío ${item.trackingCode} (${item.weightKg} kg) excede la capacidad máxima del vehículo (${capacity} kg)`,
        );
      }
    }

    // Sort items descending by weight
    const sortedItems = [...items].sort((a, b) => b.weightKg - a.weightKg);

    const vehicles: VehicleAssignment[] = [];

    for (const item of sortedItems) {
      let placed = false;

      for (const vehicle of vehicles) {
        if (vehicle.remainingCapacity >= item.weightKg) {
          vehicle.shipments.push({
            shipmentId: item.id,
            trackingCode: item.trackingCode,
            weight: item.weightKg,
          });
          vehicle.totalWeight = Number((vehicle.totalWeight + item.weightKg).toFixed(2));
          vehicle.remainingCapacity = Number(
            (capacity - vehicle.totalWeight).toFixed(2),
          );
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newVehicleNumber = vehicles.length + 1;
        const totalWeight = Number(item.weightKg.toFixed(2));
        vehicles.push({
          vehicleNumber: newVehicleNumber,
          shipments: [
            {
              shipmentId: item.id,
              trackingCode: item.trackingCode,
              weight: item.weightKg,
            },
          ],
          totalWeight,
          remainingCapacity: Number((capacity - totalWeight).toFixed(2)),
        });
      }
    }

    const overallTotalWeight = Number(
      vehicles.reduce((sum, v) => sum + v.totalWeight, 0).toFixed(2),
    );

    return {
      vehicles,
      totalVehiclesUsed: vehicles.length,
      totalWeight: overallTotalWeight,
    };
  }

  async assignVehicles(dto: AssignVehiclesDto): Promise<VehicleAssignmentResult> {
    const { shipmentIds, vehicleCapacity } = dto;

    if (new Set(shipmentIds).size !== shipmentIds.length) {
      throw new BadRequestException('La lista de envíos contiene identificadores duplicados');
    }

    const shipments = await this.prisma.shipment.findMany({
      where: {
        id: { in: shipmentIds },
      },
    });

    if (shipments.length !== shipmentIds.length) {
      const foundIds = new Set(shipments.map((s) => s.id));
      const missingIds = shipmentIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Los siguientes envíos no existen: ${missingIds.join(', ')}`,
      );
    }

    const invalidStateShipments = shipments.filter(
      (s) => s.status !== ShipmentStatus.IN_WAREHOUSE,
    );

    if (invalidStateShipments.length > 0) {
      const invalidDetails = invalidStateShipments
        .map((s) => `${s.trackingCode} (${s.status})`)
        .join(', ');
      throw new BadRequestException(
        `Solo se pueden asignar envíos en estado IN_WAREHOUSE. Envíos no válidos: ${invalidDetails}`,
      );
    }

    return this.firstFitDecreasing(shipments, vehicleCapacity);
  }
}
