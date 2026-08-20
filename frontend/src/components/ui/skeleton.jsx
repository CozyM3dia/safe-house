import { cn } from '../../lib/utils';

export function Skeleton({ as: Component = 'div', className, ...props }) {
  return (
    <Component
      aria-hidden="true"
      className={cn('shimmer rounded-md', className)}
      {...props}
    />
  );
}

const TEXT_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3', 'w-5/6'];

/**
 * Layout-aware text placeholder. The varying line lengths keep loading states
 * from looking like a generic block while preserving the shape of real copy.
 */
export function SkeletonText({ lines = 3, className, lineClassName }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-2.5', TEXT_WIDTHS[index % TEXT_WIDTHS.length], lineClassName)}
        />
      ))}
    </div>
  );
}

/** Compact repeated rows for search results, lists, and other network data. */
export function SkeletonRows({ count = 4, className }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border border-white/6 px-3 py-2.5">
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className={cn('h-2.5', index % 2 === 0 ? 'w-4/5' : 'w-3/5')} />
            <Skeleton className="h-2 w-2/5" />
          </div>
          <Skeleton className="h-2 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
