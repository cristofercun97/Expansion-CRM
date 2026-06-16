import type { AppUser } from '@/types'

export function canAccessAcademyProgressPage(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  return appUser.activationStatus === 'active' && Boolean(appUser.ownedTeamId)
}

export function canSeeAcademyProgressNav(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  return appUser.activationStatus === 'active'
}
