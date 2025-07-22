import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonService } from './lesson.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class LessonController {
  constructor(private lessonService: LessonService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Post('lessons')
  @UseInterceptors(FileInterceptor('pdf'))
  async createLesson(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('classId') classId: string,
    @UploadedFile() file: any
  ) {
    return this.lessonService.createLesson(name, description, classId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Patch('lessons/:id')
  @UseInterceptors(FileInterceptor('pdf'))
  async updateLesson(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: any
  ) {
    return this.lessonService.updateLesson(id, { ...body, file });
  }

  @UseGuards(JwtAuthGuard)
  @Get('classes/:classId/lessons')
  async listLessons(@Param('classId') classId: string) {
    return this.lessonService.listLessonsByClass(classId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:id')
  async getLesson(@Param('id') id: string) {
    return this.lessonService.getLessonById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:id/assessments')
  async getLessonAssessments(@Param('id') id: string) {
    return this.lessonService.getLessonAssessments(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:id/videos')
  async getLessonVideos(@Param('id') id: string) {
    return this.lessonService.getLessonVideos(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.lessonService.deleteLesson(id);
  }
}
