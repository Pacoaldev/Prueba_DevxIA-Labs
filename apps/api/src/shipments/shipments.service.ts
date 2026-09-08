import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipmentQueryDto } from './dto/shipment-query.dto.js';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  private generateTrackingCode(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ENV-${dateStr}-${randomHex}`;
  }

  async create(dto: CreateShipmentDto, userId: string) {
    const trackingCode = this.generateTrackingCode();

    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          trackingCode,
          originAddress: dto.originAddress,
          destinationAddress: dto.destinationAddress,
          recipientName: dto.recipientName,
          contactPhone: dto.contactPhone,
          weightKg: dto.weightKg,
          status: ShipmentStatus.CREATED,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.CREATED,
          location: dto.originAddress,
          notes: 'Envío creado e ingresado en el sistema',
          userId,
        },
      });

      return tx.shipment.findUnique({
        where: { id: shipment.id },
        include: {
          events: {
            orderBy: { occurredAt: 'desc' },
            include: {
              user: {
                select: { id: true, email: true, role: true },
              },
            },
          },
        },
      });
    });
  }

  async findAll(query: ShipmentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = query.status ? { status: query.status } : {};

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          events: {
            orderBy: { occurredAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { occurredAt: 'asc' },
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Envío con ID ${id} no encontrado`);
    }

    return shipment;
  }
}
