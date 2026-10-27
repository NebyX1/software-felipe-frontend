import { useId } from 'react';

type SemicircleGaugeProps = {
  value?: number;
  percent?: number;
  min?: number;
  max?: number;
  label?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const describeArc = (radius: number) => `M ${50 - radius} 50 A ${radius} ${radius} 0 0 1 ${50 + radius} 50`;

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

export default function SemicircleGauge({
  value,
  percent,
  min = 0,
  max = 100,
  label,
  size = 240,
  strokeWidth = 10,
  color = '#4ade80',
  backgroundColor = 'rgba(148, 163, 184, 0.22)',
}: SemicircleGaugeProps) {
  const gradientId = useId();
  const resolvedValue = percent != null
    ? min + ((max - min) * clamp(percent, 0, 100)) / 100
    : clamp(value ?? min, min, max);
  const range = Math.max(max - min, 1);
  const normalized = clamp((resolvedValue - min) / range, 0, 1);
  const percentage = Math.round(normalized * 100);
  const radius = 36;
  const arcPath = describeArc(radius);
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - normalized);
  const endPoint = polarToCartesian(50, 50, radius, normalized * 180);
  const valueText = Number.isInteger(resolvedValue) ? resolvedValue.toFixed(0) : resolvedValue.toFixed(1);

  return (
    <div style={{ width: typeof size === 'number' ? `${size}px` : size, maxWidth: '100%' }}>
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(148,163,184,0.04))',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '18px 18px 14px',
          boxSizing: 'border-box',
        }}
      >
        {label ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            {label}
          </div>
        ) : null}

        <svg viewBox="0 0 100 64" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-label={label ? `${label}: ${percentage}%` : `${percentage}%`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.72" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          <path d={arcPath} fill="none" stroke={backgroundColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={arcLength}
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
          />

          <circle cx={endPoint.x} cy={endPoint.y} r={strokeWidth * 0.5} fill={color} opacity={0.95} />
          <circle cx={50} cy={50} r={strokeWidth * 0.42} fill={color} opacity={0.18} />

          <text x="50" y="39" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">
            {percentage}%
          </text>
          <text x="50" y="49" textAnchor="middle" fill="var(--text-muted)" fontSize="6.2">
            {valueText} / {max}
          </text>
          <text x={14} y="56" textAnchor="middle" fill="var(--text-muted)" fontSize="5.5">
            {min}
          </text>
          <text x={86} y="56" textAnchor="middle" fill="var(--text-muted)" fontSize="5.5">
            {max}
          </text>
        </svg>
      </div>
    </div>
  );
}