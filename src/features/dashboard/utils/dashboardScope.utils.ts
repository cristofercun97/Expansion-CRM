import type {
  DashboardOverviewData,
  DashboardScopedOverview,
  DashboardViewScope,
} from '@/features/dashboard/types/dashboard-overview.types'
import { buildEmptyCommercialGoal, buildSalesOverview } from '@/features/dashboard/utils/dashboard-overview.utils'

export function resolveDefaultDashboardViewScope(overview: DashboardOverviewData): DashboardViewScope {
  if (overview.scopes.home_team) {
    return 'home_team'
  }

  if (overview.scopes.owned_team) {
    return 'owned_team'
  }

  if (overview.homeTeam) {
    return 'home_team'
  }

  return 'owned_team'
}

export function canSelectDashboardViewScope(
  overview: DashboardOverviewData,
  scope: DashboardViewScope,
): boolean {
  if (scope === 'owned_team') {
    return Boolean(
      overview.scopes.owned_team &&
        overview.userProfile.hasActiveOwnedOrganization,
    )
  }

  return Boolean(overview.scopes.home_team ?? overview.homeTeam)
}

export function createEmptyScopedOverview(): DashboardScopedOverview {
  return {
    teamId: null,
    teamName: null,
    commercialGoal: buildEmptyCommercialGoal(),
    sales: buildSalesOverview([]),
    ranking: {
      weeklyTop3: [],
      monthlyTop5: [],
      currentUserRank: null,
      currentUserPoints: null,
      pointsBreakdown: null,
      weekLabel: null,
      rankingSource: 'empty',
      state: 'empty',
      emptyMessage: 'Aún no hay ranking publicado',
      errorMessage: null,
    },
    prizes: {
      mvpPrize: null,
      secondPrize: null,
      thirdPrize: null,
      currentMvpCandidate: null,
      prizePeriod: null,
      isConfigured: false,
      state: 'empty',
      emptyMessage: 'Premios no configurados',
      errorMessage: null,
    },
    attentionItems: [],
    recentActivity: [],
  }
}

export function resolveDashboardScope(
  overview: DashboardOverviewData,
  viewScope: DashboardViewScope,
): DashboardScopedOverview {
  const scoped =
    viewScope === 'owned_team' ? overview.scopes.owned_team : overview.scopes.home_team

  if (scoped) {
    return scoped
  }

  return {
    teamId:
      viewScope === 'owned_team'
        ? overview.ownedTeam?.teamId ?? overview.userProfile.ownedTeamId
        : overview.homeTeam?.teamId ?? overview.userProfile.homeTeamId,
    teamName:
      viewScope === 'owned_team'
        ? overview.ownedTeam?.teamName ?? null
        : overview.homeTeam?.teamName ?? null,
    commercialGoal: overview.commercialGoal,
    sales: overview.sales,
    ranking: overview.ranking,
    prizes: overview.prizes,
    attentionItems: overview.attentionItems,
    recentActivity: overview.recentActivity,
  }
}

export function resolveActiveTeamName(
  overview: DashboardOverviewData,
  viewScope: DashboardViewScope,
): string | null {
  const scoped = resolveDashboardScope(overview, viewScope)
  return scoped.teamName
}
