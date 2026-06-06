'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, glow = false, gradient = false, padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-300',
          'bg-white/[0.03] border-white/[0.08]',
          hover && 'hover:bg-white/[0.06] hover:border-white/[0.15] cursor-pointer hover:-translate-y-1',
          glow && 'hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
          gradient && 'bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
