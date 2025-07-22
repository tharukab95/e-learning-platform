import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassService } from './class.service';
import { LessonService } from '../lesson/lesson.service';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
export class ClassController {
  constructor(
    private classService: ClassService,
    private lessonService: LessonService
  ) {}

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

  @Get()
  async listClasses() {
    return this.classService.listClasses();
  }

  @Get('enrolled')
  async getEnrolledClasses(@Req() req: any) {
    return this.classService.getEnrolledClasses(req.user.id);
  }

  @Get(':id/lessons')
  async getClassLessons(@Param('id') id: string) {
    return this.lessonService.listLessonsByClass(id);
  }
}
