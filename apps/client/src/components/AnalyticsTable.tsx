"use client";

import React from "react";

interface AnalyticsData {
  studentName: string;
  completionRate: number;
  submissionDate: string;
}

interface AnalyticsTableProps {
  data: AnalyticsData[];
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Completion Rate</th>
            <th>Submission Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.studentName}</td>
              <td>{row.completionRate}%</td>
              <td>{row.submissionDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsTable;
