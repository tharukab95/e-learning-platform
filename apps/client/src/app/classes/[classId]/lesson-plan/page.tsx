'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaChevronDown, FaChevronRight, FaEdit, FaPlus } from 'react-icons/fa';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import { AxiosProgressEvent } from 'axios';

interface Lesson {
  id: string;
  name: string;
  description: string;
  pdfUrl?: string;
  videos?: any[];
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

export default function LessonPlanPage() {
  const { data: session } = useSession();
  const { classId } = useParams() as { classId: string };
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const isTeacher = session?.user?.role === 'teacher';
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [lessonDetails, setLessonDetails] = useState<
    Record<string, { assessments: Assessment[]; videos: Video[] }>
  >({});
  const [contentModalLesson, setContentModalLesson] = useState<Lesson | null>(
    null
  );
  const [editFields, setEditFields] = useState({ name: '', description: '' });
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState<string | null>(
    null
  ); // lessonId or null
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    deadline: '',
    file: null as File | null,
  });
  const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const assessmentFileInputRef = useRef<HTMLInputElement>(null);
  const [markAssessmentId, setMarkAssessmentId] = useState<string | null>(null);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<any[]>([]);
  const [grading, setGrading] = useState<
    Record<string, { grade: string; feedback: string }>
  >({});
  const [gradingError, setGradingError] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [videoUploadError, setVideoUploadError] = useState<string>('');

  const searchParams = useSearchParams();
  useEffect(() => {
    const expandLesson = searchParams.get('expandLesson');
    if (expandLesson) {
      setExpandedLesson(expandLesson);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api
      .get(`/classes/${classId}/lessons`)
      .then((res) => {
        const lessonsData = Array.isArray(res.data) ? res.data : [];
        setLessons(lessonsData);
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [classId, showModal, refresh]);

  // Fetch assessments and videos for each lesson
  useEffect(() => {
    if (!lessons.length) return;
    const fetchDetails = async () => {
      const details: Record<
        string,
        { assessments: Assessment[]; videos: Video[] }
      > = {};
      await Promise.all(
        lessons.map(async (lesson) => {
          const [assessmentsRes, videosRes] = await Promise.all([
            api.get(`/lessons/${lesson.id}/assessments`),
            api.get(`/lessons/${lesson.id}/videos`),
          ]);
          const assessments = assessmentsRes.data;
          const videos = videosRes.data;
          details[lesson.id] = { assessments, videos };
        })
      );
      setLessonDetails(details);
    };
    fetchDetails();
  }, [lessons]);

  // When opening the modal for edit, prefill name/description
  useEffect(() => {
    if (contentModalLesson) {
      setEditFields({
        name: contentModalLesson.name || '',
        description: contentModalLesson.description || '',
      });
      setContentFile(null); // Reset file when opening modal
    }
  }, [contentModalLesson]);

  // Fetch submissions for marking
  useEffect(() => {
    if (markAssessmentId && isTeacher) {
      const fetchSubmissions = async () => {
        const res = await api.get(
          `/assessments/${markAssessmentId}/submissions`
        );
        if (res.status === 200) {
          const data = res.data;
          setAssessmentSubmissions(Array.isArray(data) ? data : []);
        } else {
          setAssessmentSubmissions([]);
        }
      };
      fetchSubmissions();
    }
  }, [markAssessmentId, isTeacher]);

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
      const res = await api.patch(`/assessments/submissions/${submissionId}`, {
        grade: Number(grade),
        feedback,
      });
      if (res.status !== 200) throw new Error('Failed to mark submission');
      setAssessmentSubmissions((subs) =>
        subs.map((s) =>
          s.id === submissionId ? { ...s, grade, feedback, marked: true } : s
        )
      );
    } catch (err: any) {
      setGradingError(err?.message || 'Failed to mark submission');
    } finally {
      setIsGrading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      const res = await api.post('/lessons', formData);
      if (res.status !== 201) throw new Error('Failed to create lesson');
      setShowModal(false);
      setForm({ name: '', description: '' });
      setRefresh((v) => v + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload content mutation
  const uploadContent = async () => {
    if (!contentModalLesson) return;
    const formData = new FormData();
    formData.append('name', editFields.name);
    formData.append('description', editFields.description);
    if (contentFile) {
      formData.append('pdf', contentFile);
    }
    // PATCH /lessons/:id to update lesson content
    return api.patch(`/lessons/${contentModalLesson.id}`, formData, {
      headers: {
        // Remove Content-Type to let browser set it automatically for FormData
        'Content-Type': undefined,
      },
    });
  };
  const contentMutation = useMutation({
    mutationFn: uploadContent,
    onSuccess: () => {
      setContentModalLesson(null);
      setContentFile(null);
      setRefresh((v) => v + 1);
    },
  });

  const completed = lessons.filter(
    (l) => l.pdfUrl || (l.videos && l.videos.length)
  ).length;
  const total = lessons.length;

  if (!isTeacher) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center text-red-600 font-bold">
        Only teachers can access this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-tight">
            E-Learn
          </span>
          <span className="ml-4 text-lg text-indigo-100 font-medium">
            Lesson Plan
          </span>
        </div>
        <button
          className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
          onClick={() => router.back()}
        >
          Back
        </button>
      </header>
      <main className="max-w-3xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-800">Lesson Plan</h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add Lesson
            </button>
          </div>
          <div className="mb-4 text-lg font-medium text-indigo-700">
            Completion: {completed}/{total} (
            {total ? Math.round((completed / total) * 100) : 0}%)
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
                  </div>
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-gray-500">No lessons created yet.</div>
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson) => {
                const hasVideo =
                  lessonDetails[lesson.id]?.videos?.length > 0 &&
                  lessonDetails[lesson.id].videos[0].hlsPath;
                const hasContent = lesson.pdfUrl || hasVideo;
                const isExpanded = expandedLesson === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-xl shadow-md p-6 mb-2 flex flex-col border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() =>
                        hasContent &&
                        setExpandedLesson(isExpanded ? null : lesson.id)
                      }
                    >
                      <div className="flex-1 flex items-center gap-2">
                        {hasContent &&
                          (isExpanded ? (
                            <FaChevronDown className="text-indigo-500 w-4 h-4" />
                          ) : (
                            <FaChevronRight className="text-indigo-400 w-4 h-4" />
                          ))}
                        <h2 className="text-xl font-bold text-indigo-900 mb-1">
                          {lesson.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasContent && (
                          <button
                            className="btn btn-primary flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentModalLesson(lesson);
                            }}
                          >
                            <FaPlus className="w-4 h-4" /> Add Content
                          </button>
                        )}
                        {hasContent && (
                          <button
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                            title="Edit Content"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentModalLesson(lesson);
                            }}
                          >
                            <FaEdit className="w-4 h-4 text-indigo-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    {hasContent && isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        {/* Show video player at the top if video exists, otherwise show PDF at the top */}
                        {lessonDetails[lesson.id]?.videos?.length > 0 &&
                        lessonDetails[lesson.id].videos[0].hlsPath ? (
                          <>
                            <div className="mb-6">
                              <VideoPlayer
                                src={lessonDetails[lesson.id].videos[0].hlsPath}
                                videoId={lessonDetails[lesson.id].videos[0].id}
                              />
                            </div>
                            {lesson.pdfUrl && (
                              <iframe
                                src={lesson.pdfUrl}
                                title="Lesson PDF"
                                className="w-full h-96 rounded border mb-4"
                              />
                            )}
                          </>
                        ) : lesson.pdfUrl ? (
                          <iframe
                            src={lesson.pdfUrl}
                            title="Lesson PDF"
                            className="w-full h-96 rounded border mb-4"
                          />
                        ) : null}
                        {/* Assessments under lesson */}
                        <div className="mt-4 flex items-center justify-between mb-2">
                          <h3 className="font-semibold mb-1 text-indigo-700">
                            Assessments
                          </h3>
                          <button
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAssessmentModal(lesson.id);
                              setAssessmentForm({
                                title: '',
                                deadline: '',
                                file: null,
                              });
                            }}
                          >
                            + Create Assessment
                          </button>
                        </div>
                        {lessonDetails[lesson.id]?.assessments?.length > 0 && (
                          <ul className="list-disc pl-5 mt-2">
                            {lessonDetails[lesson.id].assessments.map((a) => (
                              <li
                                key={a.id}
                                className="flex items-center justify-between gap-2 py-1 px-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{a.title}</span>
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
                                  {isTeacher && (
                                    <button
                                      className="px-3 py-1 rounded-full border border-accent text-accent text-xs hover:bg-accent hover:text-white transition bg-white"
                                      onClick={() => setMarkAssessmentId(a.id)}
                                    >
                                      Mark Assessment
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
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
      {/* Add Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Add Lesson</h2>
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
                  {isSubmitting ? 'Adding...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add/Edit Content Modal */}
      {contentModalLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setContentModalLesson(null);
                setContentFile(null);
              }}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {contentModalLesson.pdfUrl ||
              (contentModalLesson.videos && contentModalLesson.videos.length)
                ? 'Edit Content'
                : 'Add Content'}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await contentMutation.mutateAsync();
                // After lesson content is saved, upload video if selected
                if (videoFile && contentModalLesson) {
                  setVideoUploadProgress(0);
                  setVideoUploadError('');
                  try {
                    const formData = new FormData();
                    formData.append('title', editFields.name);
                    formData.append('lessonId', contentModalLesson.id);
                    formData.append('video', videoFile);
                    await api.post('/videos', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                        if (progressEvent.total) {
                          setVideoUploadProgress(
                            Math.round(
                              (progressEvent.loaded! * 100) /
                                progressEvent.total
                            )
                          );
                        }
                      },
                    });
                    setVideoFile(null);
                    setVideoUploadProgress(100);
                    setRefresh((v) => v + 1);
                  } catch (err: any) {
                    setVideoUploadError(err?.message || 'Video upload failed');
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Lesson Name
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                  value={editFields.name}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="textarea textarea-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                  value={editFields.description}
                  onChange={(e) =>
                    setEditFields((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  PDF Materials (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                  className="file-input file-input-bordered w-full"
                />
              </div>
              {/* Video uploader below PDF */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Video Upload (optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${
                    videoFile ? 'border-primary' : 'border-gray-300'
                  } bg-gray-50 hover:bg-gray-100`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setVideoFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() =>
                    document.getElementById('video-upload-input')?.click()
                  }
                >
                  {videoFile ? (
                    <span>{videoFile.name}</span>
                  ) : (
                    <span>
                      Drag & drop a video file here, or click to select
                    </span>
                  )}
                  <input
                    id="video-upload-input"
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
                {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                  <div className="mt-2 text-sm text-blue-600">
                    Uploading: {videoUploadProgress}%
                  </div>
                )}
                {videoUploadError && (
                  <div className="mt-2 text-sm text-red-600">
                    {videoUploadError}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  onClick={() => {
                    setContentModalLesson(null);
                    setContentFile(null);
                  }}
                  disabled={contentMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  disabled={contentMutation.isPending}
                >
                  {contentMutation.isPending
                    ? 'Saving...'
                    : contentModalLesson.pdfUrl ||
                      (contentModalLesson.videos &&
                        contentModalLesson.videos.length)
                    ? 'Save Changes'
                    : 'Add Content'}
                </button>
              </div>
            </form>
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Validation
                if (!assessmentForm.title.trim()) {
                  setAssessmentError('Assessment name is required');
                  return;
                }

                if (!assessmentForm.deadline) {
                  setAssessmentError('Deadline is required');
                  return;
                }

                // Check if deadline is in the past
                const selectedDate = new Date(assessmentForm.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day

                if (selectedDate < today) {
                  setAssessmentError('Deadline cannot be a past date');
                  return;
                }

                if (!assessmentForm.file) {
                  setAssessmentError('Assessment PDF is required');
                  return;
                }

                setIsAssessmentSubmitting(true);
                setAssessmentError('');
                try {
                  const formData = new FormData();
                  formData.append('title', assessmentForm.title.trim());
                  formData.append('deadline', assessmentForm.deadline);
                  formData.append('lessonId', showAssessmentModal);
                  formData.append('pdf', assessmentForm.file);
                  const res = await api.post('/assessments', formData);
                  if (res.status !== 201)
                    throw new Error('Failed to create assessment');
                  setShowAssessmentModal(null);
                  setAssessmentForm({ title: '', deadline: '', file: null });
                  setRefresh((v) => v + 1);
                } catch (err: any) {
                  setAssessmentError(
                    err?.message || 'Failed to create assessment'
                  );
                } finally {
                  setIsAssessmentSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assessment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={assessmentForm.title}
                  onChange={(e) =>
                    setAssessmentForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={`input input-bordered w-full bg-gray-50 border-2 focus:border-primary focus:bg-white focus:outline-none px-3 py-2 ${
                    assessmentError && !assessmentForm.title.trim()
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter assessment name"
                  required
                />
                {assessmentError && !assessmentForm.title.trim() && (
                  <p className="text-red-500 text-xs mt-1">{assessmentError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={assessmentForm.deadline}
                  onChange={(e) =>
                    setAssessmentForm((f) => ({
                      ...f,
                      deadline: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className={`input input-bordered w-full bg-gray-50 border-2 focus:border-primary focus:bg-white focus:outline-none px-3 py-2 ${
                    assessmentError && !assessmentForm.deadline
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  required
                />
                {assessmentError && !assessmentForm.deadline && (
                  <p className="text-red-500 text-xs mt-1">{assessmentError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assessment PDF <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  name="pdf"
                  ref={assessmentFileInputRef}
                  onChange={(e) =>
                    setAssessmentForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                  className={`file-input file-input-bordered w-full bg-gray-50 border-2 focus:border-primary focus:bg-white focus:outline-none px-3 py-2 ${
                    assessmentError && !assessmentForm.file
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  required
                />
                {assessmentError && !assessmentForm.file && (
                  <p className="text-red-500 text-xs mt-1">{assessmentError}</p>
                )}
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
                  className={`px-6 py-2 rounded-full border transition-all ${
                    assessmentForm.title.trim() &&
                    assessmentForm.deadline &&
                    assessmentForm.file &&
                    !isAssessmentSubmitting
                      ? 'border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white'
                      : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  disabled={
                    !assessmentForm.title.trim() ||
                    !assessmentForm.deadline ||
                    !assessmentForm.file ||
                    isAssessmentSubmitting
                  }
                >
                  {isAssessmentSubmitting ? 'Creating...' : 'Create Assessment'}
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
