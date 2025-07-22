"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface UploadVideoFormValues {
  title: string;
  description: string;
  video: FileList;
  pdf?: FileList;
}

const uploadVideo = async (data: UploadVideoFormValues) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("video", data.video[0]);
  if (data.pdf && data.pdf.length > 0) {
    formData.append("pdf", data.pdf[0]);
  }
  const response = await api.post("/videos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export default function UploadVideoPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadVideoFormValues>();
  const mutation = useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      router.push("/dashboard/teacher");
    },
  });

  const onSubmit = (data: UploadVideoFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Tutorial Video</h1>
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
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            {...register("description", {
              required: "Description is required",
            })}
            className="textarea textarea-bordered w-full mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="video" className="block text-sm font-medium">
            Video File
          </label>
          <input
            type="file"
            id="video"
            accept="video/*"
            {...register("video", { required: "Video file is required" })}
            className="file-input file-input-bordered w-full mt-1"
          />
          {errors.video && (
            <p className="text-red-500 text-xs mt-1">{errors.video.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="pdf" className="block text-sm font-medium">
            PDF Materials (optional)
          </label>
          <input
            type="file"
            id="pdf"
            accept="application/pdf"
            {...register("pdf")}
            className="file-input file-input-bordered w-full mt-1"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
