"use client";

import React from "react";
import { useForm } from "react-hook-form";

interface AssessmentFormValues {
  file: FileList;
}

const AssessmentForm: React.FC = () => {
  const { register, handleSubmit } = useForm<AssessmentFormValues>();

  const onSubmit = (data: AssessmentFormValues) => {
    console.log(data.file[0]);
    // Handle file upload logic here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700"
        >
          Upload Assessment
        </label>
        <input
          type="file"
          id="file"
          {...register("file", { required: true })}
          className="file-input file-input-bordered w-full mt-1"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
};

export default AssessmentForm;
