import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ className, padding = 'md', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-petrol-dark/10 bg-white shadow-[var(--shadow-card)]',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  )
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-text-dark', className)} {...props}>
      {children}
    </h3>
  )
}

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-text-soft', className)} {...props}>
      {children}
    </p>
  )
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
