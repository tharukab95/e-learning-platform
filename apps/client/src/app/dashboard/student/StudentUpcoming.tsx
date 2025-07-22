import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Assessment } from '@/types/models';

interface StudentUpcomingProps {
  upcomingAssessments: (Assessment & {
    className: string;
    lessonName: string;
  })[];
  loadingClasses: boolean;
}

const StudentUpcoming: React.FC<StudentUpcomingProps> = ({
  upcomingAssessments,
  loadingClasses,
}) => (
  <section>
    <h2 className="text-xl font-bold mb-6 text-indigo-700">Upcoming</h2>
    {loadingClasses ? (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="w-full h-[30px] bg-white shadow-lg border border-gray-200 rounded-md overflow-hidden flex flex-col p-3"
          >
            <Skeleton height={8} width="100%" className="mb-2" />
            <Skeleton height={8} width="100%" className="mb-2" />
            <Skeleton height={8} width="100%" />
          </div>
        ))}
      </div>
    ) : upcomingAssessments.length === 0 ? (
      <div className="text-gray-500">
        No upcoming assessments in the next week.
      </div>
    ) : (
      <ul className="list-disc pl-5 space-y-2">
        {upcomingAssessments.map((a, idx) => (
          <li key={idx} className="mb-2">
            <div>
              <span className="font-semibold text-indigo-800">{a.title}</span>{' '}
              &mdash;
              <span className="text-gray-700">{a.className}</span> /{' '}
              <span className="text-gray-700">{a.lessonName}</span>
            </div>
            <div className="ml-2 text-xs text-gray-500 mt-1">
              Due: {new Date(a.deadline).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default StudentUpcoming;
