"use client";

import React from "react";

interface ClassCardProps {
  classInfo: {
    id: string;
    title: string;
    subject: string;
  };
  onEnroll: (id: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo, onEnroll }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{classInfo.title}</h2>
        <p>{classInfo.subject}</p>
        <div className="card-actions justify-end">
          <button
            onClick={() => onEnroll(classInfo.id)}
            className="btn btn-primary"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
