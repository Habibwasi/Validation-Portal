import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;      // 0-100
  color?: string;    // gradient or solid CSS
  height?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, color, height = 4, className, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={cn('rounded-full overflow-hidden bg-[var(--border)]', className)}
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clamped}%`,
            background: color ?? 'linear-gradient(90deg, var(--accent), var(--accent2))',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-[var(--text2)] whitespace-nowrap flex-shrink-0 w-9 text-right">
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// Inline version (no separate label)
export function StatProgress({ value, color, className }: Pick<ProgressBarProps, 'value' | 'color' | 'className'>) {
  return (
    <div className={cn('h-1 rounded-full bg-[var(--border)] overflow-hidden mt-2', className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(100, value)}%`,
          background: color ?? 'linear-gradient(90deg, var(--accent), var(--accent2))',
        }}
      />
    </div>
  );
}
