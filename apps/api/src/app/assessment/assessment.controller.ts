import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Post('assessments')
  @UseInterceptors(FileInterceptor('pdf'))
  async createAssessment(
    @Body('title') title: string,
    @Body('deadline') deadline: string,
    @Body('lessonId') lessonId: string,
    @UploadedFile() file: any
  ) {
    return this.assessmentService.createAssessment(
      title,
      deadline,
      lessonId,
      file
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:lessonId/assessments')
  async listAssessments(@Param('lessonId') lessonId: string) {
    return this.assessmentService.listAssessmentsByLesson(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assessments/:assessmentId/submit')
  @UseInterceptors(FileInterceptor('pdf'))
  async submitAssessment(
    @Param('assessmentId') assessmentId: string,
    @Req() req: any,
    @UploadedFile() file: any
  ) {
    return this.assessmentService.submitAssessment(
      assessmentId,
      req.user.id,
      file
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Get('assessments/:assessmentId/submissions')
  async getAssessmentSubmissions(@Param('assessmentId') assessmentId: string) {
    return this.assessmentService.getAssessmentSubmissions(assessmentId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Patch('assessments/submissions/:submissionId')
  async markSubmission(
    @Param('submissionId') submissionId: string,
    @Body('grade') grade: number,
    @Body('feedback') feedback: string
  ) {
    return this.assessmentService.markSubmission(submissionId, grade, feedback);
  }
}
