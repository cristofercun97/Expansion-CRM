import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import { authInputClassName, authLabelClassName } from '@/features/auth/components/AuthCard'
import { cn } from '@/lib/utils'

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  helperText?: string
  error?: string
}

export function PasswordInput({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className={cn('text-sm font-medium', authLabelClassName)}>
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(
            authInputClassName,
            'w-full rounded-lg border px-3 pr-11 text-sm backdrop-blur-sm',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
              : 'hover:border-white/35',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-hero-text/60 transition-colors hover:text-teal-accent"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-300">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-hero-text/55">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
