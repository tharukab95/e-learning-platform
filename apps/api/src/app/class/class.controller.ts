import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
export class ClassController {
  constructor(private classService: ClassService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async createClass(
    @Body('title') title: string,
    @Body('subject') subject: string,
    @Req() req: any,
    @UploadedFile() file: any
  ) {
    return this.classService.createClass(title, subject, req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listClasses() {
    return this.classService.listClasses();
  }

  @UseGuards(JwtAuthGuard)
  @Get('enrolled')
  async getEnrolledClasses(@Req() req: any) {
    return this.classService.getEnrolledClasses(req.user.id);
  }
}
