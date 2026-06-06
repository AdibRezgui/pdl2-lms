'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'gradient';
  animated?: boolean;
  className?: string;
}

const colors = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500',
};

const heights = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  value,
  label,
  showValue = false,
  size = 'md',
  color = 'gradient',
  animated = true,
  className,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-white">{value}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-white/5 overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full',
            colors[color],
            animated && 'transition-all duration-1000 ease-out'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
