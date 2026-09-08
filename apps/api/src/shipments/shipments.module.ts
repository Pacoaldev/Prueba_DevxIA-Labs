import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';
import { ShipmentTransitionService } from './services/shipment-transition.service.js';

@Module({
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentTransitionService],
  exports: [ShipmentsService, ShipmentTransitionService],
})
export class ShipmentsModule {}
