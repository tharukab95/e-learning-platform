'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useNotificationsStore } from '@/state/notifications';
import { io, Socket } from 'socket.io-client';

function SessionSyncer() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session) {
      localStorage.setItem('nextauth.session', JSON.stringify(session));
    }
  }, [session]);
  return null;
}

function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  useEffect(() => {
    if (!session?.user?.id) return;
    const socket: Socket = io('http://localhost:3000', {
      transports: ['websocket'],
      withCredentials: true,
    });
    socket.emit('join', session.user.id);
    socket.on('notification', (notification: any) => {
      // Normalize notification for the store
      addNotification({
        id: notification.id,
        classId: notification.payload?.classId || '',
        lessonId: notification.payload?.lessonId || '',
        videoId: notification.payload?.videoId,
        assessmentId: notification.payload?.assessmentId,
        timestamp: notification.createdAt || new Date().toISOString(),
        isRead: notification.isRead,
        message: notification.payload?.message || notification.message,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, addNotification]);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <SessionSyncer />
      <NotificationSocketProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NotificationSocketProvider>
    </SessionProvider>
  );
}
