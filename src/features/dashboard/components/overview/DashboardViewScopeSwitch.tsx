import type { DashboardViewScope } from '@/features/dashboard/types/dashboard-overview.types'
import { cn } from '@/lib/utils'

type DashboardViewScopeSwitchProps = {
  value: DashboardViewScope
  onChange: (scope: DashboardViewScope) => void
  canSelectHome: boolean
  canSelectOwned: boolean
  homeTeamName?: string | null
  ownedTeamName?: string | null
}

export function DashboardViewScopeSwitch({
  value,
  onChange,
  canSelectHome,
  canSelectOwned,
  homeTeamName,
  ownedTeamName,
}: DashboardViewScopeSwitchProps) {
  return (
    <div className="inline-flex w-full max-w-md rounded-xl border border-white/15 bg-white/8 p-1 sm:w-auto">
      <button
        type="button"
        disabled={!canSelectHome}
        onClick={() => onChange('home_team')}
        className={cn(
          'flex-1 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:px-4 sm:text-sm',
          value === 'home_team'
            ? 'bg-teal-accent/20 text-teal-accent'
            : 'text-hero-text/65 hover:text-hero-text',
          !canSelectHome && 'cursor-not-allowed opacity-45',
        )}
      >
        <span className="block">Grupo donde participo</span>
        {homeTeamName ? (
          <span className="mt-0.5 block truncate text-[10px] font-normal opacity-80 sm:text-xs">
            {homeTeamName}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={!canSelectOwned}
        onClick={() => onChange('owned_team')}
        className={cn(
          'flex-1 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:px-4 sm:text-sm',
          value === 'owned_team'
            ? 'bg-gold/20 text-gold-light'
            : 'text-hero-text/65 hover:text-hero-text',
          !canSelectOwned && 'cursor-not-allowed opacity-45',
        )}
      >
        <span className="block">Mi organización</span>
        {ownedTeamName ? (
          <span className="mt-0.5 block truncate text-[10px] font-normal opacity-80 sm:text-xs">
            {ownedTeamName}
          </span>
        ) : null}
      </button>
    </div>
  )
}
