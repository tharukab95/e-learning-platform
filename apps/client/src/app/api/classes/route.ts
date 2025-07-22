import { NextRequest, NextResponse } from "next/server";

const classes = [
  {
    id: "1",
    title: "Intro to Calculus",
    subject: "Math",
    description: "Learn the basics of calculus.",
  },
  {
    id: "2",
    title: "Modern Physics",
    subject: "Science",
    description: "Explore the world of modern physics.",
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newClass = {
    id: String(classes.length + 1),
    ...body,
  };
  classes.push(newClass);
  return NextResponse.json(newClass, { status: 201 });
}

export async function GET() {
  return NextResponse.json(classes);
}
