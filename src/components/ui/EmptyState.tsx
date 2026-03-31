import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="text-4xl mb-4 opacity-40">{icon}</div>
      <p className="font-semibold text-[var(--text)] mb-1">{title}</p>
      {description && <p className="text-[12px] text-[var(--text3)] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-lg bg-[var(--surface2)] animate-pulse', className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-2xl p-5">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

export function SkeletonAnalysis() {
  return (
    <div className="space-y-4">
      {/* Verdict card skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 border-l-4">
        <div className="flex gap-3 mb-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      {/* Themes */}
      {[1, 2].map((k) => (
        <div key={k} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full mb-1.5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
