const INVITE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const TEAM_NAME_MIN_LENGTH = 3
export const TEAM_NAME_MAX_LENGTH = 60

export function generateInviteCode(): string {
  let suffix = ''

  for (let index = 0; index < 6; index += 1) {
    suffix += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]
  }

  return `GRUP-${suffix}`
}

export function buildDefaultTeamName(userDisplayNameOrEmail: string): string {
  const trimmed = userDisplayNameOrEmail.trim()

  if (!trimmed) {
    return 'Mi grupo'
  }

  const label = trimmed.includes('@') ? trimmed.split('@')[0] ?? trimmed : trimmed.split(/\s+/)[0] ?? trimmed

  return `Grupo de ${label}`
}

export function buildTeamInviteUrl(inviteCode: string): string {
  const encodedCode = encodeURIComponent(inviteCode)

  if (typeof window === 'undefined') {
    return `/registro?invite=${encodedCode}`
  }

  return `${window.location.origin}/registro?invite=${encodedCode}`
}

export function validateTeamName(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'El nombre del grupo es obligatorio.'
  }

  if (trimmed.length < TEAM_NAME_MIN_LENGTH) {
    return `El nombre debe tener al menos ${TEAM_NAME_MIN_LENGTH} caracteres.`
  }

  if (trimmed.length > TEAM_NAME_MAX_LENGTH) {
    return `El nombre no puede superar ${TEAM_NAME_MAX_LENGTH} caracteres.`
  }

  return null
}

export function buildTeamInviteMessage(teamName: string, inviteCode: string): string {
  return `Hola te invitamos a que formes parte del grupo ${teamName.trim()} 🎉 ${buildTeamInviteUrl(inviteCode)}`
}
