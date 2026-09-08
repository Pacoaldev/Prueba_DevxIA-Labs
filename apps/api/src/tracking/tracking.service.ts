import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PublicTrackingResponseDto } from './dto/public-tracking-response.dto.js';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getTrackingByCode(trackingCode: string): Promise<PublicTrackingResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { trackingCode },
      include: {
        events: {
          orderBy: { occurredAt: 'asc' },
          select: {
            status: true,
            occurredAt: true,
            location: true,
            notes: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Código de seguimiento ${trackingCode} no encontrado`);
    }

    return {
      trackingCode: shipment.trackingCode,
      status: shipment.status,
      originAddress: shipment.originAddress,
      destinationAddress: shipment.destinationAddress,
      recipientName: shipment.recipientName,
      createdAt: shipment.createdAt,
      deliveredAt: shipment.deliveredAt,
      events: shipment.events,
    };
  }
}
