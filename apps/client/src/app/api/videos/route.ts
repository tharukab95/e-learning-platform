import { NextRequest, NextResponse } from "next/server";

interface Video {
  id: string;
  title: string | null;
  description: string | null;
  videoUrl: string;
  pdfUrl?: string;
}

const videos: Video[] = [];

export async function POST(req: NextRequest) {
  // In a real app, you'd handle file uploads and storage here
  const formData = await req.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const video = formData.get("video");
  const pdf = formData.get("pdf");

  const newVideo: Video = {
    id: String(videos.length + 1),
    title: title as string,
    description: description as string,
    videoUrl: "/mock/video.m3u8", // Mock HLS URL
    pdfUrl: pdf ? "/mock/material.pdf" : undefined,
  };
  videos.push(newVideo);

  // In a real app, you'd notify students here

  return NextResponse.json(newVideo, { status: 201 });
}

export async function GET() {
  return NextResponse.json(videos);
}
