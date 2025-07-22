import React from 'react';
import ClassCard from '@/components/ClassCard';
import { FaChevronRight } from 'react-icons/fa';
import { Class } from '@/types/models';
import { useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';

interface StudentClassListProps {
  enrolledClasses: Class[];
  availableClasses: Class[];
  handleEnroll: (classId: string) => void;
  router: ReturnType<typeof useRouter>;
  loadingClasses: boolean;
}

const StudentClassList: React.FC<StudentClassListProps> = ({
  enrolledClasses,
  availableClasses,
  handleEnroll,
  router,
  loadingClasses,
}) => {
  if (loadingClasses) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="w-[240px] h-[320px] bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden flex flex-col p-3"
          >
            <Skeleton height={320} className="mb-3" />
            <Skeleton height={24} width="80%" className="mb-2" />
            <Skeleton height={16} width="60%" />
            <div className="mt-4">
              <Skeleton height={32} width={100} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  const allClassCards = [
    ...enrolledClasses.map((c) => (
      <div
        key={c.id}
        className="cursor-pointer rounded-xl border border-gray-200 shadow hover:border-primary transition-all bg-gradient-to-br from-indigo-50 to-white"
        onClick={() => router.push(`/classes/${c.id}`)}
      >
        <ClassCard classInfo={c} enrolled />
      </div>
    )),
    ...availableClasses.map((c) => (
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
