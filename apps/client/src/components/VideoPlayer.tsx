'use client';

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  videoId: string;
  onProgress?: (currentTime: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoId,
  onProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resume from last watched time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const lastTime = Number(
      localStorage.getItem(`video-progress-${videoId}`) || 0
    );
    const setTime = () => {
      if (lastTime > 0 && lastTime < video.duration) {
        video.currentTime = lastTime;
      }
      video.removeEventListener('loadedmetadata', setTime);
    };
    video.addEventListener('loadedmetadata', setTime);
    return () => video.removeEventListener('loadedmetadata', setTime);
  }, [videoId, src]);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (video && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return undefined;
    }
    return undefined;
  }, [src]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      localStorage.setItem(
        `video-progress-${videoId}`,
        String(video.currentTime)
      );
      if (onProgress) onProgress(video.currentTime);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoId, onProgress]);

  return <video ref={videoRef} controls className="w-full" />;
};

export default VideoPlayer;
