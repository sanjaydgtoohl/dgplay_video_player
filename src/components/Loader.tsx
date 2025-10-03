import React from 'react';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderVariant = 'ring' | 'spinner';

interface LoaderProps {
  message?: string;
  subtext?: string;
  progress?: number; // 0-100 for determinate
  size?: LoaderSize;
  variant?: LoaderVariant;
  fullscreen?: boolean; // if true, shows fixed overlay
  className?: string;
}

const sizeToPixels: Record<LoaderSize, number> = {
  sm: 36,
  md: 56,
  lg: 84
};

const clampPercent = (val: number) => Math.max(0, Math.min(100, val));

const Loader: React.FC<LoaderProps> = ({
  message = 'Loading…',
  subtext,
  progress,
  size = 'md',
  variant = 'ring',
  fullscreen = false,
  className
}) => {
  const px = sizeToPixels[size];

  // Determinate ring geometry
  const radius = Math.floor(px / 2) - 6; // inner padding
  const circumference = 2 * Math.PI * radius;
  const pct = typeof progress === 'number' && Number.isFinite(progress)
    ? clampPercent(progress)
    : undefined;
  const dash = pct !== undefined
    ? ((100 - pct) / 100) * circumference
    : undefined;

  const container = (
    <div className={`flex h-full w-full items-center justify-center ${className || ''}`}>
      <div className="flex flex-col items-center gap-4">
        {/* Visual */}
        <div className="relative" style={{ width: px, height: px }} aria-hidden>
          {variant === 'ring' ? (
            <div className="absolute inset-0">
              {/* Soft glow backdrop */}
              <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-[6px]" />
              {/* Track */}
              <svg width={px} height={px} className="block">
                <circle
                  cx={px / 2}
                  cy={px / 2}
                  r={radius}
                  className="text-blue-200"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="none"
                />
                {/* Progress */}
                <circle
                  cx={px / 2}
                  cy={px / 2}
                  r={radius}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dash ?? 0}
                  className={pct === undefined ? '' : 'transition-[stroke-dashoffset] duration-500 ease-out'}
                  stroke="url(#loaderGradient)"
                  fill="none"
                  style={pct === undefined ? { strokeDasharray: circumference, strokeDashoffset: 0 } : undefined}
                />
                <defs>
                  <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Indeterminate sweep */}
              {pct === undefined && (
                <div className="absolute inset-0 animate-spin">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'conic-gradient(from 90deg, rgba(59,130,246,0) 0deg, rgba(59,130,246,0.85) 120deg, rgba(59,130,246,0) 300deg)'
                    }}
                    aria-hidden
                  />
                </div>
              )}
              {/* Center */}
              <div className="absolute inset-2 rounded-full bg-white" />
              <div className="absolute inset-[22%] rounded-full bg-blue-500/10" />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full w-1/3 animate-[shimmer_1.2s_infinite] rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
              </div>
              <style>{'@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }'}</style>
            </div>
          )}
          {/* Percent label for determinate */}
          {pct !== undefined && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-xs font-semibold text-blue-600">{Math.round(pct)}%</span>
            </div>
          )}
        </div>

        {/* Text */}
        {message && <div className="text-sm font-medium text-gray-700">{message}</div>}
        {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-white/65" />
        <div className="relative h-full w-full">{container}</div>
      </div>
    );
  }

  return container;
};

export default Loader;


