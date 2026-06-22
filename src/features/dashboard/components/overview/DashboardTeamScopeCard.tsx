import { Building2, Star, Target, TrendingUp, Users, UsersRound, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { TeamPathIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type {
  DashboardCommercialGoalOverview,
  DashboardOwnedTeamOverview,
  DashboardTeamOverview,
  DashboardViewScope,
} from '@/features/dashboard/types/dashboard-overview.types'
import { formatDashboardCurrency } from '@/features/dashboard/utils/dashboardOverviewFormatters'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type DashboardTeamScopeCardProps = {
  viewScope: DashboardViewScope
  homeTeam: DashboardTeamOverview | null
  ownedTeam: DashboardOwnedTeamOverview | null
  commercialGoal: DashboardCommercialGoalOverview
  hasActiveOwnedOrganization: boolean
  loading?: boolean
}

export function DashboardTeamScopeCard({
  viewScope,
  homeTeam,
  ownedTeam,
  commercialGoal,
  hasActiveOwnedOrganization,
  loading = false,
}: DashboardTeamScopeCardProps) {
  return (
    <DashboardOverviewCard
      title="Tu contexto de equipo"
      subtitle={
        viewScope === 'owned_team'
          ? 'Visión de la organización que estás construyendo.'
          : 'Tu lugar dentro del grupo donde participas.'
      }
      loading={loading}
      illustration={<TeamPathIllustration size="header" />}
    >
      {!loading && viewScope === 'home_team' ? (
        homeTeam ? (
          <div className="space-y-3">
            <p className="text-sm text-hero-text/70">Tu lugar dentro del grupo activo.</p>
            <div className="flex flex-wrap gap-2">
              <ScopeChip icon={Users} label="Grupo" value={homeTeam.teamName} accent="teal" />
              <ScopeChip
                icon={UsersRound}
                label="Miembros"
                value={
                  homeTeam.totalMembers !== null ? String(homeTeam.totalMembers) : 'Sin datos todavía'
                }
              />
              <ScopeChip
                icon={TrendingUp}
                label="Mi posición"
                value={homeTeam.myRank !== null ? `#${homeTeam.myRank}` : '—'}
              />
              <ScopeChip
                icon={Star}
                label="Mis puntos"
                value={homeTeam.myPoints !== null ? `${homeTeam.myPoints} pts` : '—'}
                accent="gold"
              />
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            minimal
            title="Sin grupo asignado"
            description="Cuando te unas a un grupo, verás aquí tu contexto y posición."
          />
        )
      ) : null}

      {!loading && viewScope === 'owned_team' ? (
        hasActiveOwnedOrganization && ownedTeam ? (
          <div className="space-y-3">
            <p className="text-sm text-hero-text/75">Tu equipo está tomando forma.</p>
            <div className="flex flex-wrap gap-2">
              <ScopeChip
                icon={Building2}
                label="Organización"
                value={ownedTeam.teamName}
                accent="gold"
                wide
              />
              <ScopeChip
                icon={UsersRound}
                label="Miembros directos"
                value={formatMetricCount(ownedTeam.directMembers)}
              />
              <ScopeChip
                icon={Users}
                label="Líderes activos"
                value={formatMetricCount(ownedTeam.directLeaders)}
                accent="teal"
              />
              <ScopeChip
                icon={UsersRound}
                label="Miembros activos"
                value={formatMetricCount(ownedTeam.activeMembers)}
              />
              <ScopeChip
                icon={TrendingUp}
                label="Ventas validadas"
                value={formatDashboardCurrency(ownedTeam.validatedSalesAmount)}
              />
              <ScopeChip
                icon={Target}
                label="Objetivo actual"
                value={
                  commercialGoal.goalAmount !== null
                    ? formatDashboardCurrency(commercialGoal.goalAmount)
                    : 'Sin objetivo'
                }
              />
              <ScopeChip
                icon={Wallet}
                label="Recompensas generadas"
                value={formatDashboardCurrency(ownedTeam.generatedRewardsAmount)}
                accent="gold"
                wide
              />
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            minimal
            title="Aún no tienes una organización activa"
            description="Activa tu organización para liderar tu propio equipo y ver métricas de crecimiento."
            action={
              <Link to="/dashboard/mi-grupo">
                <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
                  Activar mi organización
                </Button>
              </Link>
            }
          />
        )
      ) : null}
    </DashboardOverviewCard>
  )
}

function formatMetricCount(value: number): string {
  return value > 0 ? String(value) : '—'
}

function ScopeChip({
  icon: Icon,
  label,
  value,
  accent = 'neutral',
  wide = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent?: 'teal' | 'gold' | 'neutral'
  wide?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-[calc(50%-0.25rem)] flex-1 rounded-xl border px-3 py-2.5 sm:min-w-[140px] sm:py-3',
        wide && 'sm:min-w-[calc(50%-0.25rem)]',
        accent === 'teal' && 'border-teal-accent/20 bg-teal-accent/8',
        accent === 'gold' && 'border-gold/20 bg-gold/8',
        accent === 'neutral' && 'border-white/10 bg-white/5',
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-hero-text/50" aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-wide text-hero-text/55 sm:text-[11px]">{label}</p>
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-hero-text">{value}</p>
    </div>
  )
}
