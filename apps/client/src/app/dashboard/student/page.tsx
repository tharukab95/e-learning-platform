/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React from 'react';
import ClassCard from '@/components/ClassCard';
import NotificationItem from '@/components/NotificationItem';
import Link from 'next/link';

const mockEnrolledClasses = [
  { id: '1', title: 'Intro to Calculus', subject: 'Math' },
  { id: '2', title: 'Modern Physics', subject: 'Science' },
];

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
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrolled Classes */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Enrolled Classes</h2>
          <div className="space-y-4">
            {mockEnrolledClasses.map((c) => (
              <ClassCard key={c.id} classInfo={c} onEnroll={() => {}} />
            ))}
          </div>
          <Link
            href="/dashboard/student/enroll"
            className="btn btn-secondary mt-4"
          >
            Enroll in a New Class
          </Link>
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

      {/* Recent Notifications */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Notifications</h2>
        <div className="bg-white rounded shadow">
          {mockNotifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
