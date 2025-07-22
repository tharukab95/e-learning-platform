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
  enrolled?: boolean;
  widthClass?: string;
  heightClass?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  classInfo,
  onEnroll,
  onClick,
  enrolled,
  widthClass = 'min-w-[230px] w-full',
  heightClass = 'h-[270px]',
}) => {
  return (
    <div
      className={
        `${widthClass} bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-primary transition-all flex flex-col` +
        (onClick ? ' cursor-pointer' : '')
      }
      onClick={onClick ? () => onClick(classInfo.id) : undefined}
    >
      {/* Card image as top section, flush with card edges */}
      {classInfo.thumbnail ? (
        <img
          src={classInfo.thumbnail}
          alt={classInfo.title}
          className={`object-cover w-full ${heightClass} rounded-t-xl`}
          style={{ display: 'block' }}
        />
      ) : (
        <div
          className={`w-full ${heightClass} bg-base-200 flex items-center justify-center rounded-t-xl`}
        />
      )}
      <div className="p-4 flex flex-col justify-between flex-1 min-h-[90px]">
        <h2 className="text-base font-semibold line-clamp-1 mb-0.5">
          {classInfo.title}
        </h2>
        <p className="text-xs text-gray-500 line-clamp-1 mb-1">
          {classInfo.subject}
        </p>
        {onEnroll && !enrolled && (
          <div className="flex justify-end mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnroll(classInfo.id);
              }}
              className="px-4 py-1 text-sm font-bold rounded-full shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Enroll Now
            </button>
          </div>
        )}
        {enrolled && (
          <div className="flex justify-end mt-2">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              Enrolled
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
