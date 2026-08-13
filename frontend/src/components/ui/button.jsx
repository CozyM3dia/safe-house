import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-bg hover:bg-accent-hover hover:shadow-glow active:scale-[0.98]',
        accent:
          'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 hover:border-accent/50 hover:shadow-glow active:scale-[0.98]',
        secondary:
          'bg-white/8 text-text-primary border border-white/12 hover:bg-white/12 hover:border-white/20',
        ghost:
          'text-text-secondary hover:bg-white/8 hover:text-text-primary',
        danger:
          'bg-risk-danger/15 text-risk-danger border border-risk-danger/30 hover:bg-risk-danger/25',
        outline:
          'border border-white/12 bg-transparent text-text-primary hover:bg-white/6 hover:border-white/20',
        icon:
          'bg-white/6 text-text-secondary border border-white/10 hover:bg-white/12 hover:text-text-primary',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

import { Slot } from '@radix-ui/react-slot';

export const Button = forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
);
Button.displayName = 'Button';
