import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { TrackingModule } from './tracking/tracking.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ShipmentsModule, TrackingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
