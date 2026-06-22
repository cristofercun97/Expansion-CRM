import {
  Award,
  BookOpen,
  ClipboardList,
  Gift,
  LayoutGrid,
  Lock,
  Presentation,
  Radar,
  Users,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { QuickLinksCompassIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type { DashboardQuickLink } from '@/features/dashboard/types/dashboard-overview.types'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type DashboardQuickLinksCardProps = {
  quickLinks: DashboardQuickLink[]
  loading?: boolean
}

const QUICK_LINK_ICONS: Record<string, LucideIcon> = {
  '/dashboard/presentacion': Presentation,
  '/dashboard/radar': Radar,
  '/dashboard/contactos': Users,
  '/dashboard/academia': BookOpen,
  '/dashboard/plan': ClipboardList,
  '/dashboard/reconocimientos': Award,
  '/dashboard/progreso-equipo': UsersRound,
  '/dashboard/recompensas': Gift,
}

const QUICK_LINK_MOTIVATION: Record<string, string> = {
  '/dashboard/presentacion': 'Comparte tu historia con claridad',
  '/dashboard/radar': 'Detecta señales de interés',
  '/dashboard/contactos': 'Cuida tu red con intención',
  '/dashboard/academia': 'Sigue formándote paso a paso',
  '/dashboard/plan': 'Convierte el plan en acción',
  '/dashboard/reconocimientos': 'Celebra el avance del equipo',
  '/dashboard/progreso-equipo': 'Mira cómo crece tu organización',
  '/dashboard/recompensas': 'Consulta y solicita tus recompensas',
}

export function DashboardQuickLinksCard({ quickLinks, loading = false }: DashboardQuickLinksCardProps) {
  return (
    <DashboardOverviewCard
      title="Accesos rápidos"
      subtitle="Atajos útiles para moverte por EXPANSIÓN."
      loading={loading}
      illustration={<QuickLinksCompassIllustration size="sm" />}
      compact
      className="border-white/10 bg-white/5"
    >
      {!loading ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = QUICK_LINK_ICONS[link.href] ?? LayoutGrid
            const motivation = QUICK_LINK_MOTIVATION[link.href] ?? link.description

            return link.isEnabled ? (
              <Link
                key={link.href}
                to={link.href}
                className="group rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 transition-colors hover:border-teal-accent/25 hover:bg-teal-accent/8 sm:px-3 sm:py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-accent/10 text-teal-accent transition-colors group-hover:bg-teal-accent/18">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <p className="truncate text-xs font-medium text-hero-text sm:text-sm">{link.label}</p>
                </div>
                <p className="mt-1.5 hidden text-[11px] leading-snug text-hero-text/55 group-hover:text-hero-text/70 sm:block">
                  {motivation}
                </p>
              </Link>
            ) : (
              <div
                key={link.href}
                className={cn(
                  'rounded-lg border border-white/8 bg-white/3 px-2.5 py-2 opacity-55 sm:px-3 sm:py-2.5',
                )}
                title={link.reasonIfDisabled}
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-hero-text/45" aria-hidden="true" />
                  <p className="truncate text-xs font-medium text-hero-text/70 sm:text-sm">{link.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </DashboardOverviewCard>
  )
}
