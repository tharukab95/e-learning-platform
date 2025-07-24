'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useSearchParams } from 'next/navigation';
import { IoLogOutOutline } from 'react-icons/io5';
import VideoPlayer from '@/components/VideoPlayer';

interface Lesson {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
}

interface Assessment {
  id: string;
  title: string;
  pdfUrl: string;
  deadline: string;
  submissions?: any[];
}

interface Video {
  id: string;
  title: string;
  s3Url: string;
  hlsPath: string;
}

export default function ClassDetailsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { classId } = useParams() as { classId: string };
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [lessonDetails, setLessonDetails] = useState<
    Record<string, { assessments: Assessment[]; videos: Video[] }>
  >({});
  const [refreshLessons, setRefreshLessons] = useState(0);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Assessment creation modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState<string | null>(
    null
  );
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    deadline: '',
    file: null as File | null,
  });
  const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const assessmentFileInputRef = useRef<HTMLInputElement>(null);

  // Mark assessment modal state (teacher)
  const [markAssessmentId, setMarkAssessmentId] = useState<string | null>(null);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<any[]>([]);
  const [grading, setGrading] = useState<
    Record<string, { grade: string; feedback: string }>
  >({});
  const [gradingError, setGradingError] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  // Student submission modal state
  const [submitAssessmentId, setSubmitAssessmentId] = useState<string | null>(
    null
  );
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const isTeacher = session?.user?.role === 'teacher';
  const token = (session?.user as any)?.access_token;
  const searchParams = useSearchParams();
  const highlightAssessment = searchParams.get('highlightAssessment');
  const highlightLessonId = React.useMemo(() => {
    if (!highlightAssessment) return null;
    for (const lesson of lessons) {
      const details = lessonDetails[lesson.id];
      if (
        details &&
        details.assessments.some((a: any) => a.id === highlightAssessment)
      ) {
        return lesson.id;
      }
    }
    return null;
  }, [highlightAssessment, lessons, lessonDetails]);

  const allLessonDetailsLoaded =
    lessons.length > 0 && lessons.every((lesson) => lessonDetails[lesson.id]);

  React.useEffect(() => {
    console.log('highlightAssessment:', highlightAssessment);
    console.log('highlightLessonId:', highlightLessonId);
    console.log('allLessonDetailsLoaded:', allLessonDetailsLoaded);
    if (highlightLessonId) {
      console.log(
        'lessonDetails[highlightLessonId]:',
        lessonDetails[highlightLessonId]
      );
    }
    if (
      highlightLessonId &&
      allLessonDetailsLoaded &&
      lessonDetails[highlightLessonId] &&
      lessonDetails[highlightLessonId].assessments?.length > 0
    ) {
      setExpandedLesson(highlightLessonId);
    }
  }, [highlightLessonId, lessonDetails, allLessonDetailsLoaded, lessons]);

  React.useEffect(() => {
    if (highlightAssessment && assessmentRefs.current[highlightAssessment]) {
      assessmentRefs.current[highlightAssessment]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightAssessment]);

  // Fetch lessons for this class
  useEffect(() => {
    if (!classId || !token) return;
    setLoading(true);
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/classes/${classId}/lessons`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setLessons(Array.isArray(data) ? data : []))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [classId, token, showModal, refreshLessons]);

  // Fetch assessments and videos for each lesson
  useEffect(() => {
    if (!lessons.length || !token) return;
    const fetchDetails = async () => {
      const details: Record<
        string,
        { assessments: Assessment[]; videos: Video[] }
      > = {};
      await Promise.all(
        lessons.map(async (lesson) => {
          const [assessmentsRes, videosRes] = await Promise.all([
            fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
              }/api/lessons/${lesson.id}/assessments`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
              }/api/lessons/${lesson.id}/videos`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
          ]);
          const assessments = assessmentsRes.ok
            ? await assessmentsRes.json()
            : [];
          const videos = videosRes.ok ? await videosRes.json() : [];
          details[lesson.id] = { assessments, videos };
        })
      );
      setLessonDetails(details);
    };
    fetchDetails();
  }, [lessons, token]);

  // Fetch submissions for marking
  useEffect(() => {
    if (markAssessmentId && isTeacher) {
      const fetchSubmissions = async () => {
        const token = (session?.user as any)?.access_token;
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          }/api/assessments/${markAssessmentId}/submissions`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) {
          const data = await res.json();
          setAssessmentSubmissions(Array.isArray(data) ? data : []);
        } else {
          setAssessmentSubmissions([]);
        }
      };
      fetchSubmissions();
    }
  }, [markAssessmentId, isTeacher, session?.user]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  // Handle lesson creation
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      setError('Lesson name is required');
      return;
    }

    if (!form.description.trim()) {
      setError('Lesson description is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('classId', classId);
      if (form.file) formData.append('pdf', form.file);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/lessons`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error('Failed to create lesson');
      setShowModal(false);
      setForm({ name: '', description: '', file: null });
    } catch (err: any) {
      setError(err?.message || 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle lesson edit
  const openEditModal = (lesson: Lesson) => {
    setEditLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description,
      file: null,
    });
    setEditError('');
  };
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };
  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLesson) return;
    setIsEditSubmitting(true);
    setEditError('');
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      if (editForm.file) formData.append('pdf', editForm.file);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/lessons/${editLesson.id}`,
        {
          method: 'PATCH',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error('Failed to update lesson');
      setEditLesson(null);
      setRefreshLessons((v) => v + 1);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update lesson');
    } finally {
      setIsEditSubmitting(false);
    }
  };
  // Handle lesson delete
  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/lessons/${deleteLessonId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Failed to delete lesson');
      setDeleteLessonId(null);
    } catch (err) {
      // Optionally show error
      setDeleteLessonId(null);
    }
  };

  const handleAssessmentInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
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
    if (!showAssessmentModal) return;
    setIsAssessmentSubmitting(true);
    setAssessmentError('');
    try {
      const formData = new FormData();
      formData.append('title', assessmentForm.title);
      formData.append('deadline', assessmentForm.deadline);
      formData.append('lessonId', showAssessmentModal);
      if (assessmentForm.file) formData.append('pdf', assessmentForm.file);
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
      setShowAssessmentModal(null);
      setAssessmentForm({ title: '', deadline: '', file: null });
      setRefreshLessons((v) => v + 1);
    } catch (err: any) {
      setAssessmentError(err?.message || 'Failed to create assessment');
    } finally {
      setIsAssessmentSubmitting(false);
    }
  };

  // Handle grading input
  const handleGradingInput = (
    submissionId: string,
    field: 'grade' | 'feedback',
    value: string
  ) => {
    setGrading((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value },
    }));
  };

  // Handle mark submission
  const handleMarkSubmission = async (submissionId: string) => {
    setIsGrading(true);
    setGradingError('');
    try {
      const { grade, feedback } = grading[submissionId] || {};
      const token = (session?.user as any)?.access_token;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/assessments/submissions/${submissionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ grade: Number(grade), feedback }),
        }
      );
      if (!res.ok) throw new Error('Failed to mark submission');
      // Optionally refresh submissions
      setAssessmentSubmissions((subs) =>
        subs.map((s) => (s.id === submissionId ? { ...s, grade, feedback } : s))
      );
    } catch (err: any) {
      setGradingError(err?.message || 'Failed to mark submission');
    } finally {
      setIsGrading(false);
    }
  };

  // Handle student assessment submission
  const handleAssessmentFileChangeStudent = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSubmissionFile(e.target.files?.[0] || null);
  };
  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAssessmentId || !submissionFile) return;
    setIsSubmittingAssessment(true);
    setSubmissionError('');
    try {
      const formData = new FormData();
      formData.append('pdf', submissionFile);
      const token = (session?.user as any)?.access_token;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/assessments/${submitAssessmentId}/submit`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error('Failed to submit assessment');
      setSubmitAssessmentId(null);
      setSubmissionFile(null);
      setRefreshLessons((v) => v + 1);
    } catch (err: any) {
      setSubmissionError(err?.message || 'Failed to submit assessment');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  useEffect(() => {
    if (showAssessmentModal) {
      // console.log(
      //   'Assessment modal should be open for lesson',
      //   showAssessmentModal
      // );
    }
  }, [showAssessmentModal]);

  const assessmentRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  // Calculate assessment completion for students
  const userId = (session?.user as any)?.id;
  let totalAssessments = 0;
  let completedAssessments = 0;
  if (
    !isTeacher &&
    lessons.length > 0 &&
    Object.keys(lessonDetails).length > 0
  ) {
    for (const lesson of lessons) {
      const details = lessonDetails[lesson.id];
      if (details && Array.isArray(details.assessments)) {
        for (const a of details.assessments) {
          totalAssessments++;
          if (
            Array.isArray(a.submissions) &&
            a.submissions.some((s: any) => s.studentId === userId)
          ) {
            completedAssessments++;
          }
        }
      }
    }
  }
  const completionPercent = totalAssessments
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0;

  useEffect(() => {
    const expandLesson = searchParams.get('expandLesson');
    if (expandLesson) {
      setExpandedLesson(expandLesson);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header NavBar */}
      <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
            onClick={() => router.push('/dashboard/student')}
          >
            {/* Back arrow icon */}
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
          <span className="text-2xl font-bold text-white tracking-tight ml-4">
            Class Lessons
          </span>
        </div>
        <button
          className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
          onClick={() => router.push('/dashboard/student')}
        >
          <IoLogOutOutline className="w-5 h-5" />
          Dashboard
        </button>
      </header>

      {/* Main Content Card */}
      <main className="max-w-3xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-10">
          {/* Assessment Completion for Students */}
          {!isTeacher && totalAssessments > 0 && (
            <div className="mb-4 text-lg font-medium text-indigo-700">
              Assessment Completion: {completedAssessments}/{totalAssessments} (
              {completionPercent}%)
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-800">
              Class Lessons
            </h1>
            {isTeacher && (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                + Create Lesson
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow p-4 mb-2 flex flex-col"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Skeleton height={28} width="60%" className="mb-2" />
                      <Skeleton height={18} width="80%" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton circle width={32} height={32} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-gray-500">No lessons created yet.</div>
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson) => {
                const isExpanded = expandedLesson === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-xl shadow-md p-6 mb-2 flex flex-col border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => {
                        const hasVideo =
                          lessonDetails[lesson.id]?.videos?.length > 0 &&
                          lessonDetails[lesson.id].videos[0].hlsPath;
                        const hasContent = lesson.pdfUrl || hasVideo;
                        if (hasContent)
                          setExpandedLesson(isExpanded ? null : lesson.id);
                      }}
                    >
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-indigo-900 mb-1">
                          {lesson.name}
                        </h2>
                        <p className="text-gray-600 mb-0.5 text-sm">
                          {lesson.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTeacher && (
                          <>
                            <button
                              className="p-2 rounded-full hover:bg-gray-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(lesson);
                              }}
                              title="Edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-primary"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 14.362-14.303z"
                                />
                              </svg>
                            </button>
                            <button
                              className="p-2 rounded-full hover:bg-gray-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteLessonId(lesson.id);
                              }}
                              title="Delete"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-red-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                          title={isExpanded ? 'Hide PDF' : 'Show PDF'}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`w-6 h-6 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          >
                            {' '}
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />{' '}
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        {/* Show video if available, otherwise PDF if available */}
                        {lessonDetails[lesson.id]?.videos?.length > 0 &&
                        lessonDetails[lesson.id].videos[0].hlsPath ? (
                          <>
                            <div className="mb-6">
                              <VideoPlayer
                                src={lessonDetails[lesson.id].videos[0].hlsPath}
                                videoId={lessonDetails[lesson.id].videos[0].id}
                              />
                            </div>
                            {lesson.pdfUrl ? (
                              <iframe
                                src={lesson.pdfUrl}
                                title="Lesson PDF"
                                className="w-full h-96 rounded border mb-4"
                              />
                            ) : null}
                          </>
                        ) : lesson.pdfUrl ? (
                          <iframe
                            src={lesson.pdfUrl}
                            title="Lesson PDF"
                            className="w-full h-96 rounded border"
                          />
                        ) : null}
                        {/* Assessments under lesson */}
                        <div className="mt-4 flex items-center justify-between">
                          <h3 className="font-semibold mb-1 text-indigo-700">
                            Assessments
                          </h3>
                        </div>
                        {isTeacher && (
                          <div className="mb-2 flex justify-end">
                            <button
                              className="px-4 py-1 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-sm"
                              onClick={() => setShowAssessmentModal(lesson.id)}
                            >
                              + Create Assessment
                            </button>
                          </div>
                        )}
                        {lessonDetails[lesson.id]?.assessments?.length > 0 && (
                          <ul className="list-disc pl-5 mt-2">
                            {lessonDetails[lesson.id].assessments.map((a) => {
                              return (
                                <li
                                  key={a.id}
                                  ref={(el) => {
                                    assessmentRefs.current[a.id] = el;
                                  }}
                                  className={`flex items-center justify-between gap-2 py-1 px-1 transition-all duration-300 ${
                                    a.id === highlightAssessment
                                      ? 'bg-yellow-100 border-l-8 border-yellow-400 py-3 rounded-md shadow-sm'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {a.title}
                                    </span>
                                    {a.deadline && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        (Due:{' '}
                                        {new Date(
                                          a.deadline
                                        ).toLocaleDateString()}
                                        )
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={a.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-full hover:bg-gray-100 transition"
                                      title="Download Assignment"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 4.5v11m0 0l-4-4m4 4l4-4m-7 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5H7"
                                        />
                                      </svg>
                                    </a>
                                    {!isTeacher &&
                                      (() => {
                                        const userId = (session?.user as any)
                                          ?.id;
                                        const submissions = Array.isArray(
                                          (a as any).submissions
                                        )
                                          ? (a as any).submissions
                                          : [];
                                        const submitted = submissions.some(
                                          (s: any) => s.studentId === userId
                                        );
                                        if (submitted) {
                                          return (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                              Answer Submitted
                                            </span>
                                          );
                                        }
                                        return (
                                          <button
                                            className="px-3 py-1 rounded-full border border-primary text-primary text-xs hover:bg-primary hover:text-white transition bg-white"
                                            onClick={() =>
                                              setSubmitAssessmentId(a.id)
                                            }
                                          >
                                            Submit Answer
                                          </button>
                                        );
                                      })()}
                                    {isTeacher && (
                                      <button
                                        className="px-3 py-1 rounded-full border border-accent text-accent text-xs hover:bg-accent hover:text-white transition bg-white"
                                        onClick={() =>
                                          setMarkAssessmentId(a.id)
                                        }
                                      >
                                        Mark Assessment
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {/* Videos under lesson */}
                        {lessonDetails[lesson.id]?.videos?.length > 0 && (
                          <div className="mt-4">
                            <h3 className="font-semibold mb-1 text-indigo-700">
                              Videos
                            </h3>
                            <ul className="list-disc pl-5">
                              {lessonDetails[lesson.id].videos.map((v) => (
                                <li key={v.id}>
                                  <a
                                    href={v.s3Url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link link-secondary"
                                  >
                                    {v.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lesson Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Create Lesson</h2>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Lesson Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className={`input input-bordered w-full bg-gray-50 border-2 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2 ${
                    error && !form.name.trim()
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter lesson name"
                  required
                />
                {error && !form.name.trim() && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  className={`textarea textarea-bordered w-full bg-gray-50 border-2 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2 ${
                    error && !form.description.trim()
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Enter lesson description"
                  required
                />
                {error && !form.description.trim() && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  PDF Content
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  name="pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-full border transition-all ${
                    form.name.trim() && form.description.trim() && !isSubmitting
                      ? 'border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white'
                      : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  disabled={
                    !form.name.trim() ||
                    !form.description.trim() ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? 'Creating...' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Lesson Modal */}
      {editLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setEditLesson(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
            <form onSubmit={handleEditLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Lesson Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditInputChange}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  PDF Content (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  name="pdf"
                  onChange={handleEditFileChange}
                  className="file-input file-input-bordered w-full"
                />
              </div>
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  onClick={() => setEditLesson(null)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Lesson Confirmation */}
      {deleteLessonId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full relative">
            <h2 className="text-xl font-bold mb-4">Delete Lesson?</h2>
            <p>
              Are you sure you want to delete this lesson? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteLessonId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDeleteLesson}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowAssessmentModal(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Create Assessment</h2>
            <form onSubmit={handleCreateAssessment} className="space-y-4">
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
                  onClick={() => setShowAssessmentModal(null)}
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

      {/* Student Assessment Submission Modal */}
      {submitAssessmentId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setSubmitAssessmentId(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Submit Assessment</h2>
            <form onSubmit={handleSubmitAssessment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Answer PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleAssessmentFileChangeStudent}
                  className="file-input file-input-bordered w-full"
                  required
                />
              </div>
              {submissionError && (
                <div className="text-red-500 text-sm">{submissionError}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  onClick={() => setSubmitAssessmentId(null)}
                  disabled={isSubmittingAssessment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  disabled={isSubmittingAssessment}
                >
                  {isSubmittingAssessment ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Mark Assessment Modal */}
      {markAssessmentId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full min-w-[500px] min-h-[400px] relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setMarkAssessmentId(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Mark Assessment</h2>
            {assessmentSubmissions.length === 0 ? (
              <div className="text-gray-500">No submissions yet.</div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {assessmentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border rounded p-4 bg-gray-50 mb-4"
                  >
                    {/* First row: student name left, view submission right */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg">
                        {sub.student?.name || sub.studentId}
                      </span>
                      <a
                        href={sub.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-medium hover:text-blue-800 transition"
                        title="Download Submission"
                      >
                        View Submission
                      </a>
                    </div>
                    {/* Second row: grade, feedback, mark button (only if not marked) */}
                    {!sub.marked && (
                      <div className="flex flex-col md:flex-row items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Grade"
                          className="input input-bordered input-primary font-semibold text-lg min-w-[100px] md:w-32 focus:ring-2 focus:ring-primary px-4 py-2"
                          value={grading[sub.id]?.grade || ''}
                          onChange={(e) =>
                            handleGradingInput(sub.id, 'grade', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="Feedback"
                          className="input input-bordered input-accent font-semibold text-base min-w-[180px] md:w-64 focus:ring-2 focus:ring-accent px-4 py-2"
                          value={grading[sub.id]?.feedback || ''}
                          onChange={(e) =>
                            handleGradingInput(
                              sub.id,
                              'feedback',
                              e.target.value
                            )
                          }
                        />
                        <button
                          className="px-6 py-2 rounded-full border-2 border-primary text-primary bg-white ml-0 md:ml-auto mt-2 md:mt-0 transition-colors duration-200 shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                          style={{ minWidth: '100px', fontWeight: 400 }}
                          onClick={() => handleMarkSubmission(sub.id)}
                          disabled={isGrading}
                        >
                          {isGrading ? 'Marking...' : 'Mark'}
                        </button>
                      </div>
                    )}
                    {/* Show grade and feedback if marked */}
                    {(sub.marked ||
                      (sub.feedback && sub.feedback.trim() !== '')) && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {sub.marked && (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Grade: {sub.grade}
                          </span>
                        )}
                        {sub.feedback && sub.feedback.trim() !== '' && (
                          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            Feedback: {sub.feedback}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {gradingError && (
              <div className="text-red-500 text-sm">{gradingError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
