import { BadRequestException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { VehicleAssignmentService } from './vehicle-assignment.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('VehicleAssignmentService (First Fit Decreasing)', () => {
  let service: VehicleAssignmentService;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(() => {
    mockPrismaService = {
      shipment: {
        findMany: vi.fn(),
      } as any,
    };
    service = new VehicleAssignmentService(mockPrismaService as PrismaService);
  });

  describe('firstFitDecreasing (Algoritmo puro)', () => {
    it('debe distribuir los envíos correctamente en vehículos usando FFD (70, 45, 30, 25, 20 con cap 100)', () => {
      const items = [
        { id: '1', trackingCode: 'ENV-1', weightKg: 70 },
        { id: '2', trackingCode: 'ENV-2', weightKg: 45 },
        { id: '3', trackingCode: 'ENV-3', weightKg: 30 },
        { id: '4', trackingCode: 'ENV-4', weightKg: 25 },
        { id: '5', trackingCode: 'ENV-5', weightKg: 20 },
      ];

      const result = service.firstFitDecreasing(items, 100);

      expect(result.totalVehiclesUsed).toBe(2);
      expect(result.totalWeight).toBe(190);

      // Vehículo 1: 70 + 30 = 100 (capacidad restante 0)
      expect(result.vehicles[0].shipments.map((s) => s.weight)).toEqual([70, 30]);
      expect(result.vehicles[0].totalWeight).toBe(100);
      expect(result.vehicles[0].remainingCapacity).toBe(0);

      // Vehículo 2: 45 + 25 + 20 = 90 (capacidad restante 10)
      expect(result.vehicles[1].shipments.map((s) => s.weight)).toEqual([45, 25, 20]);
      expect(result.vehicles[1].totalWeight).toBe(90);
      expect(result.vehicles[1].remainingCapacity).toBe(10);
    });

    it('debe lanzar un error descriptivo si un envío excede la capacidad del vehículo', () => {
      const items = [{ id: '1', trackingCode: 'ENV-HEAVY', weightKg: 150 }];

      expect(() => service.firstFitDecreasing(items, 100)).toThrow(BadRequestException);
    });

    it('debe lanzar error si la capacidad del vehículo es 0 o negativa', () => {
      const items = [{ id: '1', trackingCode: 'ENV-1', weightKg: 10 }];

      expect(() => service.firstFitDecreasing(items, 0)).toThrow(BadRequestException);
      expect(() => service.firstFitDecreasing(items, -50)).toThrow(BadRequestException);
    });
  });

  describe('assignVehicles (Integración con validaciones de DB)', () => {
    it('debe rechazar IDs duplicados', async () => {
      await expect(
        service.assignVehicles({
          shipmentIds: ['uuid-1', 'uuid-1'],
          vehicleCapacity: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si faltan envíos en la base de datos', async () => {
      (mockPrismaService.shipment!.findMany as any).mockResolvedValue([
        { id: 'uuid-1', trackingCode: 'ENV-1', weightKg: 20, status: ShipmentStatus.IN_WAREHOUSE },
      ]);

      await expect(
        service.assignVehicles({
          shipmentIds: ['uuid-1', 'uuid-2'],
          vehicleCapacity: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar envíos que no estén en estado IN_WAREHOUSE', async () => {
      (mockPrismaService.shipment!.findMany as any).mockResolvedValue([
        { id: 'uuid-1', trackingCode: 'ENV-1', weightKg: 20, status: ShipmentStatus.CREATED },
      ]);

      await expect(
        service.assignVehicles({
          shipmentIds: ['uuid-1'],
          vehicleCapacity: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
