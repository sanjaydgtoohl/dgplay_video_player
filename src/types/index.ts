export interface VideoPlayerProps {
  src: string;
  title?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

// Enhanced media types for large screen displays
export type MediaType = 'mp4' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'tag' | 'banner' | 'digital-pod' | 'default';

export type DisplayMode = 'fullscreen' | 'banner' | 'digital-pod' | 'responsive';

export interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    large: number;
  };
  aspectRatios: {
    banner: string;
    digitalPod: string;
    video: string;
  };
}

export interface MediaDisplayConfig {
  type: MediaType;
  displayMode: DisplayMode;
  aspectRatio?: string;
  maxWidth?: string;
  maxHeight?: string;
  responsive?: boolean;
}