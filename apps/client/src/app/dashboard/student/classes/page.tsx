'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import ClassCard from '@/components/ClassCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { IoLogOutOutline } from 'react-icons/io5';

export default function AllStudentClassesPage() {
  const { data: session } = useSession();
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const router = useRouter();
  const token = (session?.user as any)?.access_token;

  const fetchClasses = useCallback(async () => {
    if (!token) {
      setAllClasses([]);
      setEnrolledClasses([]);
      setLoadingClasses(false);
      return;
    }
    setLoadingClasses(true);
    const [allRes, enrolledRes] = await Promise.all([
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes/enrolled`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
    ]);
    const all = allRes.ok ? await allRes.json() : [];
    const enrolled = enrolledRes.ok ? await enrolledRes.json() : [];
    setAllClasses(Array.isArray(all) ? all : []);
    setEnrolledClasses(Array.isArray(enrolled) ? enrolled : []);
    setLoadingClasses(false);
  }, [token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Compute available classes as allClasses minus enrolledClasses
  const availableClasses = useMemo(() => {
    const enrolledIds = new Set(enrolledClasses.map((c) => c.id));
    return allClasses.filter((c) => !enrolledIds.has(c.id));
  }, [allClasses, enrolledClasses]);

  const handleEnroll = async (classId: string) => {
    if (!token) return;
    await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/classes/${classId}/enroll`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchClasses();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-tight">
            E-Learn
          </span>
          <span className="ml-4 text-lg text-indigo-100 font-medium">
            All Classes
          </span>
        </div>
        <button
          className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
          onClick={() => router.push('/dashboard/student')}
        >
          Back
        </button>
      </header>
      <main className="max-w-6xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-700">
            All Classes
          </h2>
          {loadingClasses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="w-[320px] bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden flex flex-col p-3"
                >
                  <Skeleton height={240} className="mb-3" />
                  <Skeleton height={24} width="80%" className="mb-2" />
                  <Skeleton height={16} width="60%" />
                  <div className="mt-4">
                    <Skeleton height={32} width={100} />
                  </div>
                </div>
              ))}
            </div>
          ) : allClasses.length === 0 ? (
            <div className="text-gray-500">No classes found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {enrolledClasses.map((c) => (
                <div
                  key={c.id}
                  className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-gradient-to-br from-indigo-50 to-white"
                  onClick={() => router.push(`/classes/${c.id}`)}
                >
                  <ClassCard classInfo={c} enrolled />
                </div>
              ))}
              {availableClasses.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-white p-0 flex flex-col justify-between"
                >
                  <ClassCard classInfo={c} onEnroll={handleEnroll} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
