import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { grade, comments } = await req.json();

  // In a real app, you'd save the grade and comments to the database
  // and trigger a notification to the student.
  console.log(
    `Grading submission ${params.id}: Grade ${grade}, Comments: "${comments}"`
  );

  return NextResponse.json({ success: true });
}
