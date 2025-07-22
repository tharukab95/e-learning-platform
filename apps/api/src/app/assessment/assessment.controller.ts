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
import { Roles } from '../auth/roles.decorator';

@Controller()
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

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

  @Get('assessments/:id/submissions')
  async getAssessmentSubmissions(@Param('id') id: string) {
    return this.assessmentService.getAssessmentSubmissions(id);
  }

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
