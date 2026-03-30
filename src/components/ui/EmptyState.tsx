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
