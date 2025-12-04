// [COMPONENT] TagBadge - Badge component for tags

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TagBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export function TagBadge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        {
          'bg-muted text-muted-foreground': variant === 'default',
          'bg-primary/10 text-primary': variant === 'primary',
          'bg-blue-100 text-blue-800': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'danger',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
