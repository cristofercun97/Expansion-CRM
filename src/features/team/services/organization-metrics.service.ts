import type {
  DirectLeaderOrganizationSummary,
  DirectOrganizationMemberView,
  MembershipOrganizationView,
  OrganizationMetrics,
  OwnedOrganizationView,
} from '@/features/team/types/organization-metrics.types'
import type { TeamMember } from '@/features/team/types/team.types'
import { teamService } from '@/features/team/services/team.service'
import {
  buildOwnedOrganizationDuplicationMetrics,
  computeOrganizationMetricsFromMembers,
  enrichDirectMembersWithLeaderSummaries,
  filterDirectActiveMembers,
  getTeamMemberUid,
  isFirebasePermissionDenied,
} from '@/features/team/utils/organizationMetricsUtils'
import { usersService } from '@/services/users.service'
import type { AppUser } from '@/types'

type DirectMemberLeaderStatus = {
  isActiveLeader: boolean
  ownedTeamId: string | null
  userProfile: AppUser | null
  resolvedUid: string | null
}

async function resolveDirectMemberLeaderStatus(
  member: TeamMember,
  ownerUid: string,
  ownerOwnedTeamId: string,
): Promise<DirectMemberLeaderStatus> {
  const resolvedUid = getTeamMemberUid(member)
  const normalizedOwnerUid = ownerUid.trim()
  const normalizedOwnerOwnedTeamId = ownerOwnedTeamId.trim()

  if (!resolvedUid) {
    if (import.meta.env.DEV) {
      console.warn('[MyGroup] No se pudo resolver uid para este miembro', {
        memberId: member.id,
        email: member.memberEmail,
        displayName: member.memberName,
      })
    }

    return { isActiveLeader: false, ownedTeamId: null, userProfile: null, resolvedUid: null }
  }

  if (resolvedUid === normalizedOwnerUid) {
    return { isActiveLeader: false, ownedTeamId: null, userProfile: null, resolvedUid }
  }

  const denormOwnedTeamId = member.ownedTeamId?.trim() || null
  const denormActivationStatus = member.activationStatus

  if (
    denormActivationStatus === 'active' &&
    denormOwnedTeamId &&
    denormOwnedTeamId !== normalizedOwnerOwnedTeamId
  ) {
    const verifiedTeam = await teamService.verifyActiveOwnedTeamForOwner(
      denormOwnedTeamId,
      resolvedUid,
    )

    if (verifiedTeam) {
      return {
        isActiveLeader: true,
        ownedTeamId: denormOwnedTeamId,
        userProfile: null,
        resolvedUid,
      }
    }
  }

  let userProfile: AppUser | null = null

  try {
    userProfile = await usersService.getUserById(resolvedUid)
  } catch (error) {
    if (!isFirebasePermissionDenied(error)) {
      throw error
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[MyGroup Direct Member Profile Audit]', {
      resolvedUid,
      memberEmail: member.memberEmail,
      userProfile,
      detectedActivationStatus: userProfile?.activationStatus,
      detectedOwnedTeamId: userProfile?.ownedTeamId,
      isActiveLeader:
        userProfile?.activationStatus === 'active' &&
        Boolean(userProfile?.ownedTeamId) &&
        userProfile?.ownedTeamId !== normalizedOwnerOwnedTeamId,
    })
  }

  if (userProfile) {
    const ownedTeamId = userProfile.ownedTeamId?.trim() || null
    const isActiveLeader =
      userProfile.activationStatus === 'active' &&
      Boolean(ownedTeamId) &&
      ownedTeamId !== normalizedOwnerOwnedTeamId

    return { isActiveLeader, ownedTeamId, userProfile, resolvedUid }
  }

  return { isActiveLeader: false, ownedTeamId: null, userProfile: null, resolvedUid }
}

async function backfillDirectMemberLeaderDenormalization(
  homeTeamId: string,
  member: TeamMember,
  leaderStatus: DirectMemberLeaderStatus,
): Promise<void> {
  if (!leaderStatus.isActiveLeader || !leaderStatus.ownedTeamId || !leaderStatus.resolvedUid) {
    return
  }

  if (member.ownedTeamId?.trim() === leaderStatus.ownedTeamId) {
    return
  }

  try {
    await teamService.syncHomeTeamMemberLeaderDenormalization(
      homeTeamId,
      leaderStatus.resolvedUid,
      leaderStatus.ownedTeamId,
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('[MyGroup] No se pudo sincronizar denormalización de líder en teamMember', {
        memberUid: leaderStatus.resolvedUid,
        error,
      })
    }
  }
}

async function loadOrganizationMetricsForOwner(
  directMembers: TeamMember[],
  ownerUid: string,
  ownerOwnedTeamId: string,
): Promise<OrganizationMetrics> {
  const activeLeaderUids = new Set<string>()

  await Promise.all(
    directMembers.map(async (member) => {
      const leaderStatus = await resolveDirectMemberLeaderStatus(
        member,
        ownerUid,
        ownerOwnedTeamId,
      )

      if (leaderStatus.isActiveLeader && leaderStatus.resolvedUid) {
        activeLeaderUids.add(leaderStatus.resolvedUid)
      }
    }),
  )

  return computeOrganizationMetricsFromMembers(directMembers, activeLeaderUids)
}

async function loadDescendantOrganizationMetrics(
  ownedTeamId: string,
  ownerUid: string,
): Promise<{ metrics: OrganizationMetrics; hasMetricsAccess: boolean }> {
  try {
    const members = await teamService.getTeamMembersByTeamId(ownedTeamId, ownerUid)
    const activeLeaderUids = new Set<string>()

    await Promise.all(
      members.map(async (member) => {
        const memberUid = getTeamMemberUid(member)

        if (!memberUid) {
          return
        }

        const leaderStatus = await resolveDirectMemberLeaderStatus(member, ownerUid, ownedTeamId)

        if (leaderStatus.isActiveLeader && leaderStatus.resolvedUid) {
          activeLeaderUids.add(leaderStatus.resolvedUid)
        }
      }),
    )

    return {
      metrics: computeOrganizationMetricsFromMembers(members, activeLeaderUids),
      hasMetricsAccess: true,
    }
  } catch (error) {
    if (isFirebasePermissionDenied(error)) {
      return {
        metrics: {
          totalMembers: 0,
          normalMembers: 0,
          activeLeaders: 0,
        },
        hasMetricsAccess: false,
      }
    }

    throw error
  }
}

async function buildDirectLeaderSummary(
  member: TeamMember,
  leaderStatus: DirectMemberLeaderStatus,
): Promise<DirectLeaderOrganizationSummary | null> {
  if (!leaderStatus.isActiveLeader || !leaderStatus.ownedTeamId || !leaderStatus.resolvedUid) {
    return null
  }

  const ownedTeam = await teamService.getTeamById(leaderStatus.ownedTeamId)
  const descendantResult = await loadDescendantOrganizationMetrics(
    leaderStatus.ownedTeamId,
    leaderStatus.resolvedUid,
  )

  return {
    leaderUid: leaderStatus.resolvedUid,
    leaderName: member.memberName?.trim() || 'Miembro del equipo',
    leaderEmail: member.memberEmail?.trim() || undefined,
    ownedTeamId: leaderStatus.ownedTeamId,
    ownedTeamName: ownedTeam?.name?.trim() || null,
    totalMembers: descendantResult.metrics.totalMembers,
    normalMembers: descendantResult.metrics.normalMembers,
    activeLeaders: descendantResult.metrics.activeLeaders,
    hasMetricsAccess: descendantResult.hasMetricsAccess,
    isInMotion: descendantResult.hasMetricsAccess && descendantResult.metrics.totalMembers > 0,
  }
}

async function loadMembershipOrganizationView(
  homeTeamId: string,
  viewerUid: string,
): Promise<MembershipOrganizationView | null> {
  const team = await teamService.getTeamById(homeTeamId)

  if (!team) {
    return null
  }

  const isTeamOwner = team.ownerUid.trim() === viewerUid.trim()

  if (!isTeamOwner) {
    return {
      team,
      metrics: null,
      metricsAvailable: false,
    }
  }

  try {
    const members = await teamService.getTeamMembersByTeamId(homeTeamId, team.ownerUid)
    const activeLeaderUids = new Set<string>()

    await Promise.all(
      members.map(async (member) => {
        const leaderStatus = await resolveDirectMemberLeaderStatus(
          member,
          team.ownerUid,
          homeTeamId,
        )

        if (leaderStatus.isActiveLeader && leaderStatus.resolvedUid) {
          activeLeaderUids.add(leaderStatus.resolvedUid)
        }
      }),
    )

    return {
      team,
      metrics: computeOrganizationMetricsFromMembers(members, activeLeaderUids),
      metricsAvailable: true,
    }
  } catch (error) {
    if (isFirebasePermissionDenied(error)) {
      return {
        team,
        metrics: null,
        metricsAvailable: false,
      }
    }

    throw error
  }
}

async function loadOwnedOrganizationView(
  ownedTeamId: string,
  viewerUid: string,
  options: { canBackfillTeamMembers?: boolean } = {},
): Promise<OwnedOrganizationView | null> {
  const team = await teamService.getTeamById(ownedTeamId)

  if (!team || team.ownerUid.trim() !== viewerUid.trim()) {
    return null
  }

  const directMembers = await teamService.getTeamMembersByTeamId(ownedTeamId, viewerUid)
  const directActiveMembers = filterDirectActiveMembers(directMembers, viewerUid)

  if (import.meta.env.DEV) {
    console.debug('[MyGroup Alejandro Leader Audit]', {
      ownerUid: viewerUid,
      ownerOwnedTeamId: ownedTeamId,
      directMembers: directActiveMembers.map((member) => ({
        raw: member,
        resolvedUid: getTeamMemberUid(member),
        isOwner: getTeamMemberUid(member) === viewerUid.trim(),
        email: member.memberEmail,
        displayName: member.memberName,
      })),
    })
  }

  const leaderSummaries: DirectLeaderOrganizationSummary[] = []

  for (const member of directActiveMembers) {
    const leaderStatus = await resolveDirectMemberLeaderStatus(member, viewerUid, ownedTeamId)

    if (options.canBackfillTeamMembers) {
      await backfillDirectMemberLeaderDenormalization(ownedTeamId, member, leaderStatus)
    }

    const leaderSummary = await buildDirectLeaderSummary(member, leaderStatus)

    if (leaderSummary) {
      leaderSummaries.push(leaderSummary)
    }
  }

  const metrics = await loadOrganizationMetricsForOwner(
    directActiveMembers,
    viewerUid,
    ownedTeamId,
  )

  const duplicationMetrics = buildOwnedOrganizationDuplicationMetrics(
    directActiveMembers,
    leaderSummaries,
  )

  const baseEntries: DirectOrganizationMemberView[] = directActiveMembers.map((member) => ({
    member,
    isActiveLeader: false,
    ownedTeamId: null,
    ownedTeamName: null,
    ownedOrganizationMetrics: null,
    hasMetricsAccess: false,
    leaderSummary: null,
  }))

  const enrichedMembers = enrichDirectMembersWithLeaderSummaries(
    baseEntries,
    duplicationMetrics.leaders,
  )

  if (import.meta.env.DEV) {
    console.debug('[MyGroup Duplication Debug]', {
      directMembers: enrichedMembers.map((entry) => ({
        id: entry.member.id,
        memberUid: getTeamMemberUid(entry.member),
        isActiveLeader: entry.isActiveLeader,
        hasLeaderSummary: Boolean(entry.leaderSummary),
      })),
      leaders: duplicationMetrics.leaders.map((leader) => ({
        leaderUid: leader.leaderUid,
        totalMembers: leader.totalMembers,
        hasMetricsAccess: leader.hasMetricsAccess,
      })),
    })
  }

  return {
    team,
    metrics,
    duplicationMetrics,
    directMembers: enrichedMembers,
  }
}

export const organizationMetricsService = {
  loadMembershipOrganizationView,
  loadOwnedOrganizationView,
}
