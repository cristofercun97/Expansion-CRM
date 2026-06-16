export const OWNER_ONLY_MODULE_PATHS = [
  '/dashboard/presentacion',
  '/dashboard/radar',
  '/dashboard/contactos',
] as const

export function isOwnerOnlyModulePath(pathname: string): boolean {
  if (pathname.startsWith('/dashboard/presentacion')) {
    return true
  }

  return OWNER_ONLY_MODULE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function isOwnerOnlyDashboardModule(modulePath: string): boolean {
  return isOwnerOnlyModulePath(modulePath)
}
