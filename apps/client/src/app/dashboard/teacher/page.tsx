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
import { useMemo } from 'react';

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
  const [distinctStudentCount, setDistinctStudentCount] = useState(0);
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);
  const [lessonPlanCompletion, setLessonPlanCompletion] = useState<any[]>([]);
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
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) {
        const allClasses = await res.json();
        setCreatedClasses(Array.isArray(allClasses) ? allClasses : []);
        // Fetch enrollment counts for each class and collect unique students
        const studentSet = new Set();
        const counts: Record<string, number> = {};
        await Promise.all(
          (Array.isArray(allClasses) ? allClasses : []).map(async (c: any) => {
            const countRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
              }/api/classes/${c.id}/students`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (countRes.ok) {
              const students = await countRes.json();
              // Count unique student IDs for this class
              const uniqueIds = new Set(
                (Array.isArray(students) ? students : []).map(
                  (s: any) => s.studentId || s.id
                )
              );
              counts[c.id] = uniqueIds.size;
              (Array.isArray(students) ? students : []).forEach((s: any) =>
                studentSet.add(s.studentId || s.id)
              );
            } else {
              counts[c.id] = 0;
            }
          })
        );
        setEnrollmentCounts(counts);
        setDistinctStudentCount(studentSet.size);
      }
    };
    fetchClasses();
  }, [session?.user]);

  // Fetch upcoming assessments for all classes
  useEffect(() => {
    const fetchUpcoming = async () => {
      const token = (session?.user as any)?.access_token;
      if (!token || !createdClasses.length) {
        setUpcomingAssessments([]);
        return;
      }
      const allUpcoming: any[] = [];
      for (const c of createdClasses) {
        const lessonsRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          }/api/classes/${c.id}/lessons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lessons = lessonsRes.ok ? await lessonsRes.json() : [];
        for (const lesson of lessons) {
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
            const due = new Date(a.deadline);
            if (due > new Date()) {
              allUpcoming.push({
                assessmentTitle: a.title,
                due,
                className: c.title,
                lessonName: lesson.name,
              });
            }
          }
        }
      }
      allUpcoming.sort((a, b) => a.due.getTime() - b.due.getTime());
      setUpcomingAssessments(allUpcoming);
    };
    fetchUpcoming();
  }, [createdClasses, session?.user]);

  // Fetch lesson plan completion for each class
  useEffect(() => {
    const fetchLessonPlans = async () => {
      const token = (session?.user as any)?.access_token;
      if (!token || !createdClasses.length) {
        setLessonPlanCompletion([]);
        return;
      }
      const plans: any[] = [];
      for (const c of createdClasses) {
        const lessonsRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          }/api/classes/${c.id}/lessons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lessons = lessonsRes.ok ? await lessonsRes.json() : [];
        const total = lessons.length;
        const withContent = lessons.filter(
          (l: any) => l.pdfUrl || (l.videos && l.videos.length)
        ).length;
        plans.push({ className: c.title, total, withContent });
      }
      setLessonPlanCompletion(plans);
    };
    fetchLessonPlans();
  }, [createdClasses, session?.user]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header NavBar */}
      <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-tight">
            E-Learn
          </span>
          <span className="ml-4 text-lg text-indigo-100 font-medium">
            Teacher Dashboard
          </span>
        </div>
        <button
          className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
          onClick={() => signOut()}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75v-1.5A2.25 2.25 0 0015 3h-6a2.25 2.25 0 00-2.25 2.25v1.5m12.75 0h-13.5m13.5 0v12.75A2.25 2.25 0 0115 21h-6a2.25 2.25 0 01-2.25-2.25V6.75m13.5 0v0z"
            />
          </svg>
          Logout
        </button>
      </header>
      {/* Main Content Card */}
      <main className="max-w-6xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-8">
          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="btn bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-full px-6 py-2 shadow hover:from-blue-700 hover:to-indigo-800 transition"
              onClick={() => setShowModal(true)}
            >
              + Create Class
            </button>
            <button
              className="btn bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-full px-6 py-2 shadow hover:from-indigo-600 hover:to-blue-700 transition"
              onClick={() => setShowAssessmentModal(true)}
            >
              + Create Assessment
            </button>
          </div>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-2">
            <div className="rounded-xl bg-gradient-to-br from-indigo-100 to-white shadow p-6 flex flex-col items-center">
              <div className="text-sm font-medium text-indigo-700 mb-1">
                Enrolled Students
              </div>
              <div className="text-3xl font-bold text-indigo-900">
                {distinctStudentCount}
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-100 to-white shadow p-6 flex flex-col items-center">
              <div className="text-sm font-medium text-blue-700 mb-1">
                Upcoming Assessments
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {upcomingAssessments.length}
              </div>
            </div>
          </div>
          {/* Show all created classes with nice card UI */}
          {createdClasses.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4 text-indigo-700">
                Your Created Classes
              </h2>
              <div className="flex flex-wrap gap-4">
                {createdClasses.map((c) => (
                  <div key={c.id} className="relative">
                    <ClassCard
                      classInfo={c}
                      onClick={() =>
                        router.push(`/classes/${c.id}/lesson-plan`)
                      }
                    />
                    <div className="absolute top-2 left-2 bg-indigo-700 text-white text-xs rounded-full px-2 py-0.5 shadow">
                      {enrollmentCounts[c.id] === 1
                        ? '1 student'
                        : `${enrollmentCounts[c.id] ?? 0} students`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Lesson Plan Completion Table */}
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">
              Lesson Plan Completion
            </h2>
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="min-w-full bg-white rounded-xl">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="py-3 px-4 text-left font-semibold text-indigo-700">
                      Class
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-indigo-700">
                      Covered/Completion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lessonPlanCompletion.map((plan, idx) => (
                    <tr
                      key={idx}
                      className="border-b last:border-none hover:bg-indigo-50/40 transition"
                    >
                      <td className="py-3 px-4">{plan.className}</td>
                      <td className="py-3 px-4">
                        {plan.withContent}/{plan.total} (
                        {plan.total
                          ? Math.round((plan.withContent / plan.total) * 100)
                          : 0}
                        %)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <label className="block text-sm font-medium mb-1">
                      Class
                    </label>
                    <select
                      name="classId"
                      value={assessmentForm.classId}
                      onChange={handleAssessmentInputChange}
                      className="select select-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                    <label className="block text-sm font-medium mb-1">
                      Lesson
                    </label>
                    <select
                      name="lessonId"
                      value={assessmentForm.lessonId}
                      onChange={handleAssessmentInputChange}
                      className="select select-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                      className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                      className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                      className="file-input file-input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
                      required
                    />
                  </div>
                  {assessmentError && (
                    <div className="text-red-500 text-sm">
                      {assessmentError}
                    </div>
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
                      {isAssessmentSubmitting
                        ? 'Creating...'
                        : 'Create Assessment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
