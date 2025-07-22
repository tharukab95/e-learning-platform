"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import ClassCard from "@/components/ClassCard";
import { useClassesStore, Class } from "@/state/classes";

const fetchClasses = async (): Promise<Class[]> => {
  const response = await api.get("/classes");
  return response.data;
};

const enrollInClass = async (classId: string): Promise<Class> => {
  const response = await api.post(`/classes/enroll`, { classId });
  return response.data;
};

export default function EnrollPage() {
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });
  const { enrolledClasses, setEnrolledClasses } = useClassesStore();
  const mutation = useMutation({
    mutationFn: enrollInClass,
    onSuccess: (data) => {
      setEnrolledClasses([...enrolledClasses, data]);
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Enroll in a Class</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((classInfo) => (
          <ClassCard
            key={classInfo.id}
            classInfo={classInfo}
            onEnroll={() => mutation.mutate(classInfo.id)}
          />
        ))}
      </div>
    </div>
  );
}
