'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const initializeHLS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play().catch(console.error);
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              setError('Failed to load video stream');
              setIsLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play().catch(console.error);
            }
          });
        } else {
          setError('HLS is not supported in this browser');
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to initialize video player');
        setIsLoading(false);
        console.error('Video player error:', err);
      }
    };

    initializeHLS();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading video</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        className="w-full h-full object-cover"
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
