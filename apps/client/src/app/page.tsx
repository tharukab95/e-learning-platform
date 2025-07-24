import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function Index() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/auth/login');
  }
  if (session.user.role === 'teacher') {
    redirect('/dashboard/teacher');
  } else if (session.user.role === 'student') {
    redirect('/dashboard/student');
  } else {
    redirect('/auth/login');
  }
  return null;
}
