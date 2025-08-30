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
  muted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log(`[VideoPlayer] Initializing player for src: ${src}`);

    let hls: Hls | null = null;

    const initializeHLS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            console.log('[VideoPlayer] Manifest parsed, attempting to play.');
            if (autoPlay) {
              video.play().catch((playError) => {
                console.error('[VideoPlayer] Autoplay failed:', playError);
                // Autoplay is often blocked by browsers, we might need user interaction
              });
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error(
              '[VideoPlayer] HLS.js error event:',
              event,
              'data:',
              data
            );
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error(
                    '[VideoPlayer] Fatal network error, retrying...'
                  );
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error(
                    '[VideoPlayer] Fatal media error, trying to recover...'
                  );
                  hls?.recoverMediaError();
                  break;
                default:
                  setError(`Failed to load video stream. Type: ${data.type}`);
                  setIsLoading(false);
                  hls?.destroy();
                  break;
              }
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
        console.error('[VideoPlayer] Initialization error:', err);
      }
    };

    if (src) {
      initializeHLS();
    } else {
      console.log('[VideoPlayer] No src provided, player not initializing.');
      setIsLoading(false);
      setError('No video source specified.');
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white ${className}`}
      >
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
