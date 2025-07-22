import React from 'react';
import Skeleton from 'react-loading-skeleton';

interface StudentUpcomingProps {
  upcomingAssessments: any[];
  loadingClasses: boolean;
}

const StudentUpcoming: React.FC<StudentUpcomingProps> = ({
  upcomingAssessments,
  loadingClasses,
}) => (
  <section>
    <h2 className="text-xl font-bold mb-6 text-indigo-700">Upcoming</h2>
    {loadingClasses ? (
      <ul className="list-disc pl-5 space-y-2">
        {[...Array(3)].map((_, idx) => (
          <li key={idx}>
            <Skeleton height={20} width="80%" />
          </li>
        ))}
      </ul>
    ) : upcomingAssessments.length === 0 ? (
      <div className="text-gray-500">
        No upcoming assessments in the next week.
      </div>
    ) : (
      <ul className="list-disc pl-5 space-y-2">
        {upcomingAssessments.map((a, idx) => (
          <li key={idx} className="mb-2">
            <div>
              <span className="font-semibold text-indigo-800">
                {a.assessmentTitle}
              </span>{' '}
              &mdash;
              <span className="text-gray-700">{a.className}</span> /{' '}
              <span className="text-gray-700">{a.lessonName}</span>
            </div>
            <div className="ml-2 text-xs text-gray-500 mt-1">
              Due: {a.due.toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default StudentUpcoming;
