import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardAttentionCard } from '@/features/dashboard/components/overview/DashboardAttentionCard'
import { DashboardCommercialGoalCard } from '@/features/dashboard/components/overview/DashboardCommercialGoalCard'
import { DashboardHeroOverview } from '@/features/dashboard/components/overview/DashboardHeroOverview'
import { DashboardMonthlyPrizesCard } from '@/features/dashboard/components/overview/DashboardMonthlyPrizesCard'
import { DashboardNextBestActionCard } from '@/features/dashboard/components/overview/DashboardNextBestActionCard'
import { DashboardPointsPodiumCard } from '@/features/dashboard/components/overview/DashboardPointsPodiumCard'
import { DashboardQuickLinksCard } from '@/features/dashboard/components/overview/DashboardQuickLinksCard'
import { DashboardRecentActivityCard } from '@/features/dashboard/components/overview/DashboardRecentActivityCard'
import { DashboardTeamScopeCard } from '@/features/dashboard/components/overview/DashboardTeamScopeCard'
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboardOverview'
import { useDashboardUser } from '@/features/dashboard/hooks/useDashboardUser'
import type { DashboardViewScope } from '@/features/dashboard/types/dashboard-overview.types'
import { resolveNextBestAction } from '@/features/dashboard/utils/dashboardNextBestAction.utils'
import {
  canSelectDashboardViewScope,
  resolveDashboardScope,
  resolveDefaultDashboardViewScope,
} from '@/features/dashboard/utils/dashboardScope.utils'

export function DashboardPage() {
  const { appUser, currentUser } = useAuth()
  const uid = currentUser?.uid ?? appUser?.uid ?? ''
  const { user, isProfileLoading } = useDashboardUser()
  const { data: overview, loading: overviewLoading, error: overviewError } = useDashboardOverview(uid)
  const [viewScope, setViewScope] = useState<DashboardViewScope>('home_team')
  const [hasInitializedScope, setHasInitializedScope] = useState(false)

  useEffect(() => {
    if (!overviewLoading && !hasInitializedScope) {
      setViewScope(resolveDefaultDashboardViewScope(overview))
      setHasInitializedScope(true)
    }
  }, [hasInitializedScope, overview, overviewLoading])

  const scoped = useMemo(
    () => resolveDashboardScope(overview, viewScope),
    [overview, viewScope],
  )

  const nextBestAction = useMemo(
    () =>
      resolveNextBestAction(overview, {
        commercialGoal: scoped.commercialGoal,
        sales: scoped.sales,
        attentionItems: scoped.attentionItems,
      }),
    [overview, scoped],
  )

  const canSelectHome = canSelectDashboardViewScope(overview, 'home_team')
  const canSelectOwned = canSelectDashboardViewScope(overview, 'owned_team')

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <DashboardHeroOverview
        firstName={user.firstName}
        roleLabel={user.roleLabel}
        overview={overview}
        viewScope={viewScope}
        onViewScopeChange={setViewScope}
        canSelectHome={canSelectHome}
        canSelectOwned={canSelectOwned}
        loading={overviewLoading}
        isProfileLoading={isProfileLoading}
      />

      {!overviewLoading ? (
        <DashboardNextBestActionCard overview={overview} action={nextBestAction} />
      ) : (
        <DashboardNextBestActionCard overview={overview} loading />
      )}

      {overviewError ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          No se pudo cargar toda la información del dashboard. {overviewError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-12 xl:gap-6">
        <div className="md:col-span-2 xl:col-span-7">
          <DashboardCommercialGoalCard
            commercialGoal={scoped.commercialGoal}
            sales={scoped.sales}
            loading={overviewLoading}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-5">
          <DashboardAttentionCard
            attentionItems={scoped.attentionItems}
            loading={overviewLoading}
          />
        </div>

        <div className="md:col-span-1 xl:col-span-7 xl:row-span-1">
          <DashboardPointsPodiumCard ranking={scoped.ranking} loading={overviewLoading} />
        </div>

        <div className="md:col-span-1 xl:col-span-5">
          <DashboardMonthlyPrizesCard prizes={scoped.prizes} loading={overviewLoading} />
        </div>

        <div className="md:col-span-1 xl:col-span-6">
          <DashboardTeamScopeCard
            viewScope={viewScope}
            homeTeam={overview.homeTeam}
            ownedTeam={overview.ownedTeam}
            commercialGoal={scoped.commercialGoal}
            hasActiveOwnedOrganization={overview.userProfile.hasActiveOwnedOrganization}
            loading={overviewLoading}
          />
        </div>

        <div className="md:col-span-1 xl:col-span-6">
          <DashboardRecentActivityCard
            recentActivity={scoped.recentActivity}
            loading={overviewLoading}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-12">
          <DashboardQuickLinksCard quickLinks={overview.quickLinks} loading={overviewLoading} />
        </div>
      </div>
    </div>
  )
}
