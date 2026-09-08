import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';
import { ShipmentTransitionService } from './services/shipment-transition.service.js';
import { VehicleAssignmentService } from './services/vehicle-assignment.service.js';

@Module({
  imports: [PassportModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentTransitionService, VehicleAssignmentService],
  exports: [ShipmentsService, ShipmentTransitionService, VehicleAssignmentService],
})
export class ShipmentsModule {}
