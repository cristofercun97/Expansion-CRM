import { Award, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { PrizeIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type { DashboardPrizesOverview } from '@/features/dashboard/types/dashboard-overview.types'

type DashboardMonthlyPrizesCardProps = {
  prizes: DashboardPrizesOverview
  loading?: boolean
}

export function DashboardMonthlyPrizesCard({ prizes, loading = false }: DashboardMonthlyPrizesCardProps) {
  return (
    <DashboardOverviewCard
      title="Premios del mes"
      subtitle="Reconocer el avance también construye cultura."
      loading={loading}
      illustration={<PrizeIllustration size="header" />}
      compact={!loading && !prizes.isConfigured}
    >
      {!loading && !prizes.isConfigured ? (
        <DashboardEmptyState
          minimal
          title="Premios no configurados todavía"
          description="Configura incentivos para activar la motivación del equipo."
          action={
            <Link to="/dashboard/reconocimientos">
              <Button size="sm" variant="secondary" className="border-white/15 bg-white/8 text-hero-text">
                Ver reconocimientos
              </Button>
            </Link>
          }
        />
      ) : null}

      {!loading && prizes.isConfigured ? (
        <div className="space-y-3">
          {prizes.mvpPrize ? (
            <div className="rounded-xl border border-gold/35 bg-gradient-to-br from-gold/20 via-gold/10 to-teal-accent/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 h-6 w-6 shrink-0 text-gold-light" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-light">
                    Premio principal del mes
                  </p>
                  <p className="mt-1 text-base font-semibold text-hero-text">{prizes.mvpPrize}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-hero-text/65">
                    Para quien sostenga constancia, avance y compromiso.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {[
              { label: 'Segundo premio', value: prizes.secondPrize },
              { label: 'Tercer premio', value: prizes.thirdPrize },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:px-3.5"
                >
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-hero-text/55">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-hero-text">{item.value}</p>
                  </div>
                </li>
              ))}
          </ul>

          {prizes.currentMvpCandidate ? (
            <div className="rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 text-sm">
              <p className="text-gold-light">
                Candidato MVP actual:{' '}
                <span className="font-semibold">{prizes.currentMvpCandidate}</span>
              </p>
              <p className="mt-1 text-xs text-hero-text/65">
                Va liderando la carrera, pero el mes sigue abierto.
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-hero-text/65">
              La carrera del mes está abierta.
            </p>
          )}

          {prizes.prizePeriod ? (
            <p className="text-xs text-hero-text/55">Periodo: {prizes.prizePeriod}</p>
          ) : null}

          <Link to="/dashboard/reconocimientos">
            <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
              Ver reconocimientos
            </Button>
          </Link>
        </div>
      ) : null}
    </DashboardOverviewCard>
  )
}
