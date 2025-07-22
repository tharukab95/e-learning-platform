import { NextRequest, NextResponse } from "next/server";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

let notifications: Notification[] = [
  {
    id: "1",
    message: 'New video uploaded to "Intro to Calculus".',
    timestamp: new Date().toISOString(),
    isRead: false,
    link: "/classes/1/tutorial/1",
  },
  {
    id: "2",
    message: 'Assessment for "Modern Physics" is due tomorrow.',
    timestamp: new Date().toISOString(),
    isRead: true,
    link: "/classes/2/assessments",
  },
];

export async function GET() {
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, isRead: true } : n
  );
  return NextResponse.json({ success: true });
}
