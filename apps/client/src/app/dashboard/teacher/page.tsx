/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React, { useState, useRef, useEffect } from 'react';
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

  // Assessment creation modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    classId: '',
    lessonId: '',
    title: '',
    deadline: '',
    file: null as File | null,
  });
  const [assessmentLessons, setAssessmentLessons] = useState<any[]>([]);
  const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const assessmentFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch lessons when class changes
  useEffect(() => {
    const fetchLessons = async () => {
      if (!assessmentForm.classId) {
        setAssessmentLessons([]);
        return;
      }
      const token = (session?.user as any)?.access_token;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/classes/${assessmentForm.classId}/lessons`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) {
        const lessons = await res.json();
        setAssessmentLessons(Array.isArray(lessons) ? lessons : []);
      } else {
        setAssessmentLessons([]);
      }
    };
    fetchLessons();
  }, [assessmentForm.classId, session?.user]);

  const handleAssessmentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setAssessmentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAssessmentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAssessmentForm((prev) => ({
      ...prev,
      file: e.target.files?.[0] || null,
    }));
  };
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssessmentSubmitting(true);
    setAssessmentError('');
    try {
      const formData = new FormData();
      formData.append('title', assessmentForm.title);
      formData.append('deadline', assessmentForm.deadline);
      formData.append('lessonId', assessmentForm.lessonId);
      if (assessmentForm.file) formData.append('pdf', assessmentForm.file);
      const token = (session?.user as any)?.access_token;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/assessments`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error('Failed to create assessment');
      setShowAssessmentModal(false);
      setAssessmentForm({
        classId: '',
        lessonId: '',
        title: '',
        deadline: '',
        file: null,
      });
    } catch (err: any) {
      setAssessmentError(err?.message || 'Failed to create assessment');
    } finally {
      setIsAssessmentSubmitting(false);
    }
  };

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
        <button
          className="btn btn-accent"
          onClick={() => setShowAssessmentModal(true)}
        >
          Create Assessment
        </button>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      {/* Create Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowAssessmentModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Create Assessment</h2>
            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  name="classId"
                  value={assessmentForm.classId}
                  onChange={handleAssessmentInputChange}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select a class</option>
                  {createdClasses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lesson</label>
                <select
                  name="lessonId"
                  value={assessmentForm.lessonId}
                  onChange={handleAssessmentInputChange}
                  className="select select-bordered w-full"
                  required
                  disabled={!assessmentForm.classId}
                >
                  <option value="">Select a lesson</option>
                  {assessmentLessons.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assessment Name
                </label>
                <input
                  type="text"
                  name="title"
                  value={assessmentForm.title}
                  onChange={handleAssessmentInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={assessmentForm.deadline}
                  onChange={handleAssessmentInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assessment PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  name="pdf"
                  ref={assessmentFileInputRef}
                  onChange={handleAssessmentFileChange}
                  className="file-input file-input-bordered w-full"
                  required
                />
              </div>
              {assessmentError && (
                <div className="text-red-500 text-sm">{assessmentError}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  onClick={() => setShowAssessmentModal(false)}
                  disabled={isAssessmentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  disabled={isAssessmentSubmitting}
                >
                  {isAssessmentSubmitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
