import React from 'react';

interface TeacherMetricsProps {
  distinctStudentCount: number;
  upcomingAssessmentsCount: number;
}

const TeacherMetrics: React.FC<TeacherMetricsProps> = ({
  distinctStudentCount,
  upcomingAssessmentsCount,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-2">
    <div className="rounded-xl bg-gradient-to-br from-indigo-100 to-white shadow p-6 flex flex-col items-center">
      <div className="text-sm font-medium text-indigo-700 mb-1">
        Enrolled Students
      </div>
      <div className="text-3xl font-bold text-indigo-900">
        {distinctStudentCount}
      </div>
    </div>
    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-white shadow p-6 flex flex-col items-center">
      <div className="text-sm font-medium text-blue-700 mb-1">
        Upcoming Assessments
      </div>
      <div className="text-3xl font-bold text-blue-900">
        {upcomingAssessmentsCount}
      </div>
    </div>
  </div>
);

export default TeacherMetrics;
