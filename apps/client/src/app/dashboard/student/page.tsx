/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { io } from 'socket.io-client';
import StudentHeader from './StudentHeader';
import StudentClassList from './StudentClassList';
import StudentUpcoming from './StudentUpcoming';
import StudentProfile from './StudentProfile';
import {
  useAllClasses,
  useEnrolledClasses,
  useNotifications,
  useProfile,
  useUpcomingAssessments,
  useUpdateProfile,
  useUploadProfileImage,
  useEnrollClass,
  useMarkNotificationRead,
  useDeleteProfileImage,
  useAvailableClasses,
} from './studentDashboardQueries';

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = (session?.user as any)?.id;

  // Classes
  const { isLoading: loadingClasses } = useAllClasses();
  const { data: enrolledClasses = [] } = useEnrolledClasses();

  // Notifications
  const { data: notifications = [], refetch: refetchNotifications } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});

  React.useEffect(() => {
    if (profile) setProfileForm({ ...profile });
  }, [profile]);

  // Upcoming Assessments
  const { data: upcomingAssessments = [] } = useUpcomingAssessments(userId);

  // Available Classes
  const { data: availableClasses = [] } = useAvailableClasses();

  // Mutations
  const updateProfile = useUpdateProfile();
  const uploadProfileImage = useUploadProfileImage();
  const enrollClass = useEnrollClass();
  const markNotificationRead = useMarkNotificationRead(refetchNotifications);
  const deleteProfileImage = useDeleteProfileImage();

  // Handlers
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
    updateProfile.mutate(profileForm, {
      onSuccess: () => {
        setEditingProfile(false);
      },
    });
  };

  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    uploadProfileImage.mutate(formData);
  };

  const handleEnroll = async (classId: string) => {
    enrollClass.mutate(classId);
  };

  // Notification dropdown logic
  const handleShowNotifications = () => setShowNotifications((v) => !v);
  const handleSignOut = () => signOut();

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
      refetchNotifications();
    });
    return () => {
      socket.disconnect();
    };
  }, [profile?.id, refetchNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header NavBar */}
      <StudentHeader
        notifications={notifications}
        onShowNotifications={handleShowNotifications}
        showNotifications={showNotifications}
        onSignOut={handleSignOut}
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
                    markNotificationRead.mutate(n.id);
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
      </StudentHeader>

      {/* Main Content Card */}
      <main className="max-w-6xl mx-auto mt-10 mb-16 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* All Classes (Enrolled and Available) */}
            <StudentClassList
              enrolledClasses={enrolledClasses}
              availableClasses={availableClasses}
              handleEnroll={handleEnroll}
              router={router}
              loadingClasses={loadingClasses}
            />
            {/* Upcoming Lessons & Assessments */}
            <StudentUpcoming
              upcomingAssessments={upcomingAssessments}
              loadingClasses={loadingClasses}
            />
          </div>
          {/* Profile Section below classes */}
          <StudentProfile
            profile={profile}
            profileForm={profileForm}
            editingProfile={editingProfile}
            loadingProfile={loadingProfile}
            savingProfile={updateProfile.isPending}
            handleProfileEdit={handleProfileEdit}
            handleProfileCancel={handleProfileCancel}
            handleProfileChange={handleProfileChange}
            handleProfileSave={handleProfileSave}
            handleProfileImageChange={handleProfileImageChange}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            deleteProfileImage={() => deleteProfileImage.mutate()}
          />
        </div>
      </main>
    </div>
  );
}
