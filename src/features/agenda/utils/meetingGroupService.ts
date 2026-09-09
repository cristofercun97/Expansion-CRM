import type { Team } from '@/features/team/types/team.types'
import { teamService } from '@/features/team/services/team.service'
import {
  mapActiveMembersExcludingOrganizer,
  type AccessibleTeamOption,
  type GroupMemberOption,
} from '@/features/agenda/utils/meetingGroupUtils'

export async function listAccessibleTeamsForScheduling(
  uid: string,
): Promise<AccessibleTeamOption[]> {
  const byId = new Map<string, AccessibleTeamOption>()

  const owned = await teamService.getMyTeam(uid)
  if (owned) {
    byId.set(owned.id, { id: owned.id, name: owned.name, ownerUid: owned.ownerUid })
  }

  const memberships = await teamService.getActiveTeamMembershipsByMemberUid(uid)
  for (const membership of memberships) {
    if (byId.has(membership.teamId)) {
      continue
    }

    const team = await teamService.getTeamById(membership.teamId)
    if (!team) {
      continue
    }

    byId.set(team.id, { id: team.id, name: team.name, ownerUid: team.ownerUid })
  }

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export async function listActiveGroupMembersForScheduling(options: {
  team: Pick<Team, 'id' | 'ownerUid'> | AccessibleTeamOption
  organizerId: string
}): Promise<GroupMemberOption[]> {
  const members = await teamService.getTeamMembersByTeamId(
    options.team.id,
    options.team.ownerUid,
  )

  return mapActiveMembersExcludingOrganizer(members, options.organizerId)
}
