import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]',
  {
    variants: {
      variant: {
        default:  'bg-white/8 text-text-secondary border border-white/10',
        safe:     'bg-risk-safe/15 text-risk-safe border border-risk-safe/30',
        moderate: 'bg-risk-moderate/15 text-risk-moderate border border-risk-moderate/30',
        danger:   'bg-risk-danger/15 text-risk-danger border border-risk-danger/30',
        accent:   'bg-accent/15 text-accent border border-accent/30',
        live:     'bg-risk-safe/15 text-risk-safe border border-risk-safe/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const Badge = forwardRef(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
));
Badge.displayName = 'Badge';
