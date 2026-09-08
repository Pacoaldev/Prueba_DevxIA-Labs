import { Controller, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingCode')
  async getTracking(@Param('trackingCode') trackingCode: string) {
    return this.trackingService.getTrackingByCode(trackingCode);
  }
}
