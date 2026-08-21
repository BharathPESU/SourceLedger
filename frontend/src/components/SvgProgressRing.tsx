import React from 'react';

interface SvgProgressRingProps {
  value: number; // 0 to 100
  size?: number; // diameter in px (e.g. 28, 34, 42, 64)
  strokeWidth?: number; // thickness of the stroke
  showText?: boolean;
  textSizeClass?: string;
  variant?: 'orange' | 'green' | 'amber' | 'charcoal' | 'dynamic';
  trackColor?: string;
  className?: string;
  glow?: boolean;
}

export const SvgProgressRing: React.FC<SvgProgressRingProps> = ({
  value,
  size = 32,
  strokeWidth = 3.5,
  showText = true,
  textSizeClass,
  variant = 'dynamic',
  trackColor = 'rgba(223, 205, 188, 0.45)',
  className = '',
  glow = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Determine stroke color based on variant or dynamic value
  let strokeColor = '#E8622C';
  let gradientId = `ring-grad-${Math.round(value)}-${size}`;

  if (variant === 'orange') {
    strokeColor = '#E8622C';
  } else if (variant === 'green') {
    strokeColor = '#1F8A53';
  } else if (variant === 'amber') {
    strokeColor = '#D97706';
  } else if (variant === 'charcoal') {
    strokeColor = '#191715';
  } else {
    // Dynamic grading
    if (clampedValue >= 90) {
      strokeColor = '#1F8A53'; // Emerald high-grade
    } else if (clampedValue >= 85) {
      strokeColor = '#E8622C'; // Burnt Orange brand grade
    } else if (clampedValue >= 70) {
      strokeColor = '#D97706'; // Amber review grade
    } else {
      strokeColor = '#D45320'; // Terracotta conflict grade
    }
  }

  // Automatic font sizing if not provided
  const fontSize = textSizeClass || (size <= 28 ? 'text-[8px]' : size <= 36 ? 'text-[10px]' : size <= 48 ? 'text-xs' : 'text-sm');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={`Catalog Health: ${clampedValue}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={
                strokeColor === '#1F8A53'
                  ? '#10B981'
                  : strokeColor === '#E8622C'
                  ? '#F2994A'
                  : strokeColor === '#D97706'
                  ? '#FBBF24'
                  : '#EA580C'
              }
              stopOpacity="0.85"
            />
          </linearGradient>

          {glow && (
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Dynamic Animated Value Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={glow ? `url(#glow-${gradientId})` : undefined}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Centered Percentage Label */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-bold font-mono tracking-tighter text-[#191715] leading-none ${fontSize}`}>
            {Math.round(clampedValue)}
            <span className="text-[70%] font-semibold opacity-75">%</span>
          </span>
        </div>
      )}
    </div>
  );
};
