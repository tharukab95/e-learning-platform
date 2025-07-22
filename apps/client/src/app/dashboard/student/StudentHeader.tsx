import React from 'react';
import { FaBell } from 'react-icons/fa';
import { IoLogOutOutline } from 'react-icons/io5';
import { Notification } from '@/types/models';

interface StudentHeaderProps {
  notifications: Notification[];
  onShowNotifications: () => void;
  showNotifications: boolean;
  onSignOut: () => void;
  children?: React.ReactNode;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({
  notifications,
  onShowNotifications,
  showNotifications,
  onSignOut,
  children,
}) => (
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
          onClick={onShowNotifications}
          aria-label="Notifications"
        >
          <FaBell className="w-6 h-6 text-white" />
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>
        {children}
      </div>
      <button
        className="ml-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition font-medium"
        onClick={onSignOut}
      >
        <IoLogOutOutline className="w-5 h-5" />
        Logout
      </button>
    </div>
  </header>
);

export default StudentHeader;
