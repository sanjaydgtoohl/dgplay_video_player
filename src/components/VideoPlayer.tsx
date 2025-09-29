import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Attempt autoplay programmatically as well
    const tryPlay = async () => {
      try {
        await video.play();
      } catch (_) {
        // Autoplay might be blocked; nothing to do if muted+autoplay still fails
      }
    };
    tryPlay();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [src]);

  return (
    <div className="relative flex flex-col items-center">
      <video
        ref={videoRef}
        className="w-full max-w-3xl rounded-lg shadow"
        src={src}
        autoPlay
        muted
        playsInline
        // no default controls
      />

      {/* Time indicator overlay */}
      {/* <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div> */}

      {/* Minimal progress bar */}
      {/* <div className="mt-3 h-1.5 w-full max-w-3xl rounded bg-gray-300">
        <div
          className="h-1.5 rounded bg-blue-500"
          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div> */}
    </div>
  );
};

export default VideoPlayer;