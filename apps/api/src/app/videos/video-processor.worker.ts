const { Worker: BullmqWorker, QueueEvents } = require('bullmq');
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const { tmpdir } = require('os');
const { join } = require('path');
const {
  createWriteStream,
  readdirSync,
  readFileSync,
  unlinkSync,
  rmdirSync,
  mkdirSync,
} = require('fs');
const { pipeline, Readable } = require('stream');
const { promisify } = require('util');
const axios = require('axios');

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const videoQueueName = 'video-processing';
const streamPipeline = promisify(pipeline);

const worker = new BullmqWorker(
  videoQueueName,
  async (job: any) => {
    const { videoId, s3Url } = job.data;
    try {
      // Set status to 'processing'
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'processing' },
      });
      console.log(`[${videoId}] 0%: Status set to processing.`);
      // Download video from S3
      const key = s3Url.split('.amazonaws.com/')[1];
      const tmpDir = join(tmpdir(), `video-${videoId}`);
      mkdirSync(tmpDir, { recursive: true });
      const localVideoPath = join(tmpDir, 'input.mp4');
      const getObj = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
        })
      );
      let s3BodyStream = getObj.Body;
      if (
        s3BodyStream &&
        typeof s3BodyStream.pipe !== 'function' &&
        typeof Readable.fromWeb === 'function'
      ) {
        s3BodyStream = Readable.fromWeb(s3BodyStream);
      }
      if (!s3BodyStream || typeof s3BodyStream.pipe !== 'function') {
        throw new Error('S3 GetObject did not return a streamable body');
      }
      await streamPipeline(s3BodyStream, createWriteStream(localVideoPath));
      console.log(`[${videoId}] 25%: Video downloaded from S3.`);
      // Run FFmpeg to create HLS chunks
      const hlsDir = join(tmpDir, 'hls');
      mkdirSync(hlsDir, { recursive: true });
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i',
          localVideoPath,
          '-codec:',
          'copy',
          '-start_number',
          '0',
          '-hls_time',
          '10',
          '-hls_list_size',
          '0',
          '-f',
          'hls',
          join(hlsDir, 'index.m3u8'),
        ]);
        ffmpeg.on('close', (code: number) =>
          code === 0 ? resolve(null) : reject(new Error('FFmpeg failed'))
        );
      });
      console.log(`[${videoId}] 50%: FFmpeg HLS conversion complete.`);
      // Upload HLS files to S3
      const hlsFiles = readdirSync(hlsDir);
      const hlsS3Prefix = `lesson-videos-hls/${videoId}/`;
      for (const file of hlsFiles) {
        const filePath = join(hlsDir, file);
        const fileContent = readFileSync(filePath);
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: hlsS3Prefix + file,
            Body: fileContent,
            ContentType: file.endsWith('.m3u8')
              ? 'application/vnd.apple.mpegurl'
              : 'video/MP2T',
          })
        );
      }
      console.log(`[${videoId}] 75%: HLS files uploaded to S3.`);
      // Update video record with HLS path and set status to 'ready'
      const hlsPath = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${hlsS3Prefix}index.m3u8`;
      await prisma.video.update({
        where: { id: videoId },
        data: { hlsPath, status: 'ready' },
      });
      console.log(
        `[${videoId}] 100%: Video processing complete and DB updated.`
      );
      // Send notification to teacher
      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (video) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: video.lessonId },
        });
        if (lesson) {
          const classObj = await prisma.class.findUnique({
            where: { id: lesson.classId },
          });
          if (classObj) {
            const teacherId = classObj.teacherId;
            // Send notification via backend API (which will emit websocket)
            const notificationUrl =
              'http://localhost:3000/api/notifications/create';
            const notificationPayload = {
              userId: teacherId,
              type: 'video',
              payload: {
                message: `Your video '${video.title}' is ready to view!`,
                link: `/classes/${lesson.classId}/lesson/${lesson.id}`,
                videoId: video.id,
                lessonId: lesson.id,
                classId: lesson.classId,
              },
            };
            console.log(
              `[${videoId}] Sending notification to:`,
              notificationUrl
            );
            console.log(
              `[${videoId}] Notification payload:`,
              JSON.stringify(notificationPayload)
            );
            try {
              await axios.post(notificationUrl, notificationPayload);
              console.log(`[${videoId}] Notification sent successfully.`);
            } catch (notifyErr: any) {
              console.error(`[${videoId}] Notification failed!`);
              if (notifyErr.response) {
                console.error(
                  `[${videoId}] Response status:`,
                  notifyErr.response.status
                );
                console.error(
                  `[${videoId}] Response data:`,
                  notifyErr.response.data
                );
                if (notifyErr.response.status === 404) {
                  console.error(
                    `[${videoId}] 404 Not Found: The notification endpoint was not found. Check the URL and backend route registration.`
                  );
                }
              } else {
                console.error(`[${videoId}] Error object:`, notifyErr);
              }
              throw notifyErr;
            }
          }
        }
      }
      // Cleanup
      for (const file of readdirSync(hlsDir)) unlinkSync(join(hlsDir, file));
      rmdirSync(hlsDir);
      unlinkSync(localVideoPath);
      rmdirSync(tmpDir);
    } catch (err) {
      // Set status to 'failed' on error
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'failed' },
      });
      throw err;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);

const queueEvents = new QueueEvents(videoQueueName, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

queueEvents.on('completed', ({ jobId }: any) => {
  console.log(`Video processing job ${jobId} completed.`);
});
queueEvents.on('failed', ({ jobId, failedReason }: any) => {
  console.error(`Video processing job ${jobId} failed: ${failedReason}`);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
void worker;
