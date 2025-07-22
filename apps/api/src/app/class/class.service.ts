import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Class } from '@prisma/client';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  async createClass(
    title: string,
    subject: string,
    teacherId: string
  ): Promise<Class> {
    return this.prisma.class.create({
      data: { title, subject, teacherId },
    });
  }

  async listClasses(): Promise<Class[]> {
    return this.prisma.class.findMany();
  }

  async getClassById(id: string): Promise<Class | null> {
    return this.prisma.class.findUnique({ where: { id } });
  }
}
