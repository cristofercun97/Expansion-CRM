import {
  DEFAULT_RADAR_PERIOD,
  RADAR_PERIOD_OPTIONS,
  type RadarPeriod,
} from '@/features/radar/utils/radarPeriodFilter'
import { cn } from '@/lib/utils'

type RadarPeriodFilterProps = {
  value: RadarPeriod
  onChange: (period: RadarPeriod) => void
}

export function RadarPeriodFilter({ value, onChange }: RadarPeriodFilterProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-5">
      <p className="mb-3 text-sm font-medium text-hero-text/80">Período</p>
      <div className="flex flex-wrap gap-2">
        {RADAR_PERIOD_OPTIONS.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-accent text-petrol-deep shadow-sm'
                  : 'border border-white/15 bg-white/5 text-hero-text/80 hover:bg-white/10 hover:text-hero-text',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export { DEFAULT_RADAR_PERIOD }
