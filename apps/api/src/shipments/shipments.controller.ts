import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ShipmentsService } from './shipments.service.js';
import { VehicleAssignmentService } from './services/vehicle-assignment.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipmentQueryDto } from './dto/shipment-query.dto.js';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto.js';
import { AssignVehiclesDto } from './dto/assign-vehicles.dto.js';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly vehicleAssignmentService: VehicleAssignmentService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.create(dto, userId);
  }

  @Post('assign-vehicles')
  async assignVehicles(@Body() dto: AssignVehiclesDto) {
    return this.vehicleAssignmentService.assignVehicles(dto);
  }

  @Get()
  async findAll(@Query() query: ShipmentQueryDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.updateStatus(id, dto, userId);
  }

  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.cancel(id, userId);
  }
}
