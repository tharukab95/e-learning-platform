import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.prisma.user.findUnique({ where: { id: req.user?.id } });
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    // Only allow updating name, phone, address, about
    const { name, phone, address, about } = body;
    return this.prisma.user.update({
      where: { id: req.user?.id },
      data: { name, phone, address, about },
    });
  }

  @Post('me/image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@Req() req: any, @UploadedFile() file: any) {
    // For demo: store image as base64 string (in production, use S3 or similar)
    const image = `data:${file.mimetype};base64,${file.buffer.toString(
      'base64'
    )}`;
    await this.prisma.user.update({
      where: { id: req.user?.id },
      data: { image },
    });
    return { image };
  }
}
