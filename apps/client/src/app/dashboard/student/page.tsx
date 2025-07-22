/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ClassCard from '@/components/ClassCard';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { IoLogOutOutline } from 'react-icons/io5';
import { io } from 'socket.io-client';

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

  const fetchClasses = useCallback(async () => {
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
  }, [session?.user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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
    // Immediately refetch classes to update UI
    fetchClasses();
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
            Student Dashboard
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-indigo-600 transition relative"
              onClick={() => setShowNotifications((v) => !v)}
              aria-label="Notifications"
            >
              <FaBell className="w-6 h-6 text-white" />
              {notifications.filter((n: any) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {notifications.filter((n: any) => !n.isRead).length}
                </span>
              )}
            </button>
            {showNotifications && (
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
                        setNotifications((prev: any[]) =>
                          prev.filter((notif) => notif.id !== n.id)
                        );
                        setShowNotifications(false);
                        if (n.id) {
                          const token = (session?.user as any)?.access_token;
                          await fetch(
                            `${
                              process.env.NEXT_PUBLIC_API_URL ||
                              'http://localhost:3000'
                            }/api/notifications/${n.id}/read`,
                            {
                              method: 'PATCH',
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                        }
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
          <button
            className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
            onClick={() => signOut()}
          >
            <IoLogOutOutline className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-6xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* All Classes (Enrolled and Available) */}
            <section>
              <h2 className="text-xl font-bold mb-6 text-indigo-700">
                All Classes
              </h2>
              {loadingClasses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              ) : allClasses.length === 0 ? (
                <div className="text-gray-500">No classes found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledClasses.map((c) => (
                    <div
                      key={c.id}
                      className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-gradient-to-br from-indigo-50 to-white"
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
            </section>

            {/* Upcoming Lessons & Assessments */}
            <section>
              <h2 className="text-xl font-bold mb-6 text-indigo-700">
                Upcoming
              </h2>
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
                    <li key={idx} className="mb-2">
                      <div>
                        <span className="font-semibold text-indigo-800">
                          {a.assessmentTitle}
                        </span>{' '}
                        &mdash;
                        <span className="text-gray-700">
                          {a.className}
                        </span> /{' '}
                        <span className="text-gray-700">{a.lessonName}</span>
                      </div>
                      <div className="ml-2 text-xs text-gray-500 mt-1">
                        Due: {a.due.toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Profile Section below classes */}
          <section className="bg-white/80 rounded-xl shadow p-8 max-w-4xl mx-auto w-full">
            {/* Show skeletons while profile is loading */}
            {!profile ? (
              <div className="flex flex-col items-center mb-4 w-full animate-pulse">
                <div className="relative w-28 h-28 flex items-center justify-center mx-auto mb-4">
                  <Skeleton circle height={112} width={112} />
                </div>
                <div className="w-full flex flex-col items-start">
                  <Skeleton height={28} width={160} className="mb-2" />
                  <Skeleton height={18} width={220} className="mb-4" />
                  <Skeleton height={20} width={300} className="mb-2" />
                  <Skeleton height={20} width={300} className="mb-2" />
                  <Skeleton height={40} width={300} className="mb-2" />
                </div>
              </div>
            ) : (
              <>
                {/* Edit icon top right */}
                <button
                  className="absolute top-4 right-4 btn btn-xs btn-outline flex items-center justify-center"
                  onClick={handleProfileEdit}
                  aria-label="Edit Profile"
                >
                  {/* Pencil icon */}
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
                      d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z"
                    />
                  </svg>
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
                    {/* Only show delete icon if editingProfile is true and profile image exists */}
                    {profile?.image && editingProfile && (
                      <button
                        className="absolute top-0 left-0 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-700"
                        onClick={async () => {
                          const token = (session?.user as any)?.access_token;
                          await fetch(
                            `${
                              process.env.NEXT_PUBLIC_API_URL ||
                              'http://localhost:3000'
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
                        const token = (session?.user as any)?.access_token;
                        if (token) {
                          const res = await fetch(
                            `${
                              process.env.NEXT_PUBLIC_API_URL ||
                              'http://localhost:3000'
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
                  <span className="text-2xl font-bold text-indigo-900">
                    {profile?.name}
                  </span>
                  <div className="text-gray-500 text-sm mb-4">
                    {profile?.email}
                  </div>
                  {editingProfile ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name
                        </label>
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
                      {/* Add spacing before the buttons and align with theme */}
                      <div className="flex gap-3 justify-end mt-8">
                        <button
                          className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 rounded-full px-6 py-2 transition"
                          onClick={handleProfileCancel}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-full px-8 py-2 shadow hover:from-blue-700 hover:to-indigo-800 transition"
                          onClick={handleProfileSave}
                        >
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
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
