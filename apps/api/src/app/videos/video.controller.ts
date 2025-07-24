import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { Roles } from '../auth/roles.decorator';

@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Roles('teacher')
  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Body('title') title: string,
    @Body('lessonId') lessonId: string,
    @UploadedFile() file: any,
    @Req() req: any
  ) {
    // Register video metadata and upload to S3, enqueue for HLS processing
    return this.videoService.uploadAndProcessVideo(
      title,
      lessonId,
      file,
      req.user.id
    );
  }

  @Get(':id')
  async getVideo(@Param('id') id: string) {
    return this.videoService.getVideoById(id);
  }

  @Get(':id/hls')
  async getHlsPath(@Param('id') id: string) {
    return this.videoService.getHlsPath(id);
  }
}
