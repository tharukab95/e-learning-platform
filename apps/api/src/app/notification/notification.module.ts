import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  controllers: [NotificationController],
  providers: [PrismaService, NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
