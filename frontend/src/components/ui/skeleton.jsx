import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('shimmer rounded-md', className)}
      {...props}
    />
  );
}
