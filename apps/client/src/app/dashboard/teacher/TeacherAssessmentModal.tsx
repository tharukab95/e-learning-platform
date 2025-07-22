import React from 'react';
import { Class, Lesson } from '@/types/models';

interface TeacherAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  assessmentForm: {
    classId: string;
    lessonId: string;
    title: string;
    deadline: string;
    file: File | null;
  };
  assessmentLessons: Lesson[];
  createdClasses: Class[];
  handleAssessmentInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleAssessmentFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  error: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const TeacherAssessmentModal: React.FC<TeacherAssessmentModalProps> = ({
  open,
  onClose,
  onSubmit,
  assessmentForm,
  assessmentLessons,
  createdClasses,
  handleAssessmentInputChange,
  handleAssessmentFileChange,
  isSubmitting,
  error,
  fileInputRef,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Create Assessment</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              name="classId"
              value={assessmentForm.classId}
              onChange={handleAssessmentInputChange}
              className="select select-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
              required
            >
              <option value="">Select a class</option>
              {createdClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lesson</label>
            <select
              name="lessonId"
              value={assessmentForm.lessonId}
              onChange={handleAssessmentInputChange}
              className="select select-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
              required
              disabled={!assessmentForm.classId}
            >
              <option value="">Select a lesson</option>
              {assessmentLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Assessment Name
            </label>
            <input
              type="text"
              name="title"
              value={assessmentForm.title}
              onChange={handleAssessmentInputChange}
              className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={assessmentForm.deadline}
              onChange={handleAssessmentInputChange}
              className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Assessment PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              name="pdf"
              ref={fileInputRef}
              onChange={handleAssessmentFileChange}
              className="file-input file-input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none px-3 py-2"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-500 shadow-sm hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full border border-primary text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherAssessmentModal;
