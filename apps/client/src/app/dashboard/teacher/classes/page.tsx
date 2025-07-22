'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClassCard from '@/components/ClassCard';
import api from '@/lib/api';

export default function AllCreatedClassesPage() {
  const { data: session } = useSession();
  const [createdClasses, setCreatedClasses] = React.useState<any[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = React.useState<
    Record<string, number>
  >({});
  const router = useRouter();

  React.useEffect(() => {
    const fetchClasses = async () => {
      const res = await api.get('/classes');
      if (res.status === 200) {
        const allClasses = res.data;
        setCreatedClasses(Array.isArray(allClasses) ? allClasses : []);
        // Fetch enrollment counts for each class
        const counts: Record<string, number> = {};
        await Promise.all(
          (Array.isArray(allClasses) ? allClasses : []).map(async (c: any) => {
            const countRes = await api.get(`/classes/${c.id}/students`);
            if (countRes.status === 200) {
              const students = countRes.data;
              const uniqueIds = new Set(
                (Array.isArray(students) ? students : []).map(
                  (s: any) => s.studentId || s.id
                )
              );
              counts[c.id] = uniqueIds.size;
            } else {
              counts[c.id] = 0;
            }
          })
        );
        setEnrollmentCounts(counts);
      }
    };
    fetchClasses();
  }, [session?.user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-tight">
            E-Learn
          </span>
          <span className="ml-4 text-lg text-indigo-100 font-medium">
            All Created Classes
          </span>
        </div>
        <button
          className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
          onClick={() => router.push('/dashboard/teacher')}
        >
          Back
        </button>
      </header>
      <main className="max-w-6xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-700">
            Your Created Classes
          </h2>
          <div className="flex flex-wrap gap-4">
            {createdClasses.length === 0 ? (
              <div className="text-gray-500">No classes found.</div>
            ) : (
              createdClasses.map((c) => (
                <div key={c.id} className="relative">
                  <ClassCard
                    classInfo={c}
                    onClick={() => router.push(`/classes/${c.id}/lesson-plan`)}
                  />
                  <div className="absolute top-2 left-2 bg-indigo-700 text-white text-xs rounded-full px-2 py-0.5 shadow">
                    {enrollmentCounts[c.id] === 1
                      ? '1 student'
                      : `${enrollmentCounts[c.id] ?? 0} students`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
