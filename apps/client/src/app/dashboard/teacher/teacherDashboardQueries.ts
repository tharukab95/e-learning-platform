import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Class, Lesson, Assessment } from '@/types/models';

// Minimal type for student objects returned from /classes/:id/students
interface StudentId {
  id: string;
  studentId?: string;
}

export function useCreatedClasses(sessionUser: unknown) {
  return useQuery<Class[]>({
    queryKey: ['createdClasses', sessionUser],
    queryFn: async () => {
      if (!sessionUser) return [];
      const res = await api.get('/classes');
      return res.status === 200 ? res.data : [];
    },
    enabled: !!sessionUser,
  });
}

export function useEnrollmentCounts(
  createdClasses: Class[],
  sessionUser: unknown
) {
  return useQuery<{
    counts: Record<string, number>;
    distinctStudentCount: number;
  }>({
    queryKey: ['enrollmentCounts', createdClasses, sessionUser],
    queryFn: async () => {
      if (!sessionUser || !createdClasses.length)
        return { counts: {}, distinctStudentCount: 0 };
      const counts: Record<string, number> = {};
      const studentSet = new Set<string>();
      await Promise.all(
        createdClasses.map(async (c: Class) => {
          const res = await api.get(`/classes/${c.id}/students`);
          if (res.status === 200) {
            const students: StudentId[] = res.data;
            const uniqueIds = new Set(
              (Array.isArray(students) ? students : []).map(
                (s) => s.studentId ?? s.id
              )
            );
            counts[c.id] = uniqueIds.size;
            (Array.isArray(students) ? students : []).forEach((s) =>
              studentSet.add(s.studentId ?? s.id)
            );
          } else {
            counts[c.id] = 0;
          }
        })
      );
      return { counts, distinctStudentCount: studentSet.size };
    },
    enabled: !!sessionUser && !!createdClasses.length,
  });
}

export function useUpcomingAssessments(
  createdClasses: Class[],
  sessionUser: unknown
) {
  return useQuery<Assessment[]>({
    queryKey: ['upcomingAssessments', createdClasses, sessionUser],
    queryFn: async () => {
      if (!sessionUser || !createdClasses.length) return [];
      const allUpcoming: (Assessment & {
        className: string;
        lessonName: string;
      })[] = [];
      for (const c of createdClasses) {
        const lessonsRes = await api.get(`/classes/${c.id}/lessons`);
        const lessons: Lesson[] =
          lessonsRes.status === 200 ? lessonsRes.data : [];
        for (const lesson of lessons) {
          const assessmentsRes = await api.get(
            `/lessons/${lesson.id}/assessments`
          );
          const assessments: Assessment[] =
            assessmentsRes.status === 200 ? assessmentsRes.data : [];
          for (const a of assessments) {
            const due = new Date(a.deadline);
            if (due > new Date()) {
              allUpcoming.push({
                ...a,
                className: c.title,
                lessonName: lesson.name,
              });
            }
          }
        }
      }
      allUpcoming.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      return allUpcoming;
    },
    enabled: !!sessionUser && !!createdClasses.length,
  });
}

export function useLessonPlanCompletion(
  createdClasses: Class[],
  sessionUser: unknown
) {
  return useQuery<{ className: string; total: number; withContent: number }[]>({
    queryKey: ['lessonPlanCompletion', createdClasses, sessionUser],
    queryFn: async () => {
      if (!sessionUser || !createdClasses.length) return [];
      const plans: { className: string; total: number; withContent: number }[] =
        [];
      for (const c of createdClasses) {
        const lessonsRes = await api.get(`/classes/${c.id}/lessons`);
        const lessons: Lesson[] =
          lessonsRes.status === 200 ? lessonsRes.data : [];
        const total = lessons.length;
        const withContent = lessons.filter(
          (l: Lesson) =>
            l.pdfUrl || (l as { videos?: unknown[] }).videos?.length
        ).length;
        plans.push({ className: c.title, total, withContent });
      }
      return plans;
    },
    enabled: !!sessionUser && !!createdClasses.length,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      api.post('/classes', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['createdClasses'] });
    },
  });
}
