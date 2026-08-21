import React from 'react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // width & height in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  valueSuffix?: string;
  color?: 'orange' | 'charcoal' | 'green' | 'amber';
  trackColor?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 110,
  strokeWidth = 10,
  label,
  sublabel,
  showValue = true,
  valueSuffix = '%',
  color = 'orange',
  trackColor = '#EBDDCB',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  const colorMap = {
    orange: '#E8622C',
    charcoal: '#262320',
    green: '#1F8A53',
    amber: '#C47C10'
  };

  const strokeColor = colorMap[color];

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] transform transition-transform duration-700 ease-out"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display font-bold text-xl tracking-tight text-[#191715]">
              {Math.round(clampedValue)}
              <span className="text-xs font-semibold text-[#5C554D] ml-0.5">{valueSuffix}</span>
            </span>
            {sublabel && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C8276] -mt-0.5">
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>

      {label && (
        <span className="mt-2 text-xs font-semibold text-[#5C554D] tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
