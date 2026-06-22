import { Sparkles, Users, Wallet } from 'lucide-react'
import type { DashboardNavItem } from '@/features/dashboard/types/dashboard.types'

export const adminNavItems: DashboardNavItem[] = [
  { label: 'Activación', to: '/admin/activacion', icon: Sparkles },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users },
  { label: 'Pagos', to: '/admin/pagos', icon: Wallet },
]

export const adminGlassCardClassName =
  'rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl'
