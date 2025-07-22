"use client";

import React from "react";

interface NotificationItemProps {
  notification: {
    id: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  };
  onClick: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(notification.id)}
      className={`p-4 border-b cursor-pointer ${
        notification.isRead ? "bg-white" : "bg-blue-100 font-bold"
      }`}
    >
      <p>{notification.message}</p>
      <p className="text-sm text-gray-500">
        {new Date(notification.timestamp).toLocaleString()}
      </p>
    </div>
  );
};

export default NotificationItem;
