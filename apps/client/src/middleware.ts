import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const TEACHER_PATH = '/dashboard/teacher';
const STUDENT_PATH = '/dashboard/student';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  // If not logged in, redirect to login for protected routes
  if (
    (pathname.startsWith(TEACHER_PATH) || pathname.startsWith(STUDENT_PATH)) &&
    !token
  ) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (pathname.startsWith(TEACHER_PATH) && token?.role !== 'teacher') {
    // If student tries to access teacher route, redirect to student dashboard
    return NextResponse.redirect(new URL('/dashboard/student', request.url));
  }
  if (pathname.startsWith(STUDENT_PATH) && token?.role !== 'student') {
    // If teacher tries to access student route, redirect to teacher dashboard
    return NextResponse.redirect(new URL('/dashboard/teacher', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/teacher/:path*', '/dashboard/student/:path*'],
};
