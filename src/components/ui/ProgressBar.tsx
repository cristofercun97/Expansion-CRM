import { cn } from '@/lib/utils'

export type ProgressBarProps = {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), max)
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? (
            <span className="text-sm font-medium text-text-dark">{label}</span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span className="text-sm font-semibold text-teal">{percentage}%</span>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-petrol-dark/10',
          sizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full bg-linear-to-r from-teal to-gold transition-all duration-500 ease-out',
            sizeStyles[size],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
