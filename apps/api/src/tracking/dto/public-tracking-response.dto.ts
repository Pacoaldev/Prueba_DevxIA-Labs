import { ShipmentStatus } from '@prisma/client';

export interface PublicTrackingEventDto {
  status: ShipmentStatus;
  occurredAt: Date;
  location: string;
  notes: string;
}

export interface PublicTrackingResponseDto {
  trackingCode: string;
  status: ShipmentStatus;
  originAddress: string;
  destinationAddress: string;
  recipientName: string;
  createdAt: Date;
  deliveredAt: Date | null;
  events: PublicTrackingEventDto[];
}
