import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  async createClass(
    title: string,
    subject: string,
    teacherId: string,
    file?: any
  ): Promise<any> {
    let thumbnailUrl: string | undefined = undefined;
    if (file) {
      // S3 upload
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `class-thumbnails/${randomUUID()}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      thumbnailUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    return this.prisma.class.create({
      data: { title, subject, teacherId, thumbnail: thumbnailUrl },
    });
  }

  async listClasses(): Promise<any[]> {
    return this.prisma.class.findMany();
  }

  async getClassById(id: string): Promise<any | null> {
    return this.prisma.class.findUnique({ where: { id } });
  }

  async getEnrolledClasses(studentId: string): Promise<any[]> {
    return this.prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            studentId,
          },
        },
      },
    });
  }

  async getClassStudentProgress(classId: string): Promise<any[]> {
    // Get all students enrolled in the class
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      include: { student: true },
    });
    // Get all lessons for the class
    const lessons = await this.prisma.lesson.findMany({ where: { classId } });
    // Get all assessments for all lessons
    const lessonIds = lessons.map((l) => l.id);
    const assessments = await this.prisma.assessment.findMany({
      where: { lessonId: { in: lessonIds } },
    });
    const assessmentIds = assessments.map((a) => a.id);
    // Get all submissions for these assessments
    const submissions = await this.prisma.assessmentSubmission.findMany({
      where: { assessmentId: { in: assessmentIds } },
      include: { student: true },
    });
    // For each student, calculate completion and last submission date
    return enrollments.map((enroll) => {
      const studentSubs = submissions.filter(
        (s) => s.studentId === enroll.studentId
      );
      const completed = studentSubs.length;
      const total = assessments.length;
      const completion = total ? Math.round((completed / total) * 100) : 0;
      const lastSubmissionDate =
        studentSubs.length > 0
          ? (() => {
              const times = studentSubs
                .map((s) =>
                  s.createdAt && !isNaN(new Date(s.createdAt).getTime())
                    ? new Date(s.createdAt).getTime()
                    : null
                )
                .filter((t) => t !== null);
              if (times.length === 0) return null;
              return new Date(Math.max(...times)).toISOString().slice(0, 10);
            })()
          : null;
      return {
        studentName: enroll.student?.name || enroll.studentId,
        completion,
        lastSubmissionDate,
      };
    });
  }
}
