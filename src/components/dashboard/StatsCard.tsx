'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose';
  delay?: number;
  subtitle?: string;
}

const colorMap = {
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    glow: 'shadow-indigo-500/5',
  },
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/5',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/5',
  },
  rose: {
    icon: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'shadow-rose-500/5',
  },
};

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = 'indigo',
  delay = 0,
  subtitle,
}: StatsCardProps) {
  const c = colorMap[color];
  const isPositive = change !== undefined && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden group',
        'hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300',
        `hover:shadow-lg ${c.glow}`
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-3">{title}</p>
          <div className="text-3xl font-black text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-slate-500 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          c.bg, c.border, 'border', c.icon,
          'group-hover:scale-110 transition-transform duration-300'
        )}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
