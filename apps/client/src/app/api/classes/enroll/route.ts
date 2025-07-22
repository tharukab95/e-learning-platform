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
  const { classId } = await req.json();
  const classToEnroll = classes.find((c) => c.id === classId);

  if (!classToEnroll) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  // In a real app, you'd associate the user with the class here
  console.log(`Enrolling user in class ${classId}`);

  return NextResponse.json(classToEnroll);
}
