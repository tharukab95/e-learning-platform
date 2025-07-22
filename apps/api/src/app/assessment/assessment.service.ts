import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.assessment.create({
      data: {
        title,
        pdfUrl,
        deadline: new Date(deadline),
        lessonId,
      },
    });
  }

  async listAssessmentsByLesson(lessonId: string) {
    return this.prisma.assessment.findMany({
      where: { lessonId },
    });
  }
}
