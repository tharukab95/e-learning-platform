import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';

export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed';

@Injectable()
export class VideoService {
  private videoQueue: Queue;

  constructor(private prisma: PrismaService) {
    this.videoQueue = new Queue('video-processing', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
  }

  async uploadAndProcessVideo(
    title: string,
    lessonId: string,
    file: any,
    userId: string
  ) {
    // Upload to S3
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const key = `lesson-videos/${randomUUID()}-${file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    // Register video in DB (hlsPath empty for now, status 'pending')
    const video = await this.prisma.video.create({
      data: { title, s3Url, hlsPath: '', lessonId, status: 'pending' },
    });
    // Enqueue for HLS processing
    await this.videoQueue.add('process', { videoId: video.id, s3Url });
    return video;
  }

  async getVideoById(id: string) {
    return this.prisma.video.findUnique({ where: { id } });
  }

  async getHlsPath(id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    return { hlsPath: video?.hlsPath, status: video?.status };
  }

  async updateVideoStatus(id: string, status: VideoStatus) {
    return this.prisma.video.update({ where: { id }, data: { status } });
  }
}
