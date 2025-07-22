/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React, { useEffect, useState } from 'react';
import ClassCard from '@/components/ClassCard';
import NotificationItem from '@/components/NotificationItem';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
}

const mockNotifications = [
  {
    id: '1',
    message: 'New video uploaded to "Intro to calculus".',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: '2',
    message: 'Assessment for "Modern Physics" is due tomorrow.',
    timestamp: new Date().toISOString(),
    isRead: true,
  },
];

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const router = useRouter();
  const token = (session?.user as any)?.access_token;

  useEffect(() => {
    const token = (session?.user as any)?.access_token;
    if (!token) return;
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/classes/enrolled`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => setEnrolledClasses(Array.isArray(data) ? data : []))
      .catch(() => setEnrolledClasses([]));
  }, [session?.user]);

  const openEnrollModal = async () => {
    setShowModal(true);
    setLoadingAvailable(true);
    const token = (session?.user as any)?.access_token;
    if (!token) return;
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/classes`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const allClasses = await res.json();
    // Filter out already enrolled classes
    const enrolledIds = new Set(enrolledClasses.map((c) => c.id));
    const available = Array.isArray(allClasses)
      ? allClasses.filter((c) => !enrolledIds.has(c.id))
      : [];
    setAvailableClasses(available);
    setLoadingAvailable(false);
  };

  const handleEnroll = async (classId: string) => {
    const token = (session?.user as any)?.access_token;
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
    // Refresh enrolled classes
    setEnrolledClasses((prev) => [
      ...prev,
      availableClasses.find((c) => c.id === classId),
    ]);
    setShowModal(false);
  };

  // Fetch lessons for a class when expanded
  const handleClassClick = async (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      return;
    }
    setExpandedClass(classId);
    if (!classLessons[classId] && token) {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes/${classId}/lessons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const lessons = await res.json();
        setClassLessons((prev) => ({ ...prev, [classId]: lessons }));
      }
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <button className="btn btn-error" onClick={() => signOut()}>
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrolled Classes */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Enrolled Classes</h2>
          {Array.isArray(enrolledClasses) && enrolledClasses.length === 0 ? (
            <div className="text-gray-500">No enrolled classes.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(enrolledClasses) &&
                enrolledClasses.map((c) => (
                  <div
                    key={c.id}
                    className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all"
                    onClick={() => router.push(`/classes/${c.id}`)}
                  >
                    <ClassCard classInfo={c} />
                  </div>
                ))}
            </div>
          )}
          <button className="btn btn-secondary mt-4" onClick={openEnrollModal}>
            Enroll in a New Class
          </button>
        </div>

        {/* Upcoming Lessons & Assessments */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Calculus Lesson 5 - Due: 2024-07-25</li>
            <li>Physics Assessment 2 - Due: 2024-07-28</li>
          </ul>
        </div>
      </div>

      {/* Modal for enrolling in a class */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Available Classes</h2>
            {loadingAvailable ? (
              <div>Loading...</div>
            ) : availableClasses.length === 0 ? (
              <div className="text-gray-500">No classes created yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableClasses.map((c) => (
                  <ClassCard
                    key={c.id}
                    classInfo={c}
                    onEnroll={() => handleEnroll(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Notifications</h2>
        <div className="bg-white rounded shadow">
          {/* Keep your mockNotifications or fetch real notifications here */}
        </div>
      </div>
    </div>
  );
}
