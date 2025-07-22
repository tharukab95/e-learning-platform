/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';

interface ClassCardProps {
  classInfo: {
    id: string;
    title: string;
    subject: string;
    thumbnail?: string;
  };
  onEnroll?: (id: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo, onEnroll }) => {
  return (
    <div className="card w-40 bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-primary transition-all">
      {classInfo.thumbnail && (
        <div className="w-full aspect-[9/16] bg-base-200 flex items-center justify-center p-0 m-0">
          <img
            src={classInfo.thumbnail}
            alt={classInfo.title}
            className="object-contain w-full h-full p-0 m-0"
            style={{ display: 'block' }}
          />
        </div>
      )}
      <div className="card-body p-3">
        <h2 className="card-title text-base font-semibold line-clamp-1 mb-0.5">
          {classInfo.title}
        </h2>
        <p className="text-xs text-gray-500 line-clamp-1 mb-1">
          {classInfo.subject}
        </p>
        {onEnroll && (
          <div className="card-actions justify-end mt-2">
            <button
              onClick={() => onEnroll(classInfo.id)}
              className="btn btn-xs btn-primary rounded-full px-4 font-bold shadow-md hover:scale-105 transition-transform"
            >
              Enroll Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
