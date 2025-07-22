import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Class } from '@prisma/client';
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
  ): Promise<Class> {
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

  async listClasses(): Promise<Class[]> {
    return this.prisma.class.findMany();
  }

  async getClassById(id: string): Promise<Class | null> {
    return this.prisma.class.findUnique({ where: { id } });
  }

  async getEnrolledClasses(studentId: string): Promise<Class[]> {
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
}
