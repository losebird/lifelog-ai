import React from 'react';

type GradientDirection = 
  | 'top-left-to-bottom-right'
  | 'top-to-bottom'
  | 'left-to-right'
  | 'top-right-to-bottom-left';

interface ActivityRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0-100+
  colorStops: { offset: string; color: string }[];
  backgroundColor?: string;
  gradientDirection?: GradientDirection;
}

const getGradientCoords = (direction: GradientDirection) => {
    switch (direction) {
        case 'top-to-bottom':
            return { x1: '50%', y1: '0%', x2: '50%', y2: '100%' };
        case 'left-to-right':
            return { x1: '0%', y1: '50%', x2: '100%', y2: '50%' };
        case 'top-right-to-bottom-left':
            return { x1: '100%', y1: '0%', x2: '0%', y2: '100%' };
        case 'top-left-to-bottom-right':
        default:
            return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
    }
};

const ActivityRing: React.FC<ActivityRingProps> = ({
  size,
  strokeWidth,
  progress,
  colorStops,
  backgroundColor = '#EAE5E3', // Default to a light gray (base-300)
  gradientDirection = 'top-left-to-bottom-right',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, progress);
  // Ensure we don't fully close the circle to show the rounded cap
  const progressValue = clampedProgress >= 100 ? 99.99 : clampedProgress; 
  const offset = circumference - (progressValue / 100) * circumference;

  const gradientId = `gradient-${colorStops.map(s => s.color).join('-').replace(/#/g, '')}`;
  
  const { x1, y1, x2, y2 } = getGradientCoords(gradientDirection);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
          {colorStops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
    </svg>
  );
};

export default ActivityRing;
