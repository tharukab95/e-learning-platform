/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import CreateClassModal from './CreateClassModal';
import { useRouter } from 'next/navigation';
import TeacherHeader from './TeacherHeader';
import TeacherMetrics from './TeacherMetrics';
import TeacherClassList from './TeacherClassList';
import TeacherLessonPlanTable from './TeacherLessonPlanTable';
import api from '@/lib/api';
import {
  useCreatedClasses,
  useEnrollmentCounts,
  useUpcomingAssessments,
  useLessonPlanCompletion,
  useCreateClass,
} from './teacherDashboardQueries';
import TeacherAssessmentModal from './TeacherAssessmentModal';
import { Lesson } from '@/types/models';
import { useNotificationsStore } from '@/state/notifications';

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const mutation = useCreateClass();

  // Assessment creation modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    classId: '',
    lessonId: '',
    title: '',
    deadline: '',
    file: null as File | null,
  });
  const [assessmentLessons, setAssessmentLessons] = useState<Lesson[]>([]);
  const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const assessmentFileInputRef = useRef<HTMLInputElement>(null);

  const notifications = useNotificationsStore((s) => s.notifications);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch all created classes
  const { data: createdClasses = [] } = useCreatedClasses(session?.user);
  // Fetch enrollment counts and distinct student count
  const { data: enrollmentData = { counts: {}, distinctStudentCount: 0 } } =
    useEnrollmentCounts(createdClasses, session?.user);
  const enrollmentCounts = enrollmentData.counts || {};
  const distinctStudentCount = enrollmentData.distinctStudentCount || 0;
  // Fetch upcoming assessments
  const { data: upcomingAssessments = [] } = useUpcomingAssessments(
    createdClasses,
    session?.user
  );
  // Fetch lesson plan completion
  const { data: lessonPlanCompletion = [] } = useLessonPlanCompletion(
    createdClasses,
    session?.user
  );

  // Fetch lessons when class changes (for assessment modal)
  React.useEffect(() => {
    const fetchLessons = async () => {
      if (!assessmentForm.classId) {
        setAssessmentLessons([]);
        return;
      }
      const res = await api.get(`/classes/${assessmentForm.classId}/lessons`);
      if (res.status === 200) {
        const lessons = res.data;
        setAssessmentLessons(Array.isArray(lessons) ? lessons : []);
      } else {
        setAssessmentLessons([]);
      }
    };
    fetchLessons();
  }, [assessmentForm.classId]);

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
      const res = await api.post('/assessments', formData);
      if (res.status !== 200 && res.status !== 201)
        throw new Error('Failed to create assessment');
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

  const onSubmit = async (formData: FormData) => {
    setIsPending(true);
    await mutation.mutateAsync(formData);
    setShowModal(false);
    setIsPending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header NavBar */}
      <TeacherHeader
        notifications={notifications}
        onShowNotifications={() => setShowNotifications((v) => !v)}
        showNotifications={showNotifications}
        onSignOut={signOut}
      >
        {/* Notification Dropdown */}
        {showNotifications && notifications.length > 0 && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto border border-gray-200">
            <div className="p-3 border-b font-bold">Notifications</div>
            {notifications.length === 0 ? (
              <div className="p-3 text-gray-500">No notifications</div>
            ) : (
              notifications.map((n: any, idx: number) => (
                <div
                  key={n.id || idx}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    !n.isRead ? 'font-semibold' : ''
                  } rounded-sm${
                    idx !== notifications.length - 1 ? ' border-b' : ''
                  }`}
                  onClick={async () => {
                    setShowNotifications(false);
                    // If notification has lessonId and classId, route to lesson page and expand
                    if (n.lessonId && n.classId) {
                      router.push(
                        `/classes/${n.classId}?expandLesson=${n.lessonId}`
                      );
                    } else if (n.link) {
                      router.push(n.link);
                    }
                  }}
                >
                  {n.message || n.payload?.message}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.timestamp || n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </TeacherHeader>
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
          <TeacherMetrics
            distinctStudentCount={distinctStudentCount}
            upcomingAssessmentsCount={upcomingAssessments.length}
          />
          {/* Show all created classes with nice card UI */}
          <TeacherClassList
            createdClasses={createdClasses}
            enrollmentCounts={enrollmentCounts}
            router={router}
          />
          {/* Lesson Plan Completion Table */}
          <TeacherLessonPlanTable lessonPlanCompletion={lessonPlanCompletion} />
          {/* Create Class Modal */}
          <CreateClassModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={onSubmit}
            isPending={isPending}
          />
          {/* Create Assessment Modal */}
          <TeacherAssessmentModal
            open={showAssessmentModal}
            onClose={() => setShowAssessmentModal(false)}
            onSubmit={handleCreateAssessment}
            assessmentForm={assessmentForm}
            assessmentLessons={assessmentLessons}
            createdClasses={createdClasses}
            handleAssessmentInputChange={handleAssessmentInputChange}
            handleAssessmentFileChange={handleAssessmentFileChange}
            isSubmitting={isAssessmentSubmitting}
            error={assessmentError}
            fileInputRef={
              assessmentFileInputRef as React.RefObject<HTMLInputElement>
            }
          />
        </div>
      </main>
    </div>
  );
}
