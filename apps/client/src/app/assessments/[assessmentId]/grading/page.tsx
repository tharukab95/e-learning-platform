"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface Submission {
  id: string;
  studentName: string;
  submissionDate: string;
  pdfUrl: string;
  grade?: number;
  comments?: string;
}

interface GradeFormValues {
  grade: number;
  comments: string;
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    studentName: "Charlie",
    submissionDate: "2024-07-22",
    pdfUrl: "/mock/submission1.pdf",
  },
  {
    id: "2",
    studentName: "Diana",
    submissionDate: "2024-07-23",
    pdfUrl: "/mock/submission2.pdf",
    grade: 92,
    comments: "Great work!",
  },
];

const gradeSubmission = async ({
  id,
  grade,
  comments,
}: {
  id: string;
  grade: number;
  comments: string;
}) => {
  const response = await api.post(`/assessments/submissions/${id}/grade`, {
    grade,
    comments,
  });
  return response.data;
};

export default function GradingPage() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: gradeSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
  const { register, handleSubmit } = useForm<GradeFormValues>();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const onSubmit = (data: GradeFormValues) => {
    if (selectedId) {
      mutation.mutate({ id: selectedId, ...data });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Grade Submissions</h1>
      <div className="space-y-6">
        {mockSubmissions.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{s.studentName}</p>
                <p className="text-sm">Submitted on: {s.submissionDate}</p>
                <a
                  href={s.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  View Submission
                </a>
              </div>
              {s.grade && (
                <div className="text-right">
                  <p className="font-bold">Grade: {s.grade}/100</p>
                  <p className="text-sm">{s.comments}</p>
                </div>
              )}
            </div>
            {!s.grade && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                onFocus={() => setSelectedId(s.id)}
                className="mt-4 flex gap-4 items-center"
              >
                <input
                  type="number"
                  {...register("grade", { required: true, min: 0, max: 100 })}
                  className="input input-bordered w-24"
                  placeholder="Grade"
                />
                <input
                  type="text"
                  {...register("comments")}
                  className="input input-bordered flex-1"
                  placeholder="Comments"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending}
                >
                  Submit Grade
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
