import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
  error?: string
  labelClassName?: string
}

export function Input({
  className,
  label,
  helperText,
  error,
  labelClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className={cn('text-sm font-medium', labelClassName ?? 'text-text-dark')}
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-text-dark',
          'placeholder:text-text-soft/70',
          'transition-colors duration-200',
          'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
            : 'border-petrol-dark/15 hover:border-petrol-dark/25',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-text-soft">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
