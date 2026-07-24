import { CircleHelp, Compass, Map, Target } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export type ActionPlanSectionId = 'plan-ventas' | 'plan-mapa' | 'plan-tareas'

export type ActionPlanFocusAction = {
  eyebrow: string
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
  targetId: ActionPlanSectionId
}

type ActionPlanFocusBarProps = {
  focus: ActionPlanFocusAction
  activeSection: ActionPlanSectionId
  onSectionChange: (sectionId: ActionPlanSectionId) => void
  onOpenHelp: () => void
  className?: string
}

const NAV_ITEMS = [
  { id: 'plan-ventas' as const, label: 'Ventas', icon: Target },
  { id: 'plan-mapa' as const, label: 'Mapa', icon: Map },
  { id: 'plan-tareas' as const, label: 'Tareas', icon: Compass },
]

export function ActionPlanFocusBar({
  focus,
  activeSection,
  onSectionChange,
  onOpenHelp,
  className,
}: ActionPlanFocusBarProps) {
  return (
    <section
      className={cn(
        'sticky top-0 z-20 -mx-4 space-y-3 border-b border-white/10 bg-petrol-deep/95 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8',
        className,
      )}
      aria-label="Navegación del plan"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap gap-2" aria-label="Secciones del plan" role="tablist">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-gold/40 bg-gold text-petrol-deep shadow-sm'
                    : 'border-white/15 bg-white/5 text-hero-text/75 hover:bg-white/10 hover:text-hero-text',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-teal-accent/30 bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/15"
          onClick={onOpenHelp}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
          Necesito ayuda
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/8 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/80">
            {focus.eyebrow}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-hero-text">{focus.title}</p>
          <p className="mt-0.5 text-xs text-hero-text/65">{focus.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {focus.targetId !== activeSection ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-white/20 bg-transparent text-hero-text hover:bg-white/10"
              onClick={() => onSectionChange(focus.targetId)}
            >
              Ver sugerido
            </Button>
          ) : null}
          {focus.ctaLabel && focus.onCta ? (
            <Button
              type="button"
              size="sm"
              className="h-8 bg-gold text-petrol-deep hover:bg-gold-light"
              onClick={() => {
                onSectionChange(focus.targetId)
                focus.onCta?.()
              }}
            >
              {focus.ctaLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
