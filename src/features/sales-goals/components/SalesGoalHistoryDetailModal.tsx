import { Target, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import type { TeamSalesGoalHistory } from '@/features/sales-goals/types/sales-goal.types'
import {
  formatSalesCurrency,
  SALES_GOAL_COPY,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type SalesGoalHistoryDetailModalProps = {
  open: boolean
  entry: TeamSalesGoalHistory | null
  onClose: () => void
}

function formatClosedDate(entry: TeamSalesGoalHistory): string {
  const timestamp = entry.closedAt ?? entry.createdAt

  if (!timestamp?.toDate) {
    if (entry.id.startsWith('recognition_')) {
      return 'Reconstruido desde reconocimientos'
    }

    if (entry.id.startsWith('reports_')) {
      return 'Reconstruido desde ventas'
    }

    return 'Periodo cerrado'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function outcomeLabel(entry: TeamSalesGoalHistory): string {
  if (entry.targetAmount <= 0) {
    return SALES_GOAL_COPY.historyNoOfficialGoal
  }

  return entry.outcome === 'achieved'
    ? SALES_GOAL_COPY.historyAchieved
    : SALES_GOAL_COPY.historyMissed
}

export function SalesGoalHistoryDetailModal({
  open,
  entry,
  onClose,
}: SalesGoalHistoryDetailModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !entry) {
    return null
  }

  const achieved = entry.targetAmount > 0 && entry.outcome === 'achieved'
  const missed = entry.targetAmount > 0 && entry.outcome === 'missed'
  const periodKind = entry.periodType === 'monthly' ? 'Mensual' : 'Semanal'
  const progressPercentage =
    entry.targetAmount > 0
      ? Math.min(Math.round((entry.finalAmount / entry.targetAmount) * 100), 999)
      : null
  const sellersWithSales = entry.memberBreakdown.filter((member) => member.validatedAmount > 0)
  const topSeller = entry.memberBreakdown[0] ?? null
  const maxAmount = Math.max(...entry.memberBreakdown.map((member) => member.validatedAmount), 1)

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Cerrar detalle del periodo"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-goal-history-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold-light" aria-hidden="true" />
              <h2
                id="sales-goal-history-detail-title"
                className="text-lg font-semibold text-hero-text sm:text-xl"
              >
                {SALES_GOAL_COPY.historyDetailTitle}
              </h2>
            </div>
            <p className="mt-1 text-sm text-hero-text/70">
              {periodKind} · {entry.periodLabel}
            </p>
            <p className="mt-0.5 text-xs text-hero-text/50">{formatClosedDate(entry)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                achieved
                  ? 'bg-teal-accent/15 text-teal-accent'
                  : missed
                    ? 'bg-gold/15 text-gold-light'
                    : 'bg-white/10 text-hero-text/70',
              )}
            >
              {outcomeLabel(entry)}
            </span>
            {progressPercentage !== null ? (
              <span className="text-xs text-hero-text/60">{progressPercentage}% de la meta</span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Meta"
              value={
                entry.targetAmount > 0
                  ? formatSalesCurrency(entry.targetAmount, entry.currency)
                  : '—'
              }
            />
            <MetricCard
              label="Alcanzado"
              value={formatSalesCurrency(entry.finalAmount, entry.currency)}
              accent="text-gold-light"
            />
            <MetricCard
              label="Vendedores"
              value={String(entry.memberBreakdown.length)}
            />
            <MetricCard
              label="Con ventas"
              value={String(sellersWithSales.length)}
              accent="text-teal-accent"
            />
          </div>

          {entry.targetAmount > 0 ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-hero-text/60">
                <span>Avance del objetivo</span>
                <span>
                  {formatSalesCurrency(entry.finalAmount, entry.currency)} /{' '}
                  {formatSalesCurrency(entry.targetAmount, entry.currency)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    achieved ? 'bg-teal-accent' : 'bg-gold',
                  )}
                  style={{
                    width: `${Math.min(
                      Math.round((entry.finalAmount / Math.max(entry.targetAmount, 1)) * 100),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {topSeller && topSeller.validatedAmount > 0 ? (
            <p className="mt-4 rounded-xl border border-gold/20 bg-gold/8 px-4 py-3 text-sm text-hero-text/80">
              Mayor aporte:{' '}
              <span className="font-semibold text-gold-light">{topSeller.memberName}</span>
              {' · '}
              {formatSalesCurrency(topSeller.validatedAmount, entry.currency)}
            </p>
          ) : null}

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-hero-text">
              {SALES_GOAL_COPY.historyDetailSellersTitle}
            </h3>
            <p className="mt-1 text-xs text-hero-text/55">
              Ventas validadas de cada persona en este periodo.
            </p>

            {entry.memberBreakdown.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-hero-text/65">
                Sin ventas validadas en este periodo.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {entry.memberBreakdown.map((member, index) => {
                  const share =
                    entry.finalAmount > 0
                      ? Math.round((member.validatedAmount / entry.finalAmount) * 100)
                      : 0
                  const barWidth = Math.round((member.validatedAmount / maxAmount) * 100)

                  return (
                    <li
                      key={`${entry.id}_${member.memberUid}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-hero-text/70">
                              {index + 1}
                            </span>
                            <p className="truncate text-sm font-medium text-hero-text">
                              {member.memberName}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-hero-text/55">
                            {member.validatedCount} venta
                            {member.validatedCount === 1 ? '' : 's'} validada
                            {member.validatedCount === 1 ? '' : 's'}
                            {member.reportedCount > member.validatedCount
                              ? ` · ${member.reportedCount} reportadas`
                              : ''}
                            {entry.finalAmount > 0 ? ` · ${share}% del total` : ''}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-gold-light">
                          {formatSalesCurrency(member.validatedAmount, entry.currency)}
                        </p>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-teal-accent/80"
                          style={{ width: `${Math.max(barWidth, member.validatedAmount > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-white/10 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function MetricCard({
  label,
  value,
  accent = 'text-hero-text',
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold tabular-nums sm:text-base', accent)}>{value}</p>
    </div>
  )
}
