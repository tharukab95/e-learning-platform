import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
export class ClassController {
  constructor(private classService: ClassService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('teacher')
  @Post()
  async createClass(
    @Body('title') title: string,
    @Body('subject') subject: string,
    @Req() req: any
  ) {
    return this.classService.createClass(title, subject, req.user.id);
  }

  @Get()
  async listClasses() {
    return this.classService.listClasses();
  }
}
