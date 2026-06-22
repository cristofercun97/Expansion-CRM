import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SettingsSectionCardProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsSectionCard({
  title,
  description,
  children,
  className,
}: SettingsSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gold/20 bg-gradient-to-br from-white/8 via-white/5 to-teal-accent/5 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-hero-text">{title}</h2>
        {description ? <p className="text-sm text-hero-text/65">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
