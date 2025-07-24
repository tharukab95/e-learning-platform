import React from 'react';
import { FaBell } from 'react-icons/fa';

interface TeacherHeaderProps {
  onSignOut: () => void;
  notifications: any[];
  onShowNotifications: () => void;
  showNotifications: boolean;
  children?: React.ReactNode;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  onSignOut,
  notifications = [],
  onShowNotifications,
  showNotifications,
  children,
}) => (
  <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md py-4 px-8 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-white tracking-tight">
        E-Learn
      </span>
      <span className="ml-4 text-lg text-indigo-100 font-medium">
        Teacher Dashboard
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
    </div>
  </header>
);

export default TeacherHeader;
