"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useForm } from "react-hook-form";

interface Assessment {
  id: string;
  title: string;
  pdfUrl: string;
  grade?: number;
  comments?: string;
}

interface SubmitFormValues {
  file: FileList;
}

const fetchAssessments = async (): Promise<Assessment[]> => {
  const response = await api.get("/assessments");
  return response.data;
};

const submitAssessment = async ({
  id,
  file,
}: {
  id: string;
  file: FileList;
}) => {
  const formData = new FormData();
  formData.append("file", file[0]);
  const response = await api.post(`/assessments/${id}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export default function StudentAssessmentsPage() {
  const { data: assessments, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: fetchAssessments,
  });
  const mutation = useMutation({ mutationFn: submitAssessment });
  const { register, handleSubmit, reset } = useForm<SubmitFormValues>();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const onSubmit = (data: SubmitFormValues) => {
    if (selectedId) {
      mutation.mutate({ id: selectedId, file: data.file });
      reset();
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Assessments</h1>
      <div className="space-y-8">
        {assessments?.map((a: Assessment) => (
          <div key={a.id} className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">{a.title}</h2>
            <a
              href={a.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary mb-2 block"
            >
              Download Questions (PDF)
            </a>
            {a.grade ? (
              <div>
                <p className="font-bold">Grade: {a.grade}/100</p>
                <p>Comments: {a.comments}</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2 mt-2"
                onFocus={() => setSelectedId(a.id)}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  {...register("file", { required: true })}
                  className="file-input file-input-bordered w-full"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : "Submit Answer PDF"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
