import { cn } from '@/lib/utils';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const styles: Record<BadgeVariant, string> = {
  blue:    'bg-[rgba(59,130,246,.15)] text-[var(--accent)]',
  green:   'bg-[rgba(16,185,129,.15)] text-[var(--green)]',
  yellow:  'bg-[rgba(245,158,11,.15)] text-[var(--yellow)]',
  red:     'bg-[rgba(239,68,68,.15)] text-[var(--red)]',
  orange:  'bg-[rgba(249,115,22,.15)] text-[var(--orange)]',
  purple:  'bg-[rgba(139,92,246,.15)] text-[var(--accent3)]',
  neutral: 'bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)]',
};

export function Badge({ variant = 'neutral', size, className, children }: BadgeProps) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full font-semibold', size === 'lg' ? 'text-[13px] px-3 py-1' : 'text-[10px]', styles[variant], className)}>
      {children}
    </span>
  );
}
