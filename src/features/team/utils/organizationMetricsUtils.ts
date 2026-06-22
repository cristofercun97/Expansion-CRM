import type {
  DirectLeaderOrganizationSummary,
  DirectOrganizationMemberView,
  OrganizationMetrics,
  OwnedOrganizationDuplicationMetrics,
} from '@/features/team/types/organization-metrics.types'
import type { TeamMember } from '@/features/team/types/team.types'

const FIREBASE_UID_PATTERN = /^[a-zA-Z0-9]{20,128}$/

function isLikelyFirebaseUid(value: string): boolean {
  return FIREBASE_UID_PATTERN.test(value)
}

function readTeamMemberStringField(member: TeamMember, key: string): string | null {
  const raw = member as TeamMember & Record<string, unknown>
  const value = raw[key]

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getTeamMemberUid(member: TeamMember): string | null {
  const fieldCandidates = ['memberUid', 'uid', 'userId', 'userUid', 'memberUID']
    .map((key) => readTeamMemberStringField(member, key))
    .filter((value): value is string => Boolean(value))

  for (const candidate of fieldCandidates) {
    if (isLikelyFirebaseUid(candidate) && !candidate.includes('_')) {
      return candidate
    }
  }

  const teamId = member.teamId?.trim()
  const docId = member.id?.trim()

  if (teamId && docId?.startsWith(`${teamId}_`)) {
    const parsedUid = docId.slice(teamId.length + 1)

    if (parsedUid && isLikelyFirebaseUid(parsedUid)) {
      return parsedUid
    }
  }

  if (docId && isLikelyFirebaseUid(docId) && !docId.includes('_')) {
    return docId
  }

  return null
}

export function computeOrganizationMetricsFromMembers(
  members: TeamMember[],
  activeLeaderMemberUids: Set<string> = new Set(),
): OrganizationMetrics {
  const activeMembers = members.filter((member) => member.status === 'active')
  const activeLeaders = activeMembers.filter((member) => {
    const memberUid = getTeamMemberUid(member)
    return memberUid ? activeLeaderMemberUids.has(memberUid) : false
  }).length

  return {
    totalMembers: activeMembers.length,
    normalMembers: Math.max(activeMembers.length - activeLeaders, 0),
    activeLeaders,
  }
}

export function filterDirectActiveMembers(
  members: TeamMember[],
  ownerUid: string,
): TeamMember[] {
  const normalizedOwnerUid = ownerUid.trim()

  return members.filter((member) => {
    const memberUid = getTeamMemberUid(member)
    return member.status === 'active' && memberUid !== normalizedOwnerUid
  })
}

export function buildOwnedOrganizationDuplicationMetrics(
  directActiveMembers: TeamMember[],
  leaderSummaries: DirectLeaderOrganizationSummary[],
): OwnedOrganizationDuplicationMetrics {
  const directMembers = directActiveMembers.length
  const directLeaders = leaderSummaries.length
  const directNormalMembers = Math.max(directMembers - directLeaders, 0)

  const accessibleSummaries = leaderSummaries.filter((summary) => summary.hasMetricsAccess)
  const downstreamMembers = accessibleSummaries.reduce(
    (total, summary) => total + summary.totalMembers,
    0,
  )
  const downstreamLeaders = accessibleSummaries.reduce(
    (total, summary) => total + summary.activeLeaders,
    0,
  )

  return {
    directMembers,
    directLeaders,
    directNormalMembers,
    downstreamMembers,
    downstreamLeaders,
    extendedTotal: directMembers + downstreamMembers,
    leaders: leaderSummaries,
  }
}

export function buildLeaderSummaryByUid(
  leaders: DirectLeaderOrganizationSummary[],
): Map<string, DirectLeaderOrganizationSummary> {
  return new Map(leaders.map((leader) => [leader.leaderUid.trim(), leader]))
}

export function enrichDirectMemberWithLeaderSummary(
  entry: DirectOrganizationMemberView,
  leaderSummaryByUid: Map<string, DirectLeaderOrganizationSummary>,
): DirectOrganizationMemberView {
  const memberUid = getTeamMemberUid(entry.member)
  const leaderSummary = memberUid ? (leaderSummaryByUid.get(memberUid) ?? null) : null
  const isActiveLeader = Boolean(leaderSummary)

  return {
    ...entry,
    isActiveLeader,
    leaderSummary,
    ownedTeamId: leaderSummary?.ownedTeamId ?? null,
    ownedTeamName: leaderSummary?.ownedTeamName ?? null,
    hasMetricsAccess: leaderSummary?.hasMetricsAccess ?? false,
    ownedOrganizationMetrics: leaderSummary
      ? {
          totalMembers: leaderSummary.totalMembers,
          normalMembers: leaderSummary.normalMembers,
          activeLeaders: leaderSummary.activeLeaders,
        }
      : null,
  }
}

export function enrichDirectMembersWithLeaderSummaries(
  entries: DirectOrganizationMemberView[],
  leaders: DirectLeaderOrganizationSummary[],
): DirectOrganizationMemberView[] {
  const leaderSummaryByUid = buildLeaderSummaryByUid(leaders)
  return entries.map((entry) => enrichDirectMemberWithLeaderSummary(entry, leaderSummaryByUid))
}

export function isFirebasePermissionDenied(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code) === 'permission-denied'
  }

  return false
}
