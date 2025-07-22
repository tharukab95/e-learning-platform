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
import { Public } from '../auth/public.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Called by backend when a new assessment is created
  @Public()
  @Post('create')
  async createNotification(
    @Body() body: { userId: string; message: string; link?: string }
  ) {
    return this.prisma.notification.create({
      data: {
        userId: body.userId,
        type: 'assessment',
        payload: { message: body.message, link: body.link },
        isRead: false,
      },
    });
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
  }
}
