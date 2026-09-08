import { ShipmentStatus } from '@prisma/client';

export interface ShipmentDashboardDto {
  total: number;
  byStatus: Record<ShipmentStatus, number>;
}