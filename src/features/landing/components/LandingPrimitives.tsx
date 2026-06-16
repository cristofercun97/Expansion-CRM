import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function GoldText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-gold-light', className)}>{children}</span>
}

type LandingSectionProps = {
  id?: string
  children: ReactNode
  className?: string
  dark?: boolean
}

export function LandingSection({ id, children, className, dark = false }: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'px-6 py-16 md:py-24',
        dark ? 'bg-hero-bg text-hero-text' : 'bg-landing-bg text-landing-text',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  subtitle?: string
  align?: 'left' | 'center'
  light?: boolean
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-12 max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <p
          className={cn(
            'mb-3 text-xs font-semibold uppercase tracking-widest',
            light ? 'text-teal-accent' : 'text-teal-accent',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-3xl font-semibold tracking-tight md:text-4xl',
          light ? 'text-hero-text' : 'text-landing-text',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed md:text-lg',
            light ? 'text-hero-text/75' : 'text-landing-text/70',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
