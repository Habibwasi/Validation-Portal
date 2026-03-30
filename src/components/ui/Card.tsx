import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  accent?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red';
}

const accentColors = {
  blue:   'linear-gradient(90deg, var(--accent), var(--accent2))',
  green:  'linear-gradient(90deg, var(--green), #34d399)',
  yellow: 'linear-gradient(90deg, var(--yellow), #fbbf24)',
  purple: 'linear-gradient(90deg, var(--accent3), #a78bfa)',
  orange: 'linear-gradient(90deg, var(--orange), #fb923c)',
  red:    'linear-gradient(90deg, var(--red), #f87171)',
};

export function Card({ className, style, children, accent }: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-2xl p-5 shadow-[0_18px_40px_rgba(0,0,0,.28)] overflow-hidden',
        className,
      )}
      style={style}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: accentColors[accent] }}
        />
      )}
      {children}
    </div>
  );
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={cn('font-bold text-[13px] text-[var(--text)] mb-4 flex items-center gap-2 flex-wrap', className)}>
      {children}
    </h3>
  );
}
