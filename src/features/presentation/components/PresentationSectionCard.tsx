import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PresentationSectionCardProps = {
  title: string
  description?: string
  emoji?: string
  badge?: string
  guide?: string
  children: ReactNode
  className?: string
}

export function PresentationSectionCard({
  title,
  description,
  emoji,
  badge,
  guide,
  children,
  className,
}: PresentationSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        className,
      )}
    >
      <div className="mb-6 space-y-3">
        {emoji || badge ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gradient-to-r from-gold/20 to-teal/10 px-3 py-1 text-xs font-semibold text-petrol-deep shadow-sm">
              {emoji ? <span aria-hidden="true">{emoji}</span> : null}
              {badge ?? title}
            </span>
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold text-text-dark">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-text-soft">{description}</p>
          ) : null}
        </div>

        {guide ? (
          <p className="rounded-xl border border-dashed border-teal/25 bg-gradient-to-br from-teal/5 to-gold/5 px-4 py-3 text-sm leading-relaxed text-text-soft">
            <span aria-hidden="true" className="mr-1.5">
              💡
            </span>
            {guide}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
