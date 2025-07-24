import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClassModule } from './class/class.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { LessonModule } from './lesson/lesson.module';
import { AssessmentModule } from './assessment/assessment.module';
import { NotificationModule } from './notification/notification.module';
import { VideoModule } from './videos/video.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ClassModule,
    EnrollmentModule,
    LessonModule,
    AssessmentModule,
    NotificationModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
