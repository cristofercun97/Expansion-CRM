import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helperText?: string
  error?: string
}

export function Textarea({
  className,
  label,
  helperText,
  error,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-text-dark">
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-text-dark',
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
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />

      {error ? (
        <p id={`${textareaId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-xs text-text-soft">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
