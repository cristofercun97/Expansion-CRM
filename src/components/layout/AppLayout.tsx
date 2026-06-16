import { LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardShell } from '@/features/dashboard/components/DashboardShell'
import { resolveDashboardUser } from '@/features/dashboard/utils/resolveDashboardUser'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { appUser, currentUser, logout } = useAuth()

  const dashboardUser = useMemo(
    () => resolveDashboardUser(appUser, currentUser),
    [appUser, currentUser],
  )

  const displayName = dashboardUser.displayName
  const email = dashboardUser.email
  const isUserDashboard =
    location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')

  async function handleLogout() {
    await logout()
    showToast('Sesión cerrada. ¡Hasta pronto!', 'info')
    navigate('/login', { replace: true })
  }

  if (isUserDashboard) {
    return (
      <DashboardShell user={dashboardUser} onLogout={handleLogout}>
        <Outlet />
      </DashboardShell>
    )
  }

  return (
    <div className="min-h-screen bg-bg-warm text-text-dark">
      <header className="border-b border-petrol-dark/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-petrol-deep">{displayName}</p>
            {email ? <p className="text-xs text-text-soft">{email}</p> : null}
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="gold">{dashboardUser.roleLabel}</Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
