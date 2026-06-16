import type { AppUser } from '@/types'

export function canAccessGroupContent(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  if (appUser.homeTeamId?.trim()) {
    return true
  }

  return appUser.activationStatus === 'active'
}
