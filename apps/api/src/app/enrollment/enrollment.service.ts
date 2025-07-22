import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassEnrollment } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async enrollStudent(
    classId: string,
    studentId: string
  ): Promise<ClassEnrollment> {
    return this.prisma.classEnrollment.create({
      data: { classId, studentId },
    });
  }

  async getEnrolledStudents(classId: string) {
    return this.prisma.classEnrollment.findMany({
      where: { classId },
      include: { student: true },
    });
  }
}
