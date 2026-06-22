const GENERIC_MEMBER_NAMES = new Set(['miembro', 'miembro del equipo'])

export function isGenericPodiumMemberName(memberName: string): boolean {
  return GENERIC_MEMBER_NAMES.has(memberName.trim().toLowerCase())
}

export function formatPodiumDisplayName(memberName: string, rank: number): string {
  if (!isGenericPodiumMemberName(memberName)) {
    return memberName
  }

  if (rank === 1) {
    return 'Participante destacado'
  }

  if (rank === 2) {
    return 'Segundo puesto'
  }

  if (rank === 3) {
    return 'Tercer puesto'
  }

  return 'Participante destacado'
}

export function formatPodiumMeritLabel(
  memberName: string,
  rank: number,
  fallback: string,
): string {
  if (!isGenericPodiumMemberName(memberName)) {
    return fallback
  }

  if (rank === 1) {
    return 'El mejor colocado del podio'
  }

  if (rank === 2) {
    return 'Segundo lugar en el ranking'
  }

  if (rank === 3) {
    return 'Tercer lugar en el ranking'
  }

  return fallback
}
