import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  // Get the current path
  const h = await headers();
  const pathname = h.get('x-invoke-path') || '';

  // Only redirect if on /dashboard (not on /dashboard/teacher or /dashboard/student)
  if (pathname === '/dashboard') {
    if (session.user?.role === 'teacher') {
      redirect('/dashboard/teacher');
    } else if (session.user?.role === 'student') {
      redirect('/dashboard/student');
    }
  }

  return <>{children}</>;
}
