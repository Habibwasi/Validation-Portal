import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)]">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
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
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)]">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
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
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text)]">
            {label}
            {props.required && <span className="text-[var(--red)] ml-1">*</span>}
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
