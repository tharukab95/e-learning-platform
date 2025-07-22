import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import {
  EnrollmentController,
  EnrolledStudentsController,
} from './enrollment.controller';

@Module({
  providers: [EnrollmentService],
  controllers: [EnrollmentController, EnrolledStudentsController],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
