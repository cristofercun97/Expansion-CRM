import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import type { AgendaCalendarView } from '@/features/agenda/utils/agendaScheduleUtils'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: Array<{ id: AgendaCalendarView; label: string }> = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'list', label: 'Lista' },
]

export type AgendaToolbarProps = {
  rangeLabel: string
  effectiveViewMode: AgendaCalendarView
  viewMode: AgendaCalendarView
  isTeamScope: boolean
  onChangeView: (mode: AgendaCalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onCreate: () => void
  className?: string
}

export function AgendaToolbar({
  rangeLabel,
  effectiveViewMode,
  viewMode,
  isTeamScope,
  onChangeView,
  onPrev,
  onNext,
  onToday,
  onCreate,
  className,
}: AgendaToolbarProps) {
  const options = VIEW_OPTIONS.filter((item) => !(isTeamScope && item.id === 'list'))

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-white/12 bg-petrol-deep/60 p-1">
            <button
              type="button"
              aria-label="Anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-hero-text/80 hover:bg-white/8"
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg px-3 text-sm font-semibold text-gold-light hover:bg-gold/10"
              onClick={onToday}
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-hero-text/80 hover:bg-white/8"
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="min-w-0 truncate text-sm font-semibold capitalize text-hero-text sm:text-base">
            {rangeLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
          <div
            role="tablist"
            aria-label="Vista de agenda"
            className="inline-flex w-full overflow-x-auto rounded-xl border border-white/12 bg-petrol-deep/50 p-1 sm:w-auto"
          >
            {options.map((item) => {
              const active = viewMode === item.id || effectiveViewMode === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeView(item.id)}
                  className={cn(
                    'min-h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-teal-accent/20 text-teal-accent shadow-sm'
                      : 'text-hero-text/65 hover:bg-white/5 hover:text-hero-text',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <Button
            type="button"
            onClick={onCreate}
            className="min-h-10 shrink-0 bg-gold text-petrol-deep hover:bg-gold-light"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva reunión
          </Button>
        </div>
      </div>
    </div>
  )
}
