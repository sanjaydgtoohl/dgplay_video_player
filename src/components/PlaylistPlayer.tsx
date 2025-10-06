import React, { useEffect, useMemo, useRef, useState } from 'react';

export type CreativeType = 'mp4' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'tag' | 'banner' | 'digital-pod' | 'default';

export interface CreativeItem {
  id: number;
  slot: number;
  media_duration: number; // seconds
  creative_type: CreativeType;
  creative_url: string;
  start_time_sec?: number; // optional in-media start offset in seconds
  end_time_sec?: number;   // optional in-media end offset in seconds
  // Raw API fields (optional, carried through for context/debugging)
  start_time?: string;
  end_time?: string;
  device_id?: number;
  screen_id?: number;
  media_id?: number;
  type?: string;
  cmp_id?: number;
  cmp_start_date_time?: string; // ISO date string
  cmp_end_date_time?: string;   // ISO date string
  loopslot?: number;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
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

function isBanner(type: CreativeType): boolean {
  return type === 'banner';
}

function isDigitalPod(type: CreativeType): boolean {
  return type === 'digital-pod';
}

// Responsive configuration
const RESPONSIVE_CONFIG = {
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    large: 1920
  },
  aspectRatios: {
    banner: '16/9',
    digitalPod: '4/3',
    video: '16/9'
  }
};

// Hook for responsive behavior
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < RESPONSIVE_CONFIG.breakpoints.mobile) {
        setScreenSize('mobile');
      } else if (width < RESPONSIVE_CONFIG.breakpoints.tablet) {
        setScreenSize('tablet');
      } else if (width < RESPONSIVE_CONFIG.breakpoints.desktop) {
        setScreenSize('desktop');
      } else {
        setScreenSize('large');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

interface PlaylistPlayerProps {
  items: CreativeItem[];
}

// Advanced animation constants
const FADE_MS = 1200; // Ultra-smooth fade duration
const CROSSFADE_MS = 1000; // Smooth crossfade duration
const SCALE_EFFECT = 1.005; // Ultra-subtle scale effect
const BLUR_EFFECT = 0.5; // Subtle blur effect

// Advanced easing curves for different effects
const EASING_SMOOTH = 'cubic-bezier(0.23, 1, 0.32, 1)'; // Ultra-smooth ease-out
const EASING_CINEMATIC = 'cubic-bezier(0.25, 0.1, 0.25, 1)'; // Cinematic ease
const EASING_NATURAL = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Natural motion
const EASING_BOUNCE = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'; // Subtle bounce

type VideoRef = React.MutableRefObject<HTMLVideoElement | null> | React.RefObject<HTMLVideoElement | null> | undefined;

// Utility function to parse time strings - moved outside component for better performance
const parseTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else {
    console.warn("Invalid time format:", timeStr);
    return 0;
  }
};

// Utility function to get current time in MM:SS format
const getCurrentTimeString = (): string => {
  const now = new Date();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

// Utility function to check if item is scheduled
const isItemScheduled = (item: CreativeItem, currentTime: string): boolean => {
  // No time restrictions - always show
  if (!item.start_time && !item.end_time) {
    return true;
  }
  
  const currentSeconds = parseTimeToSeconds(currentTime);
  const startSeconds = item.start_time ? parseTimeToSeconds(item.start_time) : 0;
  const endSeconds = item.end_time ? parseTimeToSeconds(item.end_time) : 86400; // 24 hours
  
  return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
};

// Sophisticated animation helper functions
const getEasingForTransition = (transitionType: string, direction: 'in' | 'out'): string => {
  switch (transitionType) {
    case 'fade':
      return direction === 'in' ? EASING_SMOOTH : EASING_CINEMATIC;
    case 'crossfade':
      return EASING_NATURAL;
    case 'slide':
      return direction === 'in' ? EASING_SMOOTH : EASING_CINEMATIC;
    case 'zoom':
      return direction === 'in' ? EASING_BOUNCE : EASING_SMOOTH;
    default:
      return EASING_SMOOTH;
  }
};

const getTransformForTransition = (transitionType: string, direction: 'in' | 'out', isActive: boolean): string => {
  const baseTransform = 'translateZ(0)';
  
  if (!isActive) {
    switch (transitionType) {
      case 'fade':
        return `${baseTransform} scale(${SCALE_EFFECT})`;
      case 'crossfade':
        return `${baseTransform} scale(1)`;
      case 'slide':
        return `${baseTransform} translateX(${direction === 'in' ? '100%' : '-100%'}) scale(${SCALE_EFFECT})`;
      case 'zoom':
        return `${baseTransform} scale(${direction === 'in' ? '0.8' : '1.2'})`;
      default:
        return `${baseTransform} scale(${SCALE_EFFECT})`;
    }
  }
  
  return `${baseTransform} scale(1)`;
};

const getFilterForTransition = (transitionType: string, direction: 'in' | 'out', isActive: boolean): string => {
  if (!isActive) {
    switch (transitionType) {
      case 'fade':
        return `blur(${BLUR_EFFECT}px) brightness(0.9)`;
      case 'crossfade':
        return `blur(0px) brightness(1)`;
      case 'slide':
        return `blur(${BLUR_EFFECT * 0.5}px) brightness(0.95)`;
      case 'zoom':
        return `blur(${BLUR_EFFECT * 1.5}px) brightness(0.8)`;
      default:
        return `blur(${BLUR_EFFECT}px)`;
    }
  }
  
  return 'blur(0px) brightness(1)';
};

const getClipPathForTransition = (transitionType: string, direction: 'in' | 'out', isActive: boolean): string => {
  if (!isActive) {
    switch (transitionType) {
      case 'slide':
        return direction === 'in' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      case 'zoom':
        return 'circle(0% at 50% 50%)';
      default:
        return 'inset(0)';
    }
  }
  
  return 'inset(0)';
};

const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ items }) => {
  // State management
  const [index, setIndex] = useState<number>(0);
  const [time, setTime] = useState(getCurrentTimeString);
  const [prevItem, setPrevItem] = useState<CreativeItem | null>(null);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [currentVisible, setCurrentVisible] = useState<boolean>(false);
  const [transitionType, setTransitionType] = useState<'fade' | 'crossfade' | 'slide' | 'zoom' | 'none'>('none');
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'preparing' | 'transitioning' | 'completing'>('idle');
  
  // Responsive behavior
  const screenSize = useResponsive();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const videoDurationTimerRef = useRef<number | null>(null);

  // Filter items based on URL and scheduling
  const safeItems = useMemo(() => {
    return items.filter(item => {
      // Must have creative_url
      if (!item.creative_url) return false;
      
      // Check if item is currently scheduled
      return isItemScheduled(item, time);
    });
  }, [items, time]);

  // Current and next items
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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      // Determine transition type based on current and next item types
      const nextIndex = (index + 1) % safeItems.length;
      const nextItem = safeItems[nextIndex];
      
      // Pause current video if any to avoid overlapping audio
      if (videoRef.current) {
        try { 
          videoRef.current.pause(); 
          videoRef.current.currentTime = 0; // Reset video position
        } catch (_) {}
      }
      
      // Determine sophisticated transition type
      const currentType = current.creative_type;
      const nextType = nextItem?.creative_type;
      
      let transition: 'fade' | 'crossfade' | 'slide' | 'zoom' | 'none' = 'fade';
      
      // Advanced transition logic
      if (currentType === nextType) {
        transition = 'crossfade'; // Same type = ultra-smooth crossfade
      } else if (isVideo(currentType) && isImage(nextType)) {
        transition = 'zoom'; // Video to image = zoom effect
      } else if (isImage(currentType) && isVideo(nextType)) {
        transition = 'slide'; // Image to video = slide effect
      } else if (isBanner(currentType) || isBanner(nextType)) {
        transition = 'slide'; // Banner content = slide effect
      } else if (isDigitalPod(currentType) || isDigitalPod(nextType)) {
        transition = 'zoom'; // Digital pod = zoom effect
      } else if (isTag(currentType) || isTag(nextType)) {
        transition = 'fade'; // Tag content = clean fade
      }
      
      setAnimationPhase('preparing');
      setTransitionType(transition);
      setPrevItem(current);
      setIsFading(true);
      setCurrentVisible(false);
      
      // Sophisticated timing based on transition type
      const timing = {
        fade: { delay: FADE_MS / 4, duration: FADE_MS },
        crossfade: { delay: CROSSFADE_MS / 3, duration: CROSSFADE_MS },
        slide: { delay: FADE_MS / 5, duration: FADE_MS * 1.2 },
        zoom: { delay: FADE_MS / 6, duration: FADE_MS * 1.1 }
      };
      
      const currentTiming = timing[transition];
      
      // Phase 1: Start transition
      window.setTimeout(() => {
        setAnimationPhase('transitioning');
        setCurrentVisible(true);
      }, currentTiming.delay);
      
      // Phase 2: Complete transition
      window.setTimeout(() => {
        setAnimationPhase('completing');
        setIsFading(false);
        setPrevItem(null);
        setIndex(prev => (prev + 1) % safeItems.length);
      }, currentTiming.duration);
      
      // Phase 3: Reset
      window.setTimeout(() => {
        setTransitionType('none');
        setAnimationPhase('idle');
      }, currentTiming.duration + 100);
    };

    if (isImage(current.creative_type) || isTag(current.creative_type) || isBanner(current.creative_type) || isDigitalPod(current.creative_type)) {
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
          const seekTo = typeof current.start_time === 'number' && current.start_time >= 0
            ? current.start_time
            : 0;
          video.currentTime = seekTo;
        } catch (_) {}
        // Schedule exact advance by provided media_duration if present
        let ms = Math.max(0, (current.media_duration || 0) * 1000);
        if (typeof current.start_time === 'number' && typeof current.end_time === 'number') {
          const clipMs = Math.max(0, (current.end_time - current.start_time) * 1000);
          if (clipMs > 0) ms = clipMs;
        }
        if (ms) {
          videoDurationTimerRef.current = window.setTimeout(() => {
            advance();
          }, ms);
        }
      };

      const handleTimeUpdate = () => {
        if (
          typeof current.end_time === 'number' &&
          video.currentTime >= current.end_time - 0.05 // small epsilon
        ) {
          advance();
        }
      };

      const handleEnded = () => advance();

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);

      // Attempt playback for smoother start
      video.play().catch(() => {});

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        if (videoDurationTimerRef.current) window.clearTimeout(videoDurationTimerRef.current);
      };
    }
  }, [current, safeItems.length]);

  // Preload next media for smoother transitions
  useEffect(() => {
    if (!next) return;
    if (isImage(next.creative_type) || isBanner(next.creative_type) || isDigitalPod(next.creative_type)) {
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
  
  // Get responsive styles based on media type and screen size
  const getResponsiveStyles = (item: CreativeItem) => {
    const baseStyles = {
      width: '100vw',
      height: '100dvh',
      objectFit: 'cover' as const,
    };

    if (isBanner(item.creative_type)) {
      // Banner: Full width, maintain aspect ratio
      return {
        ...baseStyles,
        height: 'auto',
        minHeight: '100dvh',
        aspectRatio: RESPONSIVE_CONFIG.aspectRatios.banner,
        objectFit: 'contain' as const,
      };
    }

    if (isDigitalPod(item.creative_type)) {
      // Digital Pod: Responsive sizing based on screen size
      const podStyles = {
        mobile: { width: '100vw', height: '100dvh', objectFit: 'cover' as const },
        tablet: { width: '100vw', height: '100dvh', objectFit: 'cover' as const },
        desktop: { width: '100vw', height: '100dvh', objectFit: 'cover' as const },
        large: { width: '100vw', height: '100dvh', objectFit: 'cover' as const },
      };
      return { ...baseStyles, ...podStyles[screenSize] };
    }

    return baseStyles;
  };

  const renderLayer = (item: CreativeItem, ref?: VideoRef) => {
    const responsiveStyles = getResponsiveStyles(item);
    
    if (isImage(item.creative_type)) {
      return (
        <img
          src={item.creative_url}
          alt="creative"
          className="absolute inset-0 select-none will-change-transform"
          draggable={false}
          decoding="async"
          loading="eager"
          style={responsiveStyles}
        />
      );
    }

    if (isVideo(item.creative_type)) {
      return (
        <video
          key={item.id}
          ref={ref as React.Ref<HTMLVideoElement>}
          className="absolute inset-0 select-none will-change-transform"
          src={item.creative_url}
          autoPlay
          muted
          playsInline
          preload="auto"
          style={responsiveStyles}
        />
      );
    }

    if (isBanner(item.creative_type)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <img
            src={item.creative_url}
            alt="banner"
            className="max-w-full max-h-full select-none will-change-transform"
            draggable={false}
            decoding="async"
            loading="eager"
            style={{
              aspectRatio: RESPONSIVE_CONFIG.aspectRatios.banner,
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    if (isDigitalPod(item.creative_type)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <div className="relative w-full h-full max-w-4xl max-h-4xl">
            <img
              src={item.creative_url}
              alt="digital pod"
              className="w-full h-full select-none will-change-transform rounded-lg shadow-2xl"
              draggable={false}
              decoding="async"
              loading="eager"
              style={{
                aspectRatio: RESPONSIVE_CONFIG.aspectRatios.digitalPod,
                objectFit: 'cover',
              }}
            />
            {/* Digital pod overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none" />
          </div>
        </div>
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
        style={responsiveStyles}
      />
    );
  };

  return (
    <div 
      className="relative overflow-hidden bg-black" 
      style={{ 
        width: '100vw', 
        height: '100dvh',
        transform: 'translateZ(0)', // Force hardware acceleration
        backfaceVisibility: 'hidden', // Prevent flickering
        perspective: '1000px' // Enable 3D transforms
      }}
    >
      {/* Hidden preloader layer to warm cache for next media */}
      {next && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
          {(isImage(next.creative_type) || isBanner(next.creative_type) || isDigitalPod(next.creative_type)) && (
            <img src={next.creative_url} alt="preload" decoding="async" loading="eager" />
          )}
          {isVideo(next.creative_type) && (
            <video src={next.creative_url} muted preload="auto" />
          )}
        </div>
      )}
      {/* Previous item layer with sophisticated animations */}
      {prevItem && (
        <div
          className={`absolute inset-0 transition-all ${isFading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transitionDuration: `${transitionType === 'crossfade' ? CROSSFADE_MS : FADE_MS}ms`,
            transitionTimingFunction: getEasingForTransition(transitionType, 'out'),
            transitionProperty: 'opacity, transform, filter, clip-path',
            transform: getTransformForTransition(transitionType, 'out', isFading),
            filter: getFilterForTransition(transitionType, 'out', isFading),
            clipPath: getClipPathForTransition(transitionType, 'out', isFading),
            willChange: 'opacity, transform, filter, clip-path'
          }}
        >
          {renderLayer(prevItem)}
        </div>
      )}

      {/* Current item layer with sophisticated animations */}
      <div
        className={`absolute inset-0 transition-all ${currentVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transitionDuration: `${transitionType === 'crossfade' ? CROSSFADE_MS : FADE_MS}ms`,
          transitionTimingFunction: getEasingForTransition(transitionType, 'in'),
          transitionProperty: 'opacity, transform, filter, clip-path',
          transform: getTransformForTransition(transitionType, 'in', currentVisible),
          filter: getFilterForTransition(transitionType, 'in', currentVisible),
          clipPath: getClipPathForTransition(transitionType, 'in', currentVisible),
          willChange: 'opacity, transform, filter, clip-path'
        }}
      >
        {renderLayer(current, videoRef)}
      </div>
    </div>
  );
};

export default PlaylistPlayer;
