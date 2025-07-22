import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  async createLesson(
    name: string,
    description: string,
    classId: string,
    file?: any
  ) {
    let pdfUrl: string | undefined = '';
    if (file) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `lesson-pdfs/${randomUUID()}-${file.originalname}`;
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
    return this.prisma.lesson.create({
      data: { name, description, classId, pdfUrl },
    });
  }

  async updateLesson(
    id: string,
    data: Partial<{ name: string; description: string; file: any }>
  ) {
    let pdfUrl: string | undefined = undefined;
    if (data.file) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `lesson-pdfs/${randomUUID()}-${data.file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
          Body: data.file.buffer,
          ContentType: data.file.mimetype,
        })
      );
      pdfUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    return this.prisma.lesson.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        ...(pdfUrl ? { pdfUrl } : {}),
      },
    });
  }

  async listLessonsByClass(classId: string) {
    return this.prisma.lesson.findMany({ where: { classId } });
  }

  async getLessonById(id: string) {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  async getLessonAssessments(lessonId: string) {
    return this.prisma.assessment.findMany({ where: { lessonId } });
  }

  async getLessonVideos(lessonId: string) {
    return this.prisma.video.findMany({ where: { lessonId } });
  }

  async deleteLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }
}
