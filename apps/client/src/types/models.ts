// Shared model types for frontend, matching backend Prisma schema

export interface Class {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  thumbnail?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  pdfUrl: string;
  deadline: string; // ISO string
  lessonId: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  image?: string;
  about?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  assessmentId: string;
  pdfUrl: string;
  grade?: number;
  feedback?: string;
  createdAt: string;
}
