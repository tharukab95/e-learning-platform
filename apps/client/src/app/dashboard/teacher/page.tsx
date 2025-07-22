/* eslint-disable @typescript-eslint/no-empty-function */
"use client";

import React from "react";
import AnalyticsTable from "@/components/AnalyticsTable";
import NotificationItem from "@/components/NotificationItem";
import Link from "next/link";

const mockAnalytics = [
  { studentName: "Charlie", completionRate: 85, submissionDate: "2024-07-20" },
  { studentName: "Diana", completionRate: 92, submissionDate: "2024-07-19" },
];

const mockNotifications = [
  {
    id: "1",
    message: "Bob submitted an assessment.",
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: "2",
    message: 'New video uploaded to "Intro to calculus".',
    timestamp: new Date().toISOString(),
    isRead: true,
  },
];

export default function TeacherDashboard() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Enrolled Students</div>
          <div className="stat-value">1,200</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value">88%</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Upcoming Assessments</div>
          <div className="stat-value">3</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-x-4">
        <Link
          href="/dashboard/teacher/create-class"
          className="btn btn-primary"
        >
          Create New Class
        </Link>
        <button className="btn btn-secondary">Upload Video</button>
        <button className="btn btn-accent">Create Assessment</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notifications */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Notifications</h2>
          <div className="bg-white rounded shadow">
            {mockNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Student Progress */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
          <AnalyticsTable data={mockAnalytics} />
        </div>
      </div>
    </div>
  );
}
