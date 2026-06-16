import { Loader2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TeamActivationCard } from '@/features/team/components/TeamActivationCard'
import {
  TeamInvitePanel,
  TeamInvitePanelSkeleton,
} from '@/features/team/components/TeamInvitePanel'
import { TeamNameEditor } from '@/features/team/components/TeamNameEditor'
import { useMyTeam } from '@/features/team/hooks/useMyTeam'

export function MyGroupPage() {
  const { appUser } = useAuth()
  const { team, loading, error, updateTeamName } = useMyTeam()

  const hasActiveOwnedTeam =
    appUser?.activationStatus === 'active' &&
    Boolean(appUser.ownedTeamId) &&
    team?.id === appUser.ownedTeamId

  const isParticipatingInHomeTeam =
    Boolean(appUser?.homeTeamId) &&
    !hasActiveOwnedTeam &&
    team?.id === appUser?.homeTeamId

  const canEditTeamName = Boolean(team && appUser?.uid && team.ownerUid === appUser.uid)

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Mi grupo"
        subtitle="Comparte tu código para invitar miembros a tu sistema de crecimiento."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      {loading ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex min-h-[20vh] items-center justify-center">
            <p className="flex items-center gap-2 text-sm text-hero-text/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando tu grupo...
            </p>
          </div>
          <TeamInvitePanelSkeleton />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
          <TeamActivationCard />
        </div>
      ) : team ? (
        <div className="mx-auto max-w-2xl space-y-5">
          {hasActiveOwnedTeam ? (
            <p className="rounded-xl border border-teal-accent/30 bg-teal-accent/10 px-4 py-3 text-sm leading-relaxed text-hero-text/80">
              Este es tu grupo activo. Comparte tu invitación para crear tu organización.
            </p>
          ) : null}

          {isParticipatingInHomeTeam ? (
            <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-relaxed text-hero-text/80">
              Estás participando en este grupo. Para crear tu propia organización, solicita la
              Activación de grupo.
            </p>
          ) : null}

          {canEditTeamName ? <TeamNameEditor team={team} onSave={updateTeamName} /> : null}
          <TeamInvitePanel team={team} />
          <TeamActivationCard />
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          <TeamActivationCard />
          <EmptyState
            icon={Users}
            title="Aún no tienes un grupo disponible"
            description="Solicita la Activación de grupo para crear tu organización e invitar miembros."
            className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
            action={
              <Link to="/dashboard">
                <Button className="bg-gold text-petrol-deep hover:bg-gold-light">
                  Volver al panel
                </Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  )
}
