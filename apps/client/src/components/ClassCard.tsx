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
  onClick?: (id: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({
  classInfo,
  onEnroll,
  onClick,
}) => {
  return (
    <div
      className={
        'w-[200px] bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-primary transition-all flex flex-col' +
        (onClick ? ' cursor-pointer' : '')
      }
      onClick={onClick ? () => onClick(classInfo.id) : undefined}
    >
      {classInfo.thumbnail && (
        <div className="w-full h-[270px] bg-base-200 flex items-center justify-center">
          <img
            src={classInfo.thumbnail}
            alt={classInfo.title}
            className="object-cover w-full h-[270px] p-0 m-0"
            style={{ display: 'block' }}
          />
        </div>
      )}
      <div className="card-body p-3 flex flex-col justify-between flex-1 min-h-[90px]">
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
              className="px-4 py-1 text-sm font-bold rounded-full shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
