import type { Team, TeamMember } from '@/features/team/types/team.types'

export type OrganizationMetrics = {
  totalMembers: number
  normalMembers: number
  activeLeaders: number
}

export type MembershipOrganizationView = {
  team: Team
  metrics: OrganizationMetrics | null
  metricsAvailable: boolean
}

export type DirectLeaderOrganizationSummary = {
  leaderUid: string
  leaderName: string
  leaderEmail?: string
  ownedTeamId: string
  ownedTeamName?: string | null
  totalMembers: number
  normalMembers: number
  activeLeaders: number
  hasMetricsAccess: boolean
  isInMotion: boolean
}

export type OwnedOrganizationDuplicationMetrics = {
  directMembers: number
  directLeaders: number
  directNormalMembers: number
  downstreamMembers: number
  downstreamLeaders: number
  extendedTotal: number
  leaders: DirectLeaderOrganizationSummary[]
}

export type DirectOrganizationMemberView = {
  member: TeamMember
  isActiveLeader: boolean
  ownedTeamId: string | null
  ownedTeamName: string | null
  ownedOrganizationMetrics: OrganizationMetrics | null
  hasMetricsAccess: boolean
  leaderSummary: DirectLeaderOrganizationSummary | null
}

export type OwnedOrganizationView = {
  team: Team
  metrics: OrganizationMetrics
  duplicationMetrics: OwnedOrganizationDuplicationMetrics
  directMembers: DirectOrganizationMemberView[]
}

/**
 * Future: organizationPublicStats/{teamId} with aggregated counts readable by upline leaders
 * without exposing teamMembers of descendant organizations.
 */
