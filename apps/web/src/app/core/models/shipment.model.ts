export enum ShipmentStatus {
  CREATED = 'CREATED',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.CREATED]: 'Creado',
  [ShipmentStatus.IN_WAREHOUSE]: 'En Almacén',
  [ShipmentStatus.IN_TRANSIT]: 'En Tránsito',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'En Reparto',
  [ShipmentStatus.DELIVERED]: 'Entregado',
  [ShipmentStatus.RETURNED]: 'Devuelto',
  [ShipmentStatus.CANCELLED]: 'Cancelado',
};

export const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.IN_WAREHOUSE, ShipmentStatus.CANCELLED],
  [ShipmentStatus.IN_WAREHOUSE]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.CANCELLED],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.RETURNED]: [],
  [ShipmentStatus.CANCELLED]: [],
};

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  occurredAt: string;
  location: string;
  notes: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface Shipment {
  id: string;
  trackingCode: string;
  originAddress: string;
  destinationAddress: string;
  recipientName: string;
  contactPhone?: string;
  weightKg: number;
  status: ShipmentStatus;
  createdAt: string;
  deliveredAt?: string;
  events?: ShipmentEvent[];
}

export interface ShipmentListResponse {
  data: Shipment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateShipmentPayload {
  originAddress: string;
  destinationAddress: string;
  recipientName: string;
  contactPhone?: string;
  weightKg: number;
}

export interface UpdateStatusPayload {
  status: ShipmentStatus;
  location: string;
  notes: string;
}

export interface VehicleAssignmentResult {
  vehicles: {
    vehicleNumber: number;
    shipments: { shipmentId: string; trackingCode: string; weight: number }[];
    totalWeight: number;
    remainingCapacity: number;
  }[];
  totalVehiclesUsed: number;
  totalWeight: number;
}
