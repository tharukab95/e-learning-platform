/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React, { useState, useRef } from 'react';
import AnalyticsTable from '@/components/AnalyticsTable';
import NotificationItem from '@/components/NotificationItem';
import { signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSession } from 'next-auth/react';
import ClassCard from '@/components/ClassCard';
import CreateClassModal from './CreateClassModal';
import { useRouter } from 'next/navigation';

interface CreateClassFormValues {
  title: string;
  subject: string;
  description: string;
  thumbnail?: FileList;
}

const createClass = async (data: FormData) => {
  const response = await api.post('/classes', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const mockAnalytics = [
  { studentName: 'Charlie', completionRate: 85, submissionDate: '2024-07-20' },
  { studentName: 'Diana', completionRate: 92, submissionDate: '2024-07-19' },
];

const mockNotifications = [
  {
    id: '1',
    message: 'Bob submitted an assessment.',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: '2',
    message: 'New video uploaded to "Intro to calculus".',
    timestamp: new Date().toISOString(),
    isRead: true,
  },
];

export default function TeacherDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateClassFormValues>();
  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      setShowModal(false);
      reset();
      // Optionally refresh class list here
    },
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [createdClasses, setCreatedClasses] = useState<any[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<
    Record<string, number>
  >({});
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch all created classes on mount
  React.useEffect(() => {
    const fetchClasses = async () => {
      const token = (session?.user as any)?.access_token;
      if (!token) return;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const allClasses = await res.json();
        setCreatedClasses(Array.isArray(allClasses) ? allClasses : []);
        // Fetch enrollment counts for each class
        const counts: Record<string, number> = {};
        await Promise.all(
          (Array.isArray(allClasses) ? allClasses : []).map(async (c: any) => {
            const countRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
              }/api/classes/${c.id}/students`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            if (countRes.ok) {
              const students = await countRes.json();
              counts[c.id] = Array.isArray(students) ? students.length : 0;
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

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async (formData: FormData) => {
    setIsPending(true);
    const token = (session?.user as any)?.access_token;
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/classes`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (res.ok) {
      const allRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (allRes.ok) {
        const allClasses = await allRes.json();
        setCreatedClasses(Array.isArray(allClasses) ? allClasses : []);
      }
      setShowModal(false);
    }
    setIsPending(false);
  };

  // Calculate total enrolled students
  const totalEnrolled = Object.values(enrollmentCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <button className="btn btn-error" onClick={() => signOut()}>
          Logout
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Enrolled Students</div>
          <div className="stat-value">{totalEnrolled}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value">88%</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Upcoming Assessments</div>
          <div className="stat-value">3</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-x-4">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Create New Class
        </button>
        <button className="btn btn-secondary">Upload Video</button>
        <button className="btn btn-accent">Create Assessment</button>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      {/* Show all created classes with nice card UI */}
      {createdClasses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Your Created Classes</h2>
          <div className="flex flex-wrap gap-4">
            {createdClasses.map((c) => (
              <div key={c.id} className="relative">
                <ClassCard
                  classInfo={c}
                  onClick={() => router.push(`/classes/${c.id}`)}
                />
                <div className="absolute top-2 left-2 bg-teal-700 text-white text-xs rounded-full px-2 py-0.5 shadow">
                  {enrollmentCounts[c.id] === 1
                    ? '1 student'
                    : `${enrollmentCounts[c.id] ?? 0} students`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notifications */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Notifications</h2>
          <div className="bg-white rounded shadow">
            {mockNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Student Progress */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
          <AnalyticsTable data={mockAnalytics} />
        </div>
      </div>
    </div>
  );
}
