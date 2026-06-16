import type { AppUser } from '@/types'

export function canAccessOwnerModules(appUser: AppUser | null | undefined): boolean {
  if (!appUser) {
    return false
  }

  if (appUser.role === 'admin') {
    return true
  }

  return appUser.activationStatus === 'active'
}
