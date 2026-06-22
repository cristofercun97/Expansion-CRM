import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth.service'
import { organizationMetricsService } from '@/features/team/services/organization-metrics.service'
import { teamService } from '@/features/team/services/team.service'
import type {
  MembershipOrganizationView,
  OwnedOrganizationView,
} from '@/features/team/types/organization-metrics.types'
import type { Team } from '@/features/team/types/team.types'

type UseMyOrganizationsResult = {
  membershipOrganization: MembershipOrganizationView | null
  ownedOrganization: OwnedOrganizationView | null
  showMembershipBlock: boolean
  showOwnedBlock: boolean
  showActivateBlock: boolean
  loading: boolean
  error: string
  refresh: () => Promise<void>
  updateOwnedTeamName: (name: string) => Promise<Team>
}

export function useMyOrganizations(): UseMyOrganizationsResult {
  const { appUser, currentUser, initialized, loading: authLoading, refreshUser } = useAuth()
  const [membershipOrganization, setMembershipOrganization] =
    useState<MembershipOrganizationView | null>(null)
  const [ownedOrganization, setOwnedOrganization] = useState<OwnedOrganizationView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const uid = currentUser?.uid?.trim() || null
  const homeTeamId = appUser?.homeTeamId?.trim() || null
  const ownedTeamId = appUser?.ownedTeamId?.trim() || null
  const hasActiveOwnedOrg =
    appUser?.activationStatus === 'active' && Boolean(ownedTeamId)

  const showMembershipBlock = Boolean(homeTeamId) && homeTeamId !== ownedTeamId
  const showOwnedBlock = hasActiveOwnedOrg
  const showActivateBlock = !hasActiveOwnedOrg

  const loadOrganizations = useCallback(async () => {
    if (!uid) {
      setMembershipOrganization(null)
      setOwnedOrganization(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const displayName =
      appUser?.displayName?.trim() ||
      currentUser?.displayName?.trim() ||
      currentUser?.email?.trim() ||
      'Usuario'

    try {
      if (currentUser) {
        await authService.ensureFreshAuthToken(currentUser)
      }

      let resolvedOwnedTeamId = ownedTeamId

      if (appUser?.activationStatus === 'active' && !resolvedOwnedTeamId) {
        const ensured = await teamService.ensureActiveUserOwnedTeam(uid, displayName)
        resolvedOwnedTeamId = ensured.teamId
        await refreshUser()
      }

      const [membershipResult, ownedResult] = await Promise.all([
        showMembershipBlock && homeTeamId
          ? organizationMetricsService.loadMembershipOrganizationView(homeTeamId, uid)
          : Promise.resolve(null),
        showOwnedBlock && resolvedOwnedTeamId
          ? organizationMetricsService.loadOwnedOrganizationView(resolvedOwnedTeamId, uid, {
              canBackfillTeamMembers: appUser?.role === 'admin',
            })
          : Promise.resolve(null),
      ])

      setMembershipOrganization(membershipResult)
      setOwnedOrganization(ownedResult)
    } catch (loadError) {
      if (import.meta.env.DEV) {
        console.error('[Mi grupo] Failed to load organizations', loadError)
      }

      setMembershipOrganization(null)
      setOwnedOrganization(null)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tu información de grupo.',
      )
    } finally {
      setLoading(false)
    }
  }, [
    appUser?.activationStatus,
    appUser?.displayName,
    currentUser,
    homeTeamId,
    ownedTeamId,
    refreshUser,
    showMembershipBlock,
    showOwnedBlock,
    uid,
  ])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    void loadOrganizations()
  }, [authLoading, initialized, loadOrganizations])

  const updateOwnedTeamName = useCallback(
    async (name: string) => {
      if (!uid || !ownedOrganization?.team) {
        throw new Error('No hay una organización propia disponible para actualizar.')
      }

      const updatedTeam = await teamService.updateTeamName(ownedOrganization.team.id, uid, name)
      setOwnedOrganization((current) =>
        current
          ? {
              ...current,
              team: updatedTeam,
            }
          : current,
      )
      return updatedTeam
    },
    [ownedOrganization?.team, uid],
  )

  return useMemo(
    () => ({
      membershipOrganization,
      ownedOrganization,
      showMembershipBlock,
      showOwnedBlock,
      showActivateBlock,
      loading,
      error,
      refresh: loadOrganizations,
      updateOwnedTeamName,
    }),
    [
      error,
      loadOrganizations,
      loading,
      membershipOrganization,
      ownedOrganization,
      showActivateBlock,
      showMembershipBlock,
      showOwnedBlock,
      updateOwnedTeamName,
    ],
  )
}
