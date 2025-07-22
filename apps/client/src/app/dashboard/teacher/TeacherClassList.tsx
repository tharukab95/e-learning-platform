import React from 'react';
import ClassCard from '@/components/ClassCard';
import { FaChevronRight } from 'react-icons/fa';

interface TeacherClassListProps {
  createdClasses: any[];
  enrollmentCounts: Record<string, number>;
  router: any;
}

const TeacherClassList: React.FC<TeacherClassListProps> = ({
  createdClasses,
  enrollmentCounts,
  router,
}) =>
  createdClasses.length > 0 ? (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">
        Your Created Classes
      </h2>
      <div className="flex flex-wrap gap-4">
        {createdClasses.slice(0, 3).map((c) => (
          <div key={c.id} className="relative">
            <ClassCard
              classInfo={c}
              onClick={() => router.push(`/classes/${c.id}/lesson-plan`)}
            />
            <div className="absolute top-2 left-2 bg-indigo-700 text-white text-xs rounded-full px-2 py-0.5 shadow">
              {enrollmentCounts[c.id] === 1
                ? '1 student'
                : `${enrollmentCounts[c.id] ?? 0} students`}
            </div>
          </div>
        ))}
      </div>
      {createdClasses.length > 3 && (
        <div className="flex justify-end mt-4">
          <button
            className="flex items-center gap-2 text-indigo-700 font-medium hover:underline hover:text-indigo-900 transition bg-transparent border-none shadow-none px-0 py-0 focus:outline-none"
            onClick={() => router.push('/dashboard/teacher/classes')}
          >
            More <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  ) : null;

export default TeacherClassList;
