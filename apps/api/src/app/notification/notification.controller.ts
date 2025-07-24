import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { Public } from '../auth/public.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway
  ) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Public()
  @Get('test')
  getTest() {
    return { ok: true };
  }

  // Called by backend when a new assessment or video is created
  @Public()
  @Post('create')
  async createNotification(
    @Body()
    body: {
      userId: string;
      type?: string;
      payload?: any;
      message?: string;
      link?: string;
    }
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: body.userId,
        type: body.type || 'assessment',
        payload: body.payload || { message: body.message, link: body.link },
        isRead: false,
      },
    });
    this.notificationGateway.sendNotification(body.userId, notification);
    return notification;
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
  }
}
