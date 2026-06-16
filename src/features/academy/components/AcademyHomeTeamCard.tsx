import { ArrowRight, Loader2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { Team } from '@/features/team/types/team.types'

type AcademyHomeTeamCardProps = {
  team: Team
  leaderName: string
}

export function AcademyHomeTeamCard({ team, leaderName }: AcademyHomeTeamCardProps) {
  const teamName = team.name.trim() || 'Grupo principal'

  return (
    <article className="overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-accent/30 bg-teal-accent/15 text-teal-accent">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-hero-text">{teamName}</h3>
            <p className="mt-1 text-sm text-hero-text/70">
              Academia compartida del grupo al que perteneces.
            </p>
            <p className="mt-1 text-sm text-hero-text/55">Administrada por {leaderName}</p>
          </div>
        </div>

        <Link to={`/dashboard/academia/grupo/${team.id}`} className="shrink-0">
          <Button
            type="button"
            className="w-full bg-gold text-petrol-deep hover:bg-gold-light sm:w-auto"
          >
            Ir
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </article>
  )
}

type AcademyHomeTeamCardSkeletonProps = {
  className?: string
}

export function AcademyHomeTeamCardSkeleton({ className }: AcademyHomeTeamCardSkeletonProps) {
  return (
    <div
      className={`flex min-h-[88px] items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-4 py-5 ${className ?? ''}`}
    >
      <p className="flex items-center gap-2 text-sm text-hero-text/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando grupo...
      </p>
    </div>
  )
}
