"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import NotificationItem from "@/components/NotificationItem";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

const fetchNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

const markAsRead = async (id: string) => {
  await api.post("/notifications", { id });
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });
  const mutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (id: string, link?: string) => {
    mutation.mutate(id);
    if (link) {
      router.push(link);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="bg-white rounded shadow divide-y">
        {notifications?.map((n: Notification) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClick={() => handleNotificationClick(n.id, n.link)}
          />
        ))}
      </div>
    </div>
  );
}
