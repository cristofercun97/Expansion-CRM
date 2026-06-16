import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'gold' | 'teal' | 'outline' | 'muted'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-petrol-dark text-white',
  gold: 'bg-gold/15 text-petrol-dark ring-1 ring-gold/30',
  teal: 'bg-teal/15 text-petrol-dark ring-1 ring-teal/30',
  outline: 'border border-petrol-dark/15 bg-white text-text-soft',
  muted: 'bg-petrol-dark/5 text-text-soft',
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
