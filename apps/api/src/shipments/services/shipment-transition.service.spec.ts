import { BadRequestException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { describe, expect, it, beforeEach } from 'vitest';
import { ShipmentTransitionService } from './shipment-transition.service.js';

describe('ShipmentTransitionService', () => {
  let service: ShipmentTransitionService;

  beforeEach(() => {
    service = new ShipmentTransitionService();
  });

  describe('validateTransition', () => {
    it('debe permitir transiciones válidas del flujo principal', () => {
      expect(() =>
        service.validateTransition(ShipmentStatus.CREATED, ShipmentStatus.IN_WAREHOUSE),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(ShipmentStatus.IN_WAREHOUSE, ShipmentStatus.IN_TRANSIT),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURNED),
      ).not.toThrow();
    });

    it('debe rechazar transiciones inválidas o saltos de estado', () => {
      expect(() =>
        service.validateTransition(ShipmentStatus.CREATED, ShipmentStatus.DELIVERED),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateTransition(ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateTransition(ShipmentStatus.RETURNED, ShipmentStatus.IN_TRANSIT),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar transiciones al mismo estado', () => {
      expect(() =>
        service.validateTransition(ShipmentStatus.CREATED, ShipmentStatus.CREATED),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateCancellation', () => {
    it('debe permitir la cancelación desde estados permitidos', () => {
      expect(() => service.validateCancellation(ShipmentStatus.CREATED)).not.toThrow();
      expect(() => service.validateCancellation(ShipmentStatus.IN_WAREHOUSE)).not.toThrow();
      expect(() => service.validateCancellation(ShipmentStatus.IN_TRANSIT)).not.toThrow();
      expect(() => service.validateCancellation(ShipmentStatus.OUT_FOR_DELIVERY)).not.toThrow();
    });

    it('debe rechazar la cancelación desde estados terminales', () => {
      expect(() => service.validateCancellation(ShipmentStatus.DELIVERED)).toThrow(
        BadRequestException,
      );

      expect(() => service.validateCancellation(ShipmentStatus.RETURNED)).toThrow(
        BadRequestException,
      );

      expect(() => service.validateCancellation(ShipmentStatus.CANCELLED)).toThrow(
        BadRequestException,
      );
    });
  });
});
