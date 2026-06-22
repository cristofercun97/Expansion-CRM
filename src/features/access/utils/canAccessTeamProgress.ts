import type { AppUser } from '@/types'

export function canAccessTeamProgressPage(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  return appUser.activationStatus === 'active' && Boolean(appUser.ownedTeamId)
}

export function canSeeTeamProgressNav(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  return appUser.activationStatus === 'active'
}
