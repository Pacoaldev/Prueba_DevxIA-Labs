import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipmentQueryDto } from './dto/shipment-query.dto.js';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto.js';
import { ShipmentTransitionService } from './services/shipment-transition.service.js';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private transitionService: ShipmentTransitionService,
  ) {}

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

  async updateStatus(id: string, dto: UpdateShipmentStatusDto, userId: string) {
    const shipment = await this.findOne(id);
    this.transitionService.validateTransition(shipment.status, dto.status);

    return this.prisma.$transaction(async (tx) => {
      const isDelivered = dto.status === ShipmentStatus.DELIVERED;

      await tx.shipment.update({
        where: { id },
        data: {
          status: dto.status,
          deliveredAt: isDelivered ? new Date() : shipment.deliveredAt,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: dto.status,
          location: dto.location,
          notes: dto.notes,
          userId,
        },
      });

      return tx.shipment.findUnique({
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
    });
  }

  async cancel(id: string, userId: string, location?: string, notes?: string) {
    const shipment = await this.findOne(id);
    this.transitionService.validateCancellation(shipment.status);

    return this.prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.CANCELLED,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: ShipmentStatus.CANCELLED,
          location: location || shipment.destinationAddress,
          notes: notes || 'Envío cancelado',
          userId,
        },
      });

      return tx.shipment.findUnique({
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
    });
  }

  async getDashboard() {
    const statuses = [
      ShipmentStatus.CREATED,
      ShipmentStatus.IN_WAREHOUSE,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.RETURNED,
      ShipmentStatus.CANCELLED,
    ];

    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.shipment.count({ where: { status } }),
      ),
    );

    const total = counts.reduce((sum, c) => sum + c, 0);

    return {
      total,
      byStatus: Object.fromEntries(statuses.map((s, i) => [s, counts[i]])),
    };
  }

  async exportCsv(): Promise<string> {
    const shipments = await this.prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        trackingCode: true,
        originAddress: true,
        destinationAddress: true,
        recipientName: true,
        contactPhone: true,
        weightKg: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    const headers = [
      'trackingCode',
      'originAddress',
      'destinationAddress',
      'recipientName',
      'contactPhone',
      'weightKg',
      'status',
      'createdAt',
      'deliveredAt',
    ];

    const escape = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = shipments.map((s) =>
      headers.map((h) => escape((s as any)[h])).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}