"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface CreateClassFormValues {
  title: string;
  subject: string;
  description: string;
}

const createClass = async (data: CreateClassFormValues) => {
  const response = await api.post("/classes", data);
  return response.data;
};

export default function CreateClassPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClassFormValues>();
  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      router.push("/dashboard/teacher");
    },
  });

  const onSubmit = (data: CreateClassFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create New Class</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            {...register("title", { required: "Title is required" })}
            className="input input-bordered w-full mt-1"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium">
            Subject
          </label>
          <input
            id="subject"
            {...register("subject", { required: "Subject is required" })}
            className="input input-bordered w-full mt-1"
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">
              {errors.subject.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            className="textarea textarea-bordered w-full mt-1"
            rows={4}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Class"}
        </button>
      </form>
    </div>
  );
}
