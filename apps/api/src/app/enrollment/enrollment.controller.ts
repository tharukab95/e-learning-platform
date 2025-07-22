import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes/:id/enroll')
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('student')
  @Post()
  async enroll(@Param('id') classId: string, @Req() req: any) {
    return this.enrollmentService.enrollStudent(classId, req.user.id);
  }
}

@Controller('classes/:id/students')
export class EnrolledStudentsController {
  constructor(private enrollmentService: EnrollmentService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Get()
  async getEnrolledStudents(@Param('id') classId: string) {
    return this.enrollmentService.getEnrolledStudents(classId);
  }
}
