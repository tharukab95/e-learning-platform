import { create } from "zustand";

export interface Class {
  id: string;
  title: string;
  description: string;
  teacherId: string;
}

interface ClassesState {
  classes: Class[];
  enrolledClasses: Class[];
  setClasses: (classes: Class[]) => void;
  setEnrolledClasses: (classes: Class[]) => void;
}

export const useClassesStore = create<ClassesState>((set) => ({
  classes: [],
  enrolledClasses: [],
  setClasses: (classes) => set({ classes }),
  setEnrolledClasses: (classes) => set({ enrolledClasses: classes }),
}));
