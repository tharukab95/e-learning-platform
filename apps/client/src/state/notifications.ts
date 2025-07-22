import { create } from "zustand";

interface Notification {
  id: string;
  classId: string;
  videoId?: string;
  assessmentId?: string;
  timestamp: string;
  isRead: boolean;
  message: string;
}

interface NotificationsState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
}));
