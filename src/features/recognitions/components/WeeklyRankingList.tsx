import type { WeeklyRankingEntry } from '@/features/recognitions/types/recognition-ranking.types'
import { buildSalesRecognitionSummary } from '@/features/recognitions/utils/recognitionScoring'
import { cn } from '@/lib/utils'

type WeeklyRankingListProps = {
  entries: WeeklyRankingEntry[]
}

function BreakdownChip({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        accent,
      )}
    >
      <span className="text-hero-text/55">{label}</span>
      <span>{value}</span>
    </span>
  )
}

export function WeeklyRankingList({ entries }: WeeklyRankingListProps) {
  return (
    <section aria-label="Ranking semanal">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-hero-text">Ranking semanal</h2>
        <p className="mt-1 text-sm text-hero-text/65">
          Puntos por Academia, Plan de Acción, seguimiento e impacto comercial validado.
        </p>
        <p className="mt-1 text-xs text-hero-text/50">
          El impacto comercial solo cuenta cuando el líder valida la venta.
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const salesSummary = buildSalesRecognitionSummary(entry.breakdown)

          return (
          <article
            key={entry.memberUid}
            className={cn(
              'rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-xl',
              entry.rank <= 3 && 'border-gold/20 bg-gradient-to-r from-gold/8 to-transparent',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold',
                    entry.rank === 1
                      ? 'border-gold/30 bg-gold/15 text-gold-light'
                      : 'border-white/15 bg-white/10 text-hero-text',
                  )}
                >
                  #{entry.rank}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-hero-text">{entry.memberName}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-hero-text/60">
                    {entry.activitySummary}
                  </p>
                  {salesSummary ? (
                    <p className="mt-1 text-xs leading-relaxed text-teal-accent/90">
                      {salesSummary}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-hero-text">{entry.breakdown.total}</p>
                <p className="text-xs text-hero-text/50">puntos</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <BreakdownChip
                label="Academia"
                value={entry.breakdown.academyPoints}
                accent="border-teal-accent/25 bg-teal-accent/10 text-teal-accent"
              />
              <BreakdownChip
                label="Acción"
                value={entry.breakdown.taskPoints}
                accent="border-gold/20 bg-gold/10 text-gold-light"
              />
              <BreakdownChip
                label="Recordatorios"
                value={entry.breakdown.reminderPoints}
                accent="border-white/15 bg-white/5 text-hero-text/75"
              />
              <BreakdownChip
                label="Bonus"
                value={entry.breakdown.bonusPoints}
                accent="border-white/15 bg-white/5 text-hero-text/75"
              />
              {entry.breakdown.salesPoints > 0 ? (
                <BreakdownChip
                  label="Impacto comercial"
                  value={entry.breakdown.salesPoints}
                  accent="border-teal-accent/25 bg-teal-accent/10 text-teal-accent"
                />
              ) : null}
            </div>
          </article>
          )
        })}
      </div>
    </section>
  )
}
