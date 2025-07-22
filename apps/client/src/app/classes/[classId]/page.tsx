'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState as useToggleState } from 'react';

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

  const isTeacher = session?.user?.role === 'teacher';
  const token = (session?.user as any)?.access_token;

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
    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button className="btn btn-ghost mb-4" onClick={() => router.back()}>
        &larr; Back
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Class Lessons</h1>
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
        <div>Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="text-gray-500">No lessons created yet.</div>
      ) : (
        <div className="space-y-6">
          {lessons.map((lesson) => {
            const isExpanded = expandedLesson === lesson.id;
            return (
              <div
                key={lesson.id}
                className="bg-white rounded shadow p-4 mb-2 flex flex-col"
              >
                <div
                  className="flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() =>
                    setExpandedLesson(isExpanded ? null : lesson.id)
                  }
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1 inline-block align-middle">
                      {lesson.name}
                    </h2>
                    <p className="text-gray-600 mb-0.5 text-sm inline-block align-middle ml-2">
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <iframe
                      src={lesson.pdfUrl}
                      title="Lesson PDF"
                      className="w-full h-96 rounded border"
                    />
                    {/* Assessments under lesson */}
                    {lessonDetails[lesson.id]?.assessments?.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-1">Assessments</h3>
                        <ul className="list-disc pl-5">
                          {lessonDetails[lesson.id].assessments.map((a) => (
                            <li key={a.id}>
                              <a
                                href={a.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary"
                              >
                                {a.title}
                              </a>
                              {a.deadline && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Due:{' '}
                                  {new Date(a.deadline).toLocaleDateString()})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Videos under lesson */}
                    {lessonDetails[lesson.id]?.videos?.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-1">Videos</h3>
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
                  Lesson Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
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
                  value={form.description}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  required
                />
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
                  className="file-input file-input-bordered w-full"
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
                  className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                  disabled={isSubmitting}
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
    </div>
  );
}
