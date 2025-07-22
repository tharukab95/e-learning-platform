import { NextRequest, NextResponse } from "next/server";

interface Assessment {
  id: string;
  title: string;
  pdfUrl: string;
}

let assessments: Assessment[] = [];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = formData.get("title") as string;
  // In a real app, you'd store the PDF and generate a URL
  const pdfUrl = "/mock/assessment.pdf";
  const newAssessment: Assessment = {
    id: String(assessments.length + 1),
    title,
    pdfUrl,
  };
  assessments.push(newAssessment);
  // In a real app, you'd notify students here
  return NextResponse.json(newAssessment, { status: 201 });
}

export async function GET() {
  return NextResponse.json(assessments);
}
