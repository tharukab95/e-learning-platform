import React from 'react';
import ClassCard from '@/components/ClassCard';
import { FaChevronRight } from 'react-icons/fa';

interface StudentClassListProps {
  enrolledClasses: any[];
  availableClasses: any[];
  handleEnroll: (classId: string) => void;
  router: any;
}

const StudentClassList: React.FC<StudentClassListProps> = ({
  enrolledClasses,
  availableClasses,
  handleEnroll,
  router,
}) => {
  const allClassCards = [
    ...enrolledClasses.map((c: any) => (
      <div
        key={c.id}
        className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-gradient-to-br from-indigo-50 to-white"
        onClick={() => router.push(`/classes/${c.id}`)}
      >
        <ClassCard classInfo={c} enrolled />
      </div>
    )),
    ...availableClasses.map((c: any) => (
      <div
        key={c.id}
        className="rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-white p-0 flex flex-col justify-between"
      >
        <ClassCard classInfo={c} onEnroll={handleEnroll} />
      </div>
    )),
  ];
  const showMore = allClassCards.length > 4;
  return (
    <section>
      <h2 className="text-xl font-bold mb-6 text-indigo-700">All Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ...allClassCards.slice(0, 4),
          showMore && (
            <div
              key="more-btn"
              className="flex items-center justify-center col-span-2"
            >
              <button
                className="flex items-center gap-2 text-indigo-700 font-medium hover:underline hover:text-indigo-900 transition bg-transparent border-none shadow-none px-0 py-0 focus:outline-none"
                onClick={() => router.push('/dashboard/student/classes')}
              >
                More <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          ),
        ]}
      </div>
    </section>
  );
};

export default StudentClassList;
