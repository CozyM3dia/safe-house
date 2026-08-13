import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef(({ className, glow, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-all duration-300',
      'hover:border-white/14 hover:bg-white/[0.04]',
      glow === 'safe' && 'hover:shadow-glow-safe',
      glow === 'danger' && 'hover:shadow-glow-danger',
      glow === 'accent' && 'hover:shadow-glow',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between mb-3', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-[10px] font-semibold tracking-[0.18em] text-text-muted uppercase',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardBody = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardBody.displayName = 'CardBody';
