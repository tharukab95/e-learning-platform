import React from 'react';

interface TeacherLessonPlanTableProps {
  lessonPlanCompletion: any[];
}

const TeacherLessonPlanTable: React.FC<TeacherLessonPlanTableProps> = ({
  lessonPlanCompletion,
}) => (
  <div className="mt-4">
    <h2 className="text-xl font-bold mb-4 text-indigo-700">
      Lesson Plan Completion
    </h2>
    <div className="overflow-x-auto rounded-xl shadow">
      <table className="min-w-full bg-white rounded-xl">
        <thead>
          <tr className="bg-indigo-50">
            <th className="py-3 px-4 text-left font-semibold text-indigo-700">
              Class
            </th>
            <th className="py-3 px-4 text-left font-semibold text-indigo-700">
              Covered/Completion
            </th>
          </tr>
        </thead>
        <tbody>
          {lessonPlanCompletion.map((plan, idx) => (
            <tr
              key={idx}
              className="border-b last:border-none hover:bg-indigo-50/40 transition"
            >
              <td className="py-3 px-4">{plan.className}</td>
              <td className="py-3 px-4">
                {plan.withContent}/{plan.total} (
                {plan.total
                  ? Math.round((plan.withContent / plan.total) * 100)
                  : 0}
                %)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TeacherLessonPlanTable;
