import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <span className="w-3.5 h-3.5 rounded-full border border-[var(--text3)] text-[var(--text3)] text-[9px] font-bold flex items-center justify-center cursor-default select-none">?</span>
      <span className="pointer-events-none absolute top-full left-0 mt-1.5 w-56 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text2)] text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
        {text}
      </span>
    </span>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  tooltip?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, tooltip, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)] flex items-center">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
            {tooltip && <Tooltip text={tooltip} />}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            error ? 'border-[var(--red)] focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.12)]' : '',
            className,
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  tooltip?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, tooltip, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)] flex items-center">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
            {tooltip && <Tooltip text={tooltip} />}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            error ? 'border-[var(--red)]' : '',
            className,
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  tooltip?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, tooltip, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)] flex items-center">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
            {tooltip && <Tooltip text={tooltip} />}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
