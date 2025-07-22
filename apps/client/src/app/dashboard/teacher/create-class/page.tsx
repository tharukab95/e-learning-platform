'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface CreateClassFormValues {
  title: string;
  subject: string;
  description: string;
  thumbnail?: FileList;
}

const createClass = async (data: FormData) => {
  const response = await api.post('/classes', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default function CreateClassPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateClassFormValues>();
  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      router.push('/dashboard/teacher');
    },
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnail = watch('thumbnail');

  React.useEffect(() => {
    if (thumbnail && thumbnail.length > 0) {
      const file = thumbnail[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [thumbnail]);

  const onSubmit = (data: CreateClassFormValues) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('subject', data.subject);
    formData.append('description', data.description || '');
    if (data.thumbnail && data.thumbnail[0]) {
      formData.append('thumbnail', data.thumbnail[0]);
    }
    mutation.mutate(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-full max-w-2xl bg-white shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create New Class
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="input input-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium">
                  Subject
                </label>
                <input
                  id="subject"
                  {...register('subject', { required: 'Subject is required' })}
                  className="input input-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.subject.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="textarea textarea-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="block text-sm font-medium mb-1">
                Thumbnail
              </label>
              <div
                className="w-32 h-32 bg-base-300 rounded-lg flex items-center justify-center cursor-pointer border border-dashed border-gray-300 hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Thumbnail Preview"
                    className="object-cover w-full h-full rounded-lg"
                  />
                ) : (
                  <span className="text-gray-400">Click to upload</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                {...register('thumbnail')}
                ref={fileInputRef}
                className="hidden"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Creating...' : 'Create Class'}
          </button>
        </form>
      </div>
    </div>
  );
}
