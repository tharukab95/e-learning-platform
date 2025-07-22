/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React, { useEffect, useState } from 'react';
import ClassCard from '@/components/ClassCard';
import NotificationItem from '@/components/NotificationItem';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const router = useRouter();
  const token = (session?.user as any)?.access_token;
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const token = (session?.user as any)?.access_token;
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
    };
    fetchClasses();
  }, [session?.user]);

  // Fetch upcoming assessments for the next 7 days
  useEffect(() => {
    const fetchUpcoming = async () => {
      if (
        !Array.isArray(enrolledClasses) ||
        enrolledClasses.length === 0 ||
        !token
      ) {
        setUpcomingAssessments([]);
        return;
      }
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      const allUpcoming: any[] = [];
      for (const c of enrolledClasses) {
        // Fetch lessons for this class
        const lessonsRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          }/api/classes/${c.id}/lessons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lessons = lessonsRes.ok ? await lessonsRes.json() : [];
        for (const lesson of lessons) {
          // Fetch assessments for this lesson
          const assessmentsRes = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            }/api/lessons/${lesson.id}/assessments`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const assessments = assessmentsRes.ok
            ? await assessmentsRes.json()
            : [];
          for (const a of assessments) {
            // Only show if not submitted and due in next 7 days
            const due = new Date(a.deadline);
            const submitted =
              Array.isArray(a.submissions) &&
              a.submissions.some(
                (s: any) => s.studentId === (session?.user as any)?.id
              );
            if (!submitted && due >= now && due <= weekFromNow) {
              allUpcoming.push({
                assessmentTitle: a.title,
                due: due,
                className: c.title,
                lessonName: lesson.name,
              });
            }
          }
        }
      }
      // Sort by due date
      allUpcoming.sort((a, b) => a.due.getTime() - b.due.getTime());
      setUpcomingAssessments(allUpcoming);
    };
    fetchUpcoming();
  }, [enrolledClasses, token, session?.user]);

  // Compute available classes as allClasses minus enrolledClasses
  const availableClasses = useMemo(() => {
    const enrolledIds = new Set(enrolledClasses.map((c) => c.id));
    return allClasses.filter((c) => !enrolledIds.has(c.id));
  }, [allClasses, enrolledClasses]);

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
    // Refetch classes after enrolling
    // This will be handled by the useEffect
    // Optionally, you can force a reload or trigger a state update
    // For now, do nothing here
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
        {/* All Classes (Enrolled and Available) */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Classes</h2>
          {loadingClasses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="w-[200px] bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden flex flex-col p-3"
                >
                  <Skeleton height={180} className="mb-3" />
                  <Skeleton height={24} width="80%" className="mb-2" />
                  <Skeleton height={16} width="60%" />
                  <div className="mt-4">
                    <Skeleton height={32} width={100} />
                  </div>
                </div>
              ))}
            </div>
          ) : enrolledClasses.length + availableClasses.length === 0 ? (
            <div className="text-gray-500">No classes found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledClasses.map((c) => (
                <div
                  key={c.id}
                  className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all"
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

        {/* Upcoming Lessons & Assessments */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming</h2>
          {loadingClasses ? (
            <ul className="list-disc pl-5 space-y-2">
              {[...Array(3)].map((_, idx) => (
                <li key={idx}>
                  <Skeleton height={20} width="80%" />
                </li>
              ))}
            </ul>
          ) : upcomingAssessments.length === 0 ? (
            <div className="text-gray-500">
              No upcoming assessments in the next week.
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {upcomingAssessments.map((a, idx) => (
                <li key={idx} className="">
                  <span className="font-semibold">{a.assessmentTitle}</span>{' '}
                  &mdash;
                  <span className="text-gray-700">{a.className}</span> /{' '}
                  <span className="text-gray-700">{a.lessonName}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    (Due: {a.due.toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Notifications</h2>
        {/* Add notifications here if needed */}
      </div>
    </div>
  );
}
