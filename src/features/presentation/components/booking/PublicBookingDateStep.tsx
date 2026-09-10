import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildMonthCells,
  formatMonthTitle,
  shiftMonth,
} from '@/features/presentation/utils/publicBookingUiUtils'

type Props = {
  year: number
  month: number
  dates: Record<string, string[]>
  selectedDate: string
  loading: boolean
  empty: boolean
  onMonthChange: (year: number, month: number) => void
  onSelectDate: (dateKey: string) => void
  onBack: () => void
  onContinue: () => void
}

export function PublicBookingDateStep({
  year,
  month,
  dates,
  selectedDate,
  loading,
  empty,
  onMonthChange,
  onSelectDate,
  onBack,
  onContinue,
}: Props) {
  const cells = buildMonthCells(year, month, dates)
  const title = formatMonthTitle(year, month)

  return (
    <section data-testid="booking-step-2" aria-labelledby="booking-step2-title">
      <h2 id="booking-step2-title" className="pb-title">
        Elige una fecha
      </h2>

      {loading ? (
        <div className="pb-skeleton" aria-busy="true" aria-label="Cargando disponibilidad">
          <div className="pb-skel-line" />
          <div className="pb-skel-line" />
          <div className="pb-skel-line" />
        </div>
      ) : empty ? (
        <p className="pb-empty">No hay fechas disponibles en este período.</p>
      ) : (
        <>
          <div className="pb-cal-head">
            <button
              type="button"
              className="pb-icon-btn"
              aria-label="Mes anterior"
              onClick={() => {
                const next = shiftMonth(year, month, -1)
                onMonthChange(next.year, next.month)
              }}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <h3 className="pb-cal-title">{title}</h3>
            <button
              type="button"
              className="pb-icon-btn"
              aria-label="Mes siguiente"
              onClick={() => {
                const next = shiftMonth(year, month, 1)
                onMonthChange(next.year, next.month)
              }}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="pb-weekdays" aria-hidden="true">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="pb-days" role="grid" aria-label={`Calendario ${title}`}>
            {cells.map((cell, index) => {
              if (!cell.inMonth || !cell.dateKey) {
                return <span key={`pad-${index}`} className="pb-day" data-muted="true" />
              }
              const selected = selectedDate === cell.dateKey
              const state = selected
                ? 'selected'
                : cell.past
                  ? 'past'
                  : cell.available
                    ? 'available'
                    : 'unavailable'
              const disabled = !cell.available
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className="pb-day"
                  data-state={state}
                  data-today={cell.isToday ? 'true' : 'false'}
                  data-testid={`booking-day-${cell.dateKey}`}
                  aria-label={cell.dateKey}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) onSelectDate(cell.dateKey!)
                  }}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="pb-actions">
        <button type="button" className="pb-btn pb-btn-secondary" onClick={onBack}>
          Atrás
        </button>
        <button
          type="button"
          className="pb-btn pb-btn-primary pb-btn-grow pb-btn-block"
          disabled={!selectedDate}
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    </section>
  )
}
