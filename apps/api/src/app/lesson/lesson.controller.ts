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
import { Roles } from '../auth/roles.decorator';

@Controller()
export class LessonController {
  constructor(private lessonService: LessonService) {}

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

  @Get('lessons/:id')
  async getLesson(@Param('id') id: string) {
    return this.lessonService.getLessonById(id);
  }

  @Get('lessons/:id/videos')
  async getLessonVideos(@Param('id') id: string) {
    return this.lessonService.getLessonVideos(id);
  }

  @Get('lessons/:id/assessments')
  async getLessonAssessments(@Param('id') id: string, @Req() req: any) {
    // Pass userId if available (for students)
    const userId = req.user?.id;
    return this.lessonService.getLessonAssessments(id, userId);
  }

  @Roles('teacher')
  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.lessonService.deleteLesson(id);
  }
}
