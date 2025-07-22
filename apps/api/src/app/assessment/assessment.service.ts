import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway
  ) {}

  async createAssessment(
    title: string,
    deadline: string,
    lessonId: string,
    file?: any
  ) {
    let pdfUrl: string = '';
    if (file) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `assessment-pdfs/${randomUUID()}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      pdfUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    const assessment = await this.prisma.assessment.create({
      data: {
        title,
        pdfUrl,
        deadline: new Date(deadline),
        lessonId,
      },
    });
    // Find the class for the lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (lesson) {
      const enrollments = await this.prisma.classEnrollment.findMany({
        where: { classId: lesson.classId },
      });
      for (const enrollment of enrollments) {
        const notification = await this.prisma.notification.create({
          data: {
            userId: enrollment.studentId,
            type: 'assessment',
            payload: {
              message: `A new assessment '${title}' has been created for your class!`,
              link: `/classes/${lesson.classId}?highlightAssessment=${assessment.id}`,
              lessonId: lesson.id,
              assessmentId: assessment.id,
            },
            isRead: false,
          },
        });
        this.notificationGateway.sendNotification(
          enrollment.studentId,
          notification
        );
      }
    }
    return assessment;
  }

  async listAssessmentsByLesson(lessonId: string) {
    return this.prisma.assessment.findMany({
      where: { lessonId },
    });
  }

  async submitAssessment(assessmentId: string, studentId: string, file: any) {
    let pdfUrl = '';
    if (file) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `assessment-submissions/${randomUUID()}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      pdfUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    return this.prisma.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId,
        pdfUrl,
      },
    });
  }

  async getAssessmentSubmissions(assessmentId: string) {
    const submissions = await this.prisma.assessmentSubmission.findMany({
      where: { assessmentId },
      include: { student: true },
    });
    return submissions.map((sub) => ({
      ...sub,
      marked: sub.grade !== null && sub.grade !== undefined,
    }));
  }

  async markSubmission(submissionId: string, grade: number, feedback: string) {
    return this.prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: { grade, feedback },
    });
  }
}
