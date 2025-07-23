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
export function useUpcomingAssessments(
  enrolledClasses: any[],
  userId: string | undefined,
  sessionUser: any
) {
  return useQuery({
    queryKey: ['upcomingAssessments', enrolledClasses, sessionUser],
    queryFn: async () => {
      if (enrolledClasses.length === 0) return [];
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      const allUpcoming: any[] = [];
      for (const c of enrolledClasses) {
        const lessonsRes = await api.get(`/classes/${(c as any).id}/lessons`);
        const lessons = lessonsRes.status === 200 ? lessonsRes.data : [];
        for (const lesson of lessons) {
          const assessmentsRes = await api.get(
            `/lessons/${lesson.id}/assessments`
          );
          const assessments =
            assessmentsRes.status === 200 ? assessmentsRes.data : [];
          for (const a of assessments) {
            const due = new Date(a.deadline);
            const submitted =
              Array.isArray(a.submissions) &&
              a.submissions.some((s: any) => s.studentId === userId);
            if (!submitted && due >= now && due <= weekFromNow) {
              allUpcoming.push({
                assessmentTitle: a.title,
                due: due,
                className: (c as any).title,
                lessonName: lesson.name,
              });
            }
          }
        }
      }
      allUpcoming.sort((a, b) => a.due.getTime() - b.due.getTime());
      return allUpcoming;
    },
    enabled: !!(enrolledClasses as any[]).length && !!userId,
  });
}

// Mutations
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
