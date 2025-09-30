import React, { useEffect, useMemo, useRef, useState } from 'react';

export type CreativeType = 'mp4' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'tag' | 'default';

export interface CreativeItem {
  id: number;
  slot: number;
  media_duration: number; // seconds
  creative_type: CreativeType;
  creative_url: string;
}

function isImage(type: CreativeType): boolean {
  return type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif' || type === 'default';
}

function isVideo(type: CreativeType): boolean {
  return type === 'mp4';
}

function isTag(type: CreativeType): boolean {
  return type === 'tag';
}

interface PlaylistPlayerProps {
  items: CreativeItem[];
}

const FADE_MS = 700;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'; // ease-out expo-like

type VideoRef = React.MutableRefObject<HTMLVideoElement | null> | React.RefObject<HTMLVideoElement | null> | undefined;

const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ items }) => {
  const safeItems = useMemo(() => items.filter(i => i.creative_url), [items]);
  const [index, setIndex] = useState<number>(0);
  const [prevItem, setPrevItem] = useState<CreativeItem | null>(null);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [currentVisible, setCurrentVisible] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const videoDurationTimerRef = useRef<number | null>(null);

  const current = safeItems[index % (safeItems.length || 1)];
  const next = useMemo(() => {
    if (!safeItems.length) return null;
    return safeItems[(index + 1) % safeItems.length] || null;
  }, [index, safeItems]);

  useEffect(() => {
    setCurrentVisible(false);
    const id = window.setTimeout(() => setCurrentVisible(true), 20);
    return () => window.clearTimeout(id);
  }, [current?.id]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (videoDurationTimerRef.current) {
      window.clearTimeout(videoDurationTimerRef.current);
      videoDurationTimerRef.current = null;
    }

    if (!current || safeItems.length === 0) return;

    const advance = () => {
      // Pause current video if any to avoid overlapping audio
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (_) {}
      }
      console.log("current ",current);
      setPrevItem(current);
      setIsFading(true);
      setCurrentVisible(true);
      window.setTimeout(() => {
        setIsFading(false);
        setPrevItem(null);
        setIndex(prev => (prev + 1) % safeItems.length);
      }, FADE_MS);
    };

    if (isImage(current.creative_type) || isTag(current.creative_type)) {
      const ms = Math.max(0, (current.media_duration || 0) * 1000);
      timerRef.current = window.setTimeout(advance, ms || 1000);
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }

    if (isVideo(current.creative_type)) {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedMetadata = () => {
        try {
          video.currentTime = 0;
        } catch (_) {}
        // Schedule exact advance by provided media_duration if present
        const ms = Math.max(0, (current.media_duration || 0) * 1000);
        if (ms) {
          videoDurationTimerRef.current = window.setTimeout(() => {
            advance();
          }, ms);
        }
      };

      const handleEnded = () => advance();

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleEnded);

      // Attempt playback for smoother start
      video.play().catch(() => {});

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
        if (videoDurationTimerRef.current) window.clearTimeout(videoDurationTimerRef.current);
      };
    }
  }, [current, safeItems.length]);

  // Preload next media for smoother transitions
  useEffect(() => {
    if (!next) return;
    if (isImage(next.creative_type)) {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager' as any;
      img.src = next.creative_url;
    } else if (isVideo(next.creative_type)) {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.src = next.creative_url;
      try { v.load(); } catch (_) {}
    }
  }, [next]);

  if (!current) {
    return <div className="flex h-screen w-screen items-center justify-center text-gray-500">No media</div>;
  }

  const renderLayer = (item: CreativeItem, ref?: VideoRef) => {
    if (isImage(item.creative_type)) {
      return (
        <img
          src={item.creative_url}
          alt="creative"
          className="absolute inset-0 select-none object-cover will-change-transform"
          draggable={false}
          decoding="async"
          loading="eager"
          style={{ width: '100vw', height: '100dvh' }}
        />
      );
    }

    if (isVideo(item.creative_type)) {
      return (
        <video
          key={item.id}
          ref={ref as React.Ref<HTMLVideoElement>}
          className="absolute inset-0 select-none object-cover will-change-transform"
          src={item.creative_url}
          autoPlay
          muted
          playsInline
          preload="auto"
          style={{ width: '100vw', height: '100dvh' }}
        />
      );
    }

    return (
      <iframe
        key={item.id}
        src={item.creative_url}
        title={`tag-${item.id}`}
        className="absolute inset-0 border-0"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        style={{ width: '100vw', height: '100dvh' }}
      />
    );
  };

  return (
    <div className="relative overflow-hidden bg-black" style={{ width: '100vw', height: '100dvh' }}>
      {/* Hidden preloader layer to warm cache for next media */}
      {next && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
          {isImage(next.creative_type) && (
            <img src={next.creative_url} alt="preload" decoding="async" loading="eager" />
          )}
          {isVideo(next.creative_type) && (
            <video src={next.creative_url} muted preload="auto" />
          )}
        </div>
      )}
      {prevItem && (
        <div
          className={`absolute inset-0 transition-opacity ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transitionDuration: `${FADE_MS}ms`,
            transitionTimingFunction: EASING,
            transitionProperty: 'opacity, transform',
            transform: isFading ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          {renderLayer(prevItem)}
        </div>
      )}

      <div
        className={`absolute inset-0 transition-opacity ease-in-out ${currentVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transitionDuration: `${FADE_MS}ms`,
          transitionTimingFunction: EASING,
          transitionProperty: 'opacity, transform',
          transform: currentVisible ? 'scale(1)' : 'scale(1.02)'
        }}
      >
        {renderLayer(current, videoRef)}
      </div>
    </div>
  );
};

export default PlaylistPlayer;
