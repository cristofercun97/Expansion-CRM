import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import { recognitionRankingService } from '@/features/recognitions/services/recognition-ranking.service'
import type { WeeklyRecognitionRanking } from '@/features/recognitions/types/recognition-ranking.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { resolveDualTeamAvailability } from '@/features/team/utils/teamContextUtils'
import type {
  DashboardOverviewData,
  DashboardOwnedTeamOverview,
  DashboardScopedOverview,
  DashboardTeamOverview,
} from '@/features/dashboard/types/dashboard-overview.types'
import {
  buildAttentionItems,
  buildCommercialGoalOverview,
  buildDashboardKpisFromOverview,
  buildDashboardQuickLinks,
  buildDashboardUserProfile,
  buildEmptyCommercialGoal,
  buildPrizesOverview,
  buildRankingOverview,
  buildRecentActivity,
  buildRewardsOverview,
  buildSalesOverview,
  buildSuggestionOverview,
  buildWeeklyProgressOverview,
  countTasksDueToday,
} from '@/features/dashboard/utils/dashboard-overview.utils'
import { memberDashboardService } from '@/features/member-dashboard/services/member-dashboard.service'
import {
  buildMemberDashboardProgress,
  resolveMemberDashboardTeamId,
} from '@/features/member-dashboard/utils/memberDashboardUtils'
import { monthlyMvpService } from '@/features/recognitions/services/monthly-mvp.service'
import { recognitionMonthlyPrizesService } from '@/features/recognitions/services/recognition-monthly-prizes.service'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import { referralPayoutReaderService } from '@/features/referrals/services/referral-payout-reader.service'
import { getMyReferralRewards } from '@/features/referrals/services/referral-rewards-reader.service'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'
import type { ReferralReward } from '@/features/referrals/types/referral-reward.types'
import { buildReferralRewardDashboardStats } from '@/features/referrals/utils/referralRewardDashboardUtils'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import { organizationMetricsService } from '@/features/team/services/organization-metrics.service'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { AppUser } from '@/types'

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch {
    return fallback
  }
}

async function getMyReferralPayoutRequests(userUid: string): Promise<ReferralPayoutRequest[]> {
  const normalizedUid = userUid.trim()

  if (!normalizedUid) {
    return []
  }

  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.referralPayoutRequests),
      where('userUid', '==', normalizedUid),
      orderBy('requestedAt', 'desc'),
    ),
  )

  return snapshot.docs.map((doc) =>
    referralPayoutReaderService.mapReferralPayoutRequestDocument(doc.id, doc.data()),
  )
}

async function getAdminPendingPayoutRequests(): Promise<ReferralPayoutRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.referralPayoutRequests),
      orderBy('requestedAt', 'desc'),
    ),
  )

  return snapshot.docs
    .map((doc) => referralPayoutReaderService.mapReferralPayoutRequestDocument(doc.id, doc.data()))
    .filter((request) => request.status === 'pending' || request.status === 'approved')
}

function buildHomeTeamOverview(
  teamId: string,
  teamName: string,
  ownerUid: string,
  totalMembers: number | null,
  ranking: ReturnType<typeof buildRankingOverview>,
): DashboardTeamOverview {
  return {
    teamId,
    teamName,
    ownerUid,
    totalMembers,
    myRank: ranking.currentUserRank,
    myPoints: ranking.currentUserPoints,
    status: 'active',
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

function buildOwnedTeamOverview(input: {
  teamId: string
  teamName: string
  directMembers: number
  activeMembers: number
  directLeaders: number
  normalMembers: number
  validatedSalesAmount: number
  generatedRewardsAmount: number
}): DashboardOwnedTeamOverview {
  return {
    teamId: input.teamId,
    teamName: input.teamName,
    directMembers: input.directMembers,
    activeMembers: input.activeMembers,
    directLeaders: input.directLeaders,
    normalMembers: input.normalMembers,
    validatedSalesAmount: input.validatedSalesAmount,
    generatedRewardsAmount: input.generatedRewardsAmount,
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

function appendRewardActivity(
  rewards: ReferralReward[],
  events: ReturnType<typeof buildRecentActivity>,
): ReturnType<typeof buildRecentActivity> {
  const rewardEvents = rewards.slice(0, 5).map((reward) => ({
    id: `reward-${reward.rewardId}`,
    type: 'reward_generated' as const,
    title: 'Recompensa generada',
    description: `${reward.activatedUserName ?? 'Un miembro'} generó una recompensa de Nivel ${reward.level}.`,
    createdAt: reward.createdAt,
    actorName: reward.activatedUserName ?? null,
    href: '/dashboard/recompensas',
  }))

  return [...events, ...rewardEvents]
    .sort((left, right) => {
      const leftTime = left.createdAt?.toMillis?.() ?? 0
      const rightTime = right.createdAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
    .slice(0, 8)
}

async function loadTeamRecognitionBundle(
  teamId: string,
  viewerUid: string,
  viewRole: RecognitionsViewRole,
): Promise<{
  weeklySnapshot: RecognitionWeeklySnapshot | null
  monthlySnapshots: RecognitionWeeklySnapshot[]
  liveRanking: WeeklyRecognitionRanking | null
}> {
  const context = {
    teamId,
    authUid: viewerUid,
    viewRole,
  }

  const [weeklySnapshot, monthlySnapshots, liveRanking] = await Promise.all([
    safeLoad(
      () => recognitionWeeklySnapshotService.getPublishedSnapshotByPeriod(teamId, undefined, context),
      null,
    ),
    safeLoad(() => recognitionWeeklySnapshotService.listPublishedSnapshotsByTeamId(teamId), []),
    safeLoad(
      () => recognitionRankingService.getWeeklyRecognitionRankingForLeader(teamId, context),
      null,
    ),
  ])

  return { weeklySnapshot, monthlySnapshots, liveRanking }
}

async function buildTeamScopedOverview(input: {
  teamId: string
  teamName: string
  viewerUid: string
  viewRole: RecognitionsViewRole
  leaderView: boolean
  memberUidForSales?: string
  contacts: Awaited<ReturnType<typeof contactsService.getContactsByOwner>>
  memberProgress: ReturnType<typeof buildMemberDashboardProgress> | null
  inactiveMembersCount: number
  isAdmin: boolean
  adminPendingPayoutsCount: number
  includeOwnerAttention: boolean
  payoutRequests: ReferralPayoutRequest[]
  referralRewards: ReferralReward[]
}): Promise<DashboardScopedOverview> {
  const salesBundle = await safeLoad(async () => {
    const salesGoal = await salesGoalService.getActiveGoalForTeam(input.teamId)
    const salesReports = await salesGoalService.getReportsForTeam(input.teamId, {
      goalId: salesGoal?.id,
      leaderView: input.leaderView,
      memberUid: input.memberUidForSales,
    })

    return { salesGoal, salesReports }
  }, { salesGoal: null, salesReports: [] })

  const recognitionBundle = await loadTeamRecognitionBundle(
    input.teamId,
    input.viewerUid,
    input.viewRole,
  )

  const [monthlyPrizes, monthlyMvp] = await Promise.all([
    safeLoad(() => recognitionMonthlyPrizesService.getByTeamId(input.teamId), null),
    safeLoad(() => monthlyMvpService.getMonthlyMvpForTeam(input.teamId), null),
  ])

  const ranking = buildRankingOverview(
    recognitionBundle.weeklySnapshot,
    recognitionBundle.monthlySnapshots,
    input.viewerUid,
    recognitionBundle.liveRanking,
  )
  const commercialGoal = salesBundle.salesGoal
    ? buildCommercialGoalOverview(input.teamId, salesBundle.salesGoal, salesBundle.salesReports)
    : buildEmptyCommercialGoal()
  const sales = buildSalesOverview(salesBundle.salesReports)
  const prizes = buildPrizesOverview(monthlyPrizes, monthlyMvp)
  const attentionItems = buildAttentionItems({
    sales,
    contacts: input.contacts,
    memberProgress: input.memberProgress,
    inactiveMembersCount: input.inactiveMembersCount,
    adminPendingPayoutsCount: input.adminPendingPayoutsCount,
    isAdmin: input.isAdmin,
    hasOwnedTeam: input.includeOwnerAttention,
  })
  const recentActivity = appendRewardActivity(
    input.referralRewards,
    buildRecentActivity({
      salesReports: salesBundle.salesReports,
      payoutRequests: input.payoutRequests,
      contacts: input.contacts,
      memberProgress: input.memberProgress,
    }),
  )

  return {
    teamId: input.teamId,
    teamName: input.teamName,
    commercialGoal,
    sales,
    ranking,
    prizes,
    attentionItems,
    recentActivity,
  }
}

function applyScopedFields(
  scoped: DashboardScopedOverview,
): Pick<
  DashboardOverviewData,
  'commercialGoal' | 'sales' | 'ranking' | 'prizes' | 'attentionItems' | 'recentActivity'
> {
  return {
    commercialGoal: scoped.commercialGoal,
    sales: scoped.sales,
    ranking: scoped.ranking,
    prizes: scoped.prizes,
    attentionItems: scoped.attentionItems,
    recentActivity: scoped.recentActivity,
  }
}

async function loadDashboardOverview(
  uid: string,
  appUser: AppUser | null | undefined,
): Promise<DashboardOverviewData> {
  const normalizedUid = uid.trim()
  const userProfile = buildDashboardUserProfile(appUser, normalizedUid)
  const memberTeamId = resolveMemberDashboardTeamId(appUser)
  const ownedTeamId = userProfile.hasActiveOwnedOrganization ? userProfile.ownedTeamId : null
  const isAdmin = appUser?.role === 'admin'
  const teamAvailability = resolveDualTeamAvailability(appUser, userProfile.homeTeamId)
  const homeScopeTeamId = teamAvailability.memberTeamId ?? null
  const ownedScopeTeamId =
    userProfile.hasActiveOwnedOrganization && ownedTeamId ? ownedTeamId : null

  const [
    contacts,
    homeTeamRecord,
    ownedTeamRecord,
    ownedOrganization,
    memberRawData,
    referralRewards,
    myPayoutRequests,
    adminPendingPayouts,
  ] = await Promise.all([
    safeLoad(() => contactsService.getContactsByOwner(normalizedUid), []),
    userProfile.homeTeamId
      ? safeLoad(() => teamService.getTeamById(userProfile.homeTeamId!), null)
      : Promise.resolve(null),
    ownedTeamId
      ? safeLoad(() => teamService.getTeamById(ownedTeamId), null)
      : Promise.resolve(null),
    ownedTeamId
      ? safeLoad(
          () => organizationMetricsService.loadOwnedOrganizationView(ownedTeamId, normalizedUid),
          null,
        )
      : Promise.resolve(null),
    memberTeamId
      ? safeLoad(
          () => memberDashboardService.loadMemberDashboardData(memberTeamId, normalizedUid),
          null,
        )
      : Promise.resolve(null),
    safeLoad(() => getMyReferralRewards(normalizedUid), []),
    safeLoad(() => getMyReferralPayoutRequests(normalizedUid), []),
    isAdmin ? safeLoad(() => getAdminPendingPayoutRequests(), []) : Promise.resolve([]),
  ])

  const memberProgress = memberRawData ? buildMemberDashboardProgress(memberRawData) : null

  const homeScopeTeamRecord =
    homeScopeTeamId && homeScopeTeamId !== userProfile.homeTeamId
      ? await safeLoad(() => teamService.getTeamById(homeScopeTeamId), null)
      : homeTeamRecord

  const [homeScope, ownedScope] = await Promise.all([
    homeScopeTeamId
      ? buildTeamScopedOverview({
          teamId: homeScopeTeamId,
          teamName: homeScopeTeamRecord?.name?.trim() || 'Mi grupo',
          viewerUid: normalizedUid,
          viewRole: 'member',
          leaderView: false,
          memberUidForSales: normalizedUid,
          contacts,
          memberProgress,
          inactiveMembersCount: 0,
          isAdmin,
          adminPendingPayoutsCount: 0,
          includeOwnerAttention: false,
          payoutRequests: myPayoutRequests,
          referralRewards,
        })
      : Promise.resolve(null),
    ownedScopeTeamId
      ? buildTeamScopedOverview({
          teamId: ownedScopeTeamId,
          teamName:
            ownedTeamRecord?.name?.trim() || ownedOrganization?.team.name || 'Mi organización',
          viewerUid: normalizedUid,
          viewRole: 'leader',
          leaderView: true,
          contacts,
          memberProgress,
          inactiveMembersCount:
            ownedOrganization?.directMembers.filter(
              (memberView) => memberView.member.activationStatus !== 'active',
            ).length ?? 0,
          isAdmin,
          adminPendingPayoutsCount: adminPendingPayouts.length,
          includeOwnerAttention: true,
          payoutRequests: myPayoutRequests,
          referralRewards,
        })
      : Promise.resolve(null),
  ])

  const homeTeamMembersCount =
    homeTeamRecord && userProfile.homeTeamId
      ? await safeLoad(async () => {
          const members = await teamService.getTeamMembersByTeamId(
            homeTeamRecord.id,
            homeTeamRecord.ownerUid,
          )
          return members.length
        }, null)
      : null

  const memberProgressResolved = memberProgress
  const referralStats = buildReferralRewardDashboardStats(referralRewards)
  const rewards = buildRewardsOverview(referralStats, myPayoutRequests)
  const tasksDueTodayCount = memberRawData
    ? countTasksDueToday(memberRawData.tasks, memberRawData.taskProgress)
    : 0
  const planProgressPercent =
    memberProgressResolved && memberProgressResolved.plan.totalTasks > 0
      ? Math.round(
          (memberProgressResolved.plan.completedTasksCount / memberProgressResolved.plan.totalTasks) *
            100,
        )
      : null

  const homeRanking = homeScope?.ranking ?? buildRankingOverview(null, [], normalizedUid, null)

  const homeTeam =
    homeTeamRecord && userProfile.homeTeamId
      ? buildHomeTeamOverview(
          homeTeamRecord.id,
          homeTeamRecord.name,
          homeTeamRecord.ownerUid,
          homeTeamMembersCount,
          homeRanking,
        )
      : null

  const ownedCommercialGoal = ownedScope?.commercialGoal ?? buildEmptyCommercialGoal()

  const ownedTeam: DashboardOwnedTeamOverview | null = (() => {
    if (!ownedTeamId || !userProfile.hasActiveOwnedOrganization) {
      return null
    }

    if (ownedOrganization) {
      return buildOwnedTeamOverview({
        teamId: ownedOrganization.team.id,
        teamName: ownedOrganization.team.name,
        directMembers: ownedOrganization.duplicationMetrics.directMembers,
        activeMembers: ownedOrganization.metrics.totalMembers,
        directLeaders: ownedOrganization.duplicationMetrics.directLeaders,
        normalMembers: ownedOrganization.metrics.normalMembers,
        validatedSalesAmount: ownedCommercialGoal.validatedAmount,
        generatedRewardsAmount: referralStats.totalAmount,
      })
    }

    const fallbackTeamName = ownedTeamRecord?.name?.trim() || 'Mi organización'

    return buildOwnedTeamOverview({
      teamId: ownedTeamId,
      teamName: fallbackTeamName,
      directMembers: 0,
      activeMembers: 0,
      directLeaders: 0,
      normalMembers: 0,
      validatedSalesAmount: ownedCommercialGoal.validatedAmount,
      generatedRewardsAmount: referralStats.totalAmount,
    })
  })()

  const defaultScoped = homeScope ?? ownedScope
  const legacyFields = defaultScoped
    ? applyScopedFields(defaultScoped)
    : {
        commercialGoal: buildEmptyCommercialGoal(),
        sales: buildSalesOverview([]),
        ranking: buildRankingOverview(null, [], normalizedUid, null),
        prizes: buildPrizesOverview(null, null),
        attentionItems: [],
        recentActivity: [],
      }

  return {
    userProfile,
    homeTeam,
    ownedTeam,
    scopes: {
      home_team: homeScope,
      owned_team: ownedScope,
    },
    ...legacyFields,
    rewards,
    quickLinks: buildDashboardQuickLinks(appUser),
    kpis: buildDashboardKpisFromOverview({
      contacts,
      tasksDueTodayCount,
      planProgressPercent,
      hasPlanTasks: Boolean(memberProgressResolved && memberProgressResolved.plan.totalTasks > 0),
    }),
    weeklyProgress: buildWeeklyProgressOverview(memberProgressResolved, legacyFields.ranking),
    suggestion: buildSuggestionOverview(memberProgressResolved),
  }
}

export const dashboardOverviewService = {
  loadDashboardOverview,
}
