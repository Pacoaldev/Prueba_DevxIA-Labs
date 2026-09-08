import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ShipmentsService } from './shipments.service.js';
import { VehicleAssignmentService } from './services/vehicle-assignment.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipmentQueryDto } from './dto/shipment-query.dto.js';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto.js';
import { AssignVehiclesDto } from './dto/assign-vehicles.dto.js';

@ApiTags('shipments')
@ApiBearerAuth()
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly vehicleAssignmentService: VehicleAssignmentService,
  ) {}

  @Post()
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Crear un nuevo envío' })
  @ApiResponse({ status: 201, description: 'Envío creado' })
  async create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.create(dto, userId);
  }

  @Post('assign-vehicles')
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Asignar envíos a vehículos usando First Fit Decreasing' })
  async assignVehicles(@Body() dto: AssignVehiclesDto) {
    return this.vehicleAssignmentService.assignVehicles(dto);
  }

  @Get()
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Listar envíos con paginación y filtro por estado' })
  async findAll(@Query() query: ShipmentQueryDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get('dashboard')
  @Roles(Role.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener conteo de envíos por estado (SUPERVISOR)' })
  async getDashboard() {
    return this.shipmentsService.getDashboard();
  }

  @Get('export/csv')
  @Roles(Role.SUPERVISOR)
  @ApiOperation({ summary: 'Exportar envíos a CSV (SUPERVISOR)' })
  async exportCsv() {
    const csv = await this.shipmentsService.exportCsv();
    return csv;
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener detalle de un envío con historial' })
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Cambiar estado del envío' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.updateStatus(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.OPERATOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Cancelar un envío (no si está entregado)' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.cancel(id, userId);
  }
}
