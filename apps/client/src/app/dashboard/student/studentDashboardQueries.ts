import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Classes
export function useAllClasses() {
  return useQuery({
    queryKey: ['allClasses'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.status === 200 ? res.data : [];
    },
  });
}

export function useEnrolledClasses() {
  return useQuery({
    queryKey: ['enrolledClasses'],
    queryFn: async () => {
      const res = await api.get('/classes/enrolled');
      return res.status === 200 ? res.data : [];
    },
  });
}

export function useAvailableClasses() {
  return useQuery({
    queryKey: ['availableClasses'],
    queryFn: async () => {
      const res = await api.get('/classes/available');
      return res.status === 200 ? res.data : [];
    },
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.status === 200 ? res.data : [];
    },
    refetchOnWindowFocus: false,
  });
}

// Profile
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.status === 200 ? res.data : {};
    },
  });
}

// Upcoming Assessments
export function useUpcomingAssessments(userId: string | undefined) {
  return useQuery({
    queryKey: ['upcomingAssessments', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/students/${userId}/upcoming-assessments`);
      return res.status === 200 ? res.data : [];
    },
    enabled: !!userId,
  });
}

// Type for profile update
export type ProfileUpdate = {
  name?: string;
  phone?: string;
  address?: string;
  about?: string;
};

// Mutations
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: unknown) => {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    },
  });
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/users/me/image', formData, {
        headers: {
          'Content-Type': undefined, // Let browser set multipart/form-data
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: unknown) => {
      console.error('Profile image upload failed:', error);
      alert('Failed to upload profile image. Please try again.');
    },
  });
}

export function useEnrollClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => api.post(`/classes/${classId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClasses'] });
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAssessments'] });
    },
  });
}

export function useMarkNotificationRead(refetchNotifications: () => void) {
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      refetchNotifications();
    },
  });
}

export function useDeleteProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/users/me/image'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
