import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const fieldLabelClassName = 'text-sm font-medium text-hero-text/85'
const fieldInputClassName =
  'h-11 w-full rounded-xl border border-white/12 bg-petrol-deep/50 px-3.5 text-sm text-hero-text placeholder:text-hero-text/35 transition-colors focus:border-gold/35 focus:outline-none focus:ring-2 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-60'
const fieldErrorClassName = 'text-xs text-red-300'
const fieldHelperClassName = 'text-xs text-hero-text/55'

type SettingsFieldProps = {
  label: string
  error?: string
  helperText?: string
  children: ReactNode
  className?: string
}

export function SettingsField({ label, error, helperText, children, className }: SettingsFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className={fieldLabelClassName}>{label}</label>
      {children}
      {error ? <p className={fieldErrorClassName}>{error}</p> : null}
      {!error && helperText ? <p className={fieldHelperClassName}>{helperText}</p> : null}
    </div>
  )
}

type SettingsInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export function SettingsInput({ className, error, ...props }: SettingsInputProps) {
  return (
    <input
      className={cn(
        fieldInputClassName,
        error && 'border-red-400/50 focus:border-red-400/60 focus:ring-red-400/15',
        className,
      )}
      aria-invalid={Boolean(error)}
      {...props}
    />
  )
}

type SettingsSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string
}

export function SettingsSelect({ className, error, children, ...props }: SettingsSelectProps) {
  return (
    <select
      className={cn(
        fieldInputClassName,
        error && 'border-red-400/50 focus:border-red-400/60 focus:ring-red-400/15',
        className,
      )}
      aria-invalid={Boolean(error)}
      {...props}
    >
      {children}
    </select>
  )
}

export const settingsFieldStyles = {
  label: fieldLabelClassName,
  input: fieldInputClassName,
}
