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
import { useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { io } from 'socket.io-client';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch notifications (mock: fetch from /api/notifications or similar)
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = (session?.user as any)?.access_token;
      if (!token) return;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    };
    fetchNotifications();
  }, [session?.user]);

  // Fetch profile info (mock: fetch from /api/profile or /api/users/me)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = (session?.user as any)?.access_token;
      if (!token) return;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/users/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProfile(data);
      setProfileForm({ ...data });
    };
    fetchProfile();
  }, [session?.user]);

  useEffect(() => {
    if (!profile?.id) return;
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      {
        withCredentials: true,
      }
    );
    socket.emit('join', profile.id);
    socket.on('notification', (notification: any) => {
      setNotifications((prev: any[]) => [notification, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, [profile?.id]);

  const handleProfileEdit = () => setEditingProfile(true);
  const handleProfileCancel = () => {
    setEditingProfile(false);
    setProfileForm({ ...profile });
  };
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleProfileSave = async () => {
    const token = (session?.user as any)?.access_token;
    if (!token) return;
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/users/me`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setEditingProfile(false);
    }
  };
  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = (session?.user as any)?.access_token;
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      }/api/users/me/image`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    if (res.ok) {
      const data = await res.json();
      setProfile((prev: any) => ({ ...prev, image: data.image }));
    }
  };

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
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition relative"
              onClick={() => setShowNotifications((v) => !v)}
              aria-label="Notifications"
            >
              <FaBell className="w-6 h-6" />
              {notifications.filter((n: any) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {notifications.filter((n: any) => !n.isRead).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b font-bold">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-3 text-gray-500">No notifications</div>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <div
                      key={n.id || idx}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                        !n.isRead ? 'font-semibold' : ''
                      }`}
                      onClick={() => {
                        setShowNotifications(false);
                        if (n.payload?.link) {
                          router.push(n.payload.link);
                        }
                      }}
                    >
                      {n.payload?.message}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="btn btn-error" onClick={() => signOut()}>
            Logout
          </button>
        </div>
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

      {/* Profile Section below classes */}
      <div className="bg-white rounded shadow p-8 max-w-2xl mx-auto mt-8 flex flex-col items-center relative">
        {/* Edit button top right */}
        <button
          className="absolute top-4 right-4 btn btn-xs btn-outline"
          onClick={handleProfileEdit}
        >
          Edit
        </button>
        <div className="flex flex-col items-center mb-4 w-full">
          <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
            {profile?.image ? (
              <img
                src={profile.image}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border mx-auto"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center border mx-auto relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                  Upload Photo
                </span>
              </div>
            )}
            {profile?.image && (
              <button
                className="absolute top-0 left-0 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-700"
                onClick={async () => {
                  const token = (session?.user as any)?.access_token;
                  await fetch(
                    `${
                      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                    }/api/users/me/image`,
                    {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  setProfile((prev: any) => ({ ...prev, image: null }));
                }}
                title="Delete Profile Image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={async (e) => {
                await handleProfileImageChange(e);
                // Refetch profile to show the new image immediately
                const token = (session?.user as any)?.access_token;
                if (token) {
                  const res = await fetch(
                    `${
                      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                    }/api/users/me`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  const data = await res.json();
                  setProfile(data);
                }
              }}
            />
          </div>
        </div>
        <div className="w-full">
          <span className="text-2xl font-bold">{profile?.name}</span>

          <div className="text-gray-500 text-sm mb-4">{profile?.email}</div>
          {editingProfile ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name || ''}
                  onChange={handleProfileChange}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profileForm.phone || ''}
                  onChange={handleProfileChange}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileForm.address || ''}
                  onChange={handleProfileChange}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  About Me
                </label>
                <textarea
                  name="about"
                  value={profileForm.about || ''}
                  onChange={handleProfileChange}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-ghost" onClick={handleProfileCancel}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleProfileSave}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Phone:</span>
                <span>
                  {profile?.phone || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Address:</span>
                <span>
                  {profile?.address || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold">About Me:</span>
                <div className="text-gray-700 whitespace-pre-line mt-1">
                  {profile?.about || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
