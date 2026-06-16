import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { canAccessOwnerModules } from '@/features/access/utils/canAccessOwnerModules'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { ModuleCard } from '@/features/dashboard/components/ModuleCard'
import { MotivationalQuote } from '@/features/dashboard/components/MotivationalQuote'
import { QuickActionButton } from '@/features/dashboard/components/QuickActionButton'
import { SuggestionWidget } from '@/features/dashboard/components/SuggestionWidget'
import { WeeklyProgressWidget } from '@/features/dashboard/components/WeeklyProgressWidget'
import {
  DASHBOARD_PANEL_TITLE,
  DASHBOARD_WELCOME_SUBTITLE,
  dashboardModules,
  dashboardMotivationalQuote,
  dashboardProgress,
  dashboardQuickActions,
  dashboardSuggestion,
} from '@/features/dashboard/constants/dashboardDemoData'
import { useDashboardContacts } from '@/features/dashboard/hooks/useDashboardContacts'
import { useDashboardUser } from '@/features/dashboard/hooks/useDashboardUser'
import {
  TeamInvitePanel,
  TeamInvitePanelSkeleton,
} from '@/features/team/components/TeamInvitePanel'
import { useMyTeam } from '@/features/team/hooks/useMyTeam'

export function DashboardPage() {
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const { user, isProfileLoading } = useDashboardUser()
  const { kpis, loading: contactsLoading } = useDashboardContacts()
  const { team, loading: teamLoading, error: teamError } = useMyTeam()
  const hasOwnerModuleAccess = canAccessOwnerModules(appUser)

  const suggestion = hasOwnerModuleAccess
    ? dashboardSuggestion
    : {
        ...dashboardSuggestion,
        message:
          'Dedica 15 minutos a revisar un material de Academia o avanzar una tarea de tu Plan de Acción.',
        actionLabel: 'Ir a Academia',
        actionTo: '/dashboard/academia',
      }

  return (
    <div className="px-8 py-8">
      {/* Header: bienvenida + acciones rápidas */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={cn(
                'text-3xl font-semibold tracking-tight text-hero-text',
                isProfileLoading && 'opacity-80',
              )}
            >
              Bienvenido, {user.firstName} 👋
            </h1>
            <Badge
              variant="gold"
              className="border border-gold/30 bg-gold/15 !text-gold-light ring-gold/40"
            >
              {user.roleLabel}
            </Badge>
          </div>
          <p className="mt-2 text-base text-hero-text/70">{DASHBOARD_WELCOME_SUBTITLE}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dashboardQuickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              label={action.label}
              icon={action.icon}
              onClick={
                action.label === 'Invitar'
                  ? () => navigate('/dashboard/mi-grupo')
                  : undefined
              }
            />
          ))}

          <button
            type="button"
            className="relative ml-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-hero-text/80 transition-colors hover:bg-white/12"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            kpi={kpi}
            showProgress={kpi.showProgressRing}
            progressValue={dashboardProgress.planProgressValue}
            isLoading={contactsLoading && kpi.source === 'live'}
          />
        ))}
      </section>

      {/* Contenido principal + columna lateral */}
      <div className="mt-10 flex flex-col gap-8 xl:flex-row">
        <section className="flex-1">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-hero-text">{DASHBOARD_PANEL_TITLE}</h2>
            <div className="h-0.5 max-w-[120px] flex-1 rounded-full bg-gold" aria-hidden="true" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardModules.map((module) => (
              <ModuleCard
                key={module.title}
                module={module}
                locked={Boolean(module.ownerOnly && !hasOwnerModuleAccess)}
              />
            ))}
          </div>
        </section>

        <aside className="w-full shrink-0 space-y-5 xl:w-80" aria-label="Resumen y sugerencias">
          {teamLoading ? (
            <TeamInvitePanelSkeleton compact />
          ) : team ? (
            <TeamInvitePanel team={team} compact />
          ) : teamError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {teamError}
            </div>
          ) : null}

          <WeeklyProgressWidget
            value={dashboardProgress.weeklyValue}
            goal={dashboardProgress.weeklyGoal}
            message={dashboardProgress.weeklyMessage}
          />
          <SuggestionWidget suggestion={suggestion} />
          <MotivationalQuote quote={dashboardMotivationalQuote} />
        </aside>
      </div>
    </div>
  )
}
