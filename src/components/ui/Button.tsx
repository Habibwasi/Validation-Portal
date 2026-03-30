import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[9px] transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
const variants = {
  primary:   'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white hover:brightness-110 hover:-translate-y-px shadow-[0_6px_20px_rgba(59,130,246,.28)]',
  secondary: 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost:     'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
  danger:    'bg-[rgba(239,68,68,.12)] text-[var(--red)] border border-[rgba(239,68,68,.3)] hover:bg-[rgba(239,68,68,.2)]',
  outline:   'border border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-transparent',
};
const sizes = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2.5 text-[13px]',
  lg: 'px-6 py-3 text-[14px]',
};

export function Button({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}
