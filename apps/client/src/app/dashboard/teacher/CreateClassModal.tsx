'use client';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CreateClassFormValues {
  title: string;
  subject: string;
  description: string;
}

interface CreateClassModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  isPending: boolean;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({
  open,
  onClose,
  onSubmit,
  isPending,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClassFormValues>();
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFormSubmit = async (data: CreateClassFormValues) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('subject', data.subject);
    formData.append('description', data.description || '');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    await onSubmit(formData);
    reset();
    setPreview(null);
    setThumbnailFile(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          &times;
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create New Class
        </h1>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="input input-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                  className="input input-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
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
                  className="textarea textarea-bordered w-full mt-1 border-2 border-gray-300 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="block text-sm font-medium mb-1">
                Thumbnail
              </label>
              <div
                className="w-28 h-48 bg-base-300 rounded-lg flex items-center justify-center cursor-pointer border border-dashed border-gray-300 hover:border-primary relative aspect-[9/16]"
                onClick={() => !preview && fileInputRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Thumbnail Preview"
                      className="object-contain w-full h-full rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        setThumbnailFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = '';
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-red-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400">Click to upload</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={onThumbnailChange}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;
