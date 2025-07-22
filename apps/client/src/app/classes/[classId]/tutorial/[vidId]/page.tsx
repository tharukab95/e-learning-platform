"use client";

import React from "react";
import VideoPlayer from "@/components/VideoPlayer";

// Mock video data for demonstration
const mockVideo = {
  id: "1",
  title: "Sample Tutorial",
  description: "This is a sample video for demonstration.",
  videoUrl: "/mock/video.m3u8",
  pdfUrl: "/mock/material.pdf",
};

export default function VideoWatchPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{mockVideo.title}</h1>
      <p className="mb-4 text-gray-600">{mockVideo.description}</p>
      <VideoPlayer src={mockVideo.videoUrl} />
      {mockVideo.pdfUrl && (
        <a
          href={mockVideo.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary mt-4"
        >
          Download PDF Materials
        </a>
      )}
      {/* Mock progress display */}
      <div className="mt-6">
        <div className="mb-1 text-sm">Watched: 60%</div>
        <progress
          className="progress progress-primary w-full"
          value={60}
          max={100}
        ></progress>
      </div>
    </div>
  );
}
