import { Bell, HelpCircle, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { QuickActionButton } from '@/features/dashboard/components/QuickActionButton'
import { DashboardViewScopeSwitch } from '@/features/dashboard/components/overview/DashboardViewScopeSwitch'
import { HeroDirectionIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type { DashboardOverviewData, DashboardViewScope } from '@/features/dashboard/types/dashboard-overview.types'
import {
  resolveHeroPrimaryAction,
  resolveHeroSecondaryAction,
} from '@/features/dashboard/utils/dashboardHeroAction.utils'
import { resolveHeroEnergyLine, resolveHeroSubtitle } from '@/features/dashboard/utils/dashboardOverviewMicrocopy'
import { resolveDashboardScope } from '@/features/dashboard/utils/dashboardScope.utils'
import { cn } from '@/lib/utils'

const HERO_MANTRA = 'El equipo avanza cuando todos saben qué hacer hoy.'

type DashboardHeroOverviewProps = {
  firstName: string
  roleLabel: string
  overview: DashboardOverviewData
  viewScope: DashboardViewScope
  onViewScopeChange: (scope: DashboardViewScope) => void
  canSelectHome: boolean
  canSelectOwned: boolean
  loading?: boolean
  isProfileLoading?: boolean
}

export function DashboardHeroOverview({
  firstName,
  roleLabel,
  overview,
  viewScope,
  onViewScopeChange,
  canSelectHome,
  canSelectOwned,
  loading = false,
  isProfileLoading = false,
}: DashboardHeroOverviewProps) {
  const navigate = useNavigate()
  const scoped = resolveDashboardScope(overview, viewScope)
  const hasActiveOrg =
    viewScope === 'owned_team' &&
    overview.userProfile.hasActiveOwnedOrganization &&
    Boolean(overview.ownedTeam ?? overview.userProfile.ownedTeamId)
  const teamLabel = scoped.teamName
  const energyLine = !loading ? resolveHeroEnergyLine({ ...overview, commercialGoal: scoped.commercialGoal }) : null
  const primaryAction = !loading ? resolveHeroPrimaryAction(scoped, overview) : null
  const secondaryAction = !loading && primaryAction ? resolveHeroSecondaryAction(scoped, primaryAction) : null

  return (
    <header className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/14 via-white/7 to-teal-accent/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6 md:p-8">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-teal-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative space-y-4">
        <DashboardViewScopeSwitch
          value={viewScope}
          onChange={onViewScopeChange}
          canSelectHome={canSelectHome}
          canSelectOwned={canSelectOwned}
          homeTeamName={overview.scopes.home_team?.teamName ?? overview.homeTeam?.teamName}
          ownedTeamName={overview.scopes.owned_team?.teamName ?? overview.ownedTeam?.teamName}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
          <div className="min-w-0 space-y-4">
            <div>
              <h1
                className={cn(
                  'text-2xl font-semibold tracking-tight text-hero-text sm:text-3xl',
                  (isProfileLoading || loading) && 'opacity-80',
                )}
              >
                Bienvenido, {firstName} 👋
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-hero-text/85 sm:text-base">
                {loading
                  ? 'Cargando resumen del grupo…'
                  : resolveHeroSubtitle({ ...overview, commercialGoal: scoped.commercialGoal }, teamLabel)}
              </p>

              {energyLine ? (
                <p className="mt-2 text-sm font-medium text-gold-light/95">{energyLine}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge
                  variant="gold"
                  className="border border-gold/30 bg-gold/15 !text-gold-light ring-gold/40"
                >
                  {roleLabel}
                </Badge>

                {hasActiveOrg ? (
                  <Badge className="border border-teal-accent/30 bg-teal-accent/10 text-teal-accent">
                    Organización activa
                  </Badge>
                ) : null}

                {teamLabel ? (
                  <Badge className="border border-white/15 bg-white/8 text-hero-text/80">
                    {teamLabel}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex max-w-full flex-wrap gap-2">
              {primaryAction ? (
                <QuickActionButton
                  label={primaryAction.label}
                  icon={primaryAction.icon}
                  onClick={() => navigate(primaryAction.href)}
                  className="shrink-0"
                />
              ) : null}

              {secondaryAction ? (
                <QuickActionButton
                  label={secondaryAction.label}
                  icon={Bell}
                  onClick={() => navigate(secondaryAction.href)}
                  className="shrink-0"
                />
              ) : null}

              <QuickActionButton
                label="Invitar"
                icon={UserPlus}
                onClick={() => navigate('/dashboard/mi-grupo')}
                className="shrink-0"
              />

              <QuickActionButton
                label="Ayuda"
                icon={HelpCircle}
                onClick={() => navigate('/dashboard/academia')}
                className="shrink-0"
              />

              <button
                type="button"
                className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-hero-text/80 transition-colors hover:bg-white/12"
                aria-label="Atención pendiente"
                onClick={() => {
                  document.getElementById('dashboard-attention')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {scoped.attentionItems.length > 0 ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
                ) : null}
              </button>
            </div>
          </div>

          {!loading ? (
            <aside
              className="hidden lg:flex lg:w-44 xl:w-48 lg:flex-col lg:items-center lg:justify-center lg:gap-3 lg:border-l lg:border-white/10 lg:pl-6 xl:pl-8"
              aria-hidden="true"
            >
              <HeroDirectionIllustration size="hero" />
              <p className="max-w-[11rem] text-center text-xs leading-relaxed text-hero-text/60 xl:text-[13px]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-accent/80">
                  Dirección del día
                </span>
                <span className="mt-2 block italic text-hero-text/70">{HERO_MANTRA}</span>
              </p>
            </aside>
          ) : null}
        </div>

        {!loading ? (
          <p className="border-t border-white/8 pt-3 text-center text-xs italic leading-relaxed text-hero-text/55 lg:hidden">
            {HERO_MANTRA}
          </p>
        ) : null}
      </div>
    </header>
  )
}
