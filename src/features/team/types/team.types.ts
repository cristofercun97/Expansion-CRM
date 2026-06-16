import type { Timestamp } from 'firebase/firestore'

export type TeamStatus = 'active'

/** Futuro: distinguirá grupo con Activación de grupo pagada. */
export type TeamActivationStatus = 'none' | 'active'

export type TeamMemberRole = 'owner' | 'member'
export type TeamMemberStatus = 'active'

export type Team = {
  id: string
  ownerUid: string
  name: string
  inviteCode: string
  status: TeamStatus
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type LeaderInviteCode = {
  code: string
  ownerUid: string
  teamId: string
  teamName?: string
  isActive: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type InviteValidationResult =
  | {
      valid: true
      invite: LeaderInviteCode
      team: Team
    }
  | {
      valid: false
      message: string
    }

export const INVALID_INVITE_CODE_MESSAGE =
  'Este código de invitación no es válido o ya no está activo.'

export type TeamMember = {
  id: string
  teamId: string
  ownerUid: string
  memberUid: string
  memberName?: string
  memberEmail?: string
  role: TeamMemberRole
  status: TeamMemberStatus
  joinedAt: Timestamp | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

/**
 * Modelo de pertenencia (Activación de grupo — implementación futura):
 *
 * - Un usuario puede pertenecer a un grupo original (`homeTeamId` vía teamMembers).
 * - Si activa su propio grupo, conserva la membership en el grupo original.
 * - Su grupo propio se guardará aparte como `ownedTeamId` en users/{uid} o equivalente.
 * - El crecimiento del grupo original no se pierde al activar.
 *
 * `ownedTeamId` aún no existe en Firestore; `homeTeamId` sí se guarda al registrarse con invitación.
 */
export type TeamMembershipModel = {
  homeTeamId?: string
  ownedTeamId?: string
}
