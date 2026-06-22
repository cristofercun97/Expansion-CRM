import { Loader2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ActivateOwnedOrganizationCard } from '@/features/team/components/ActivateOwnedOrganizationCard'
import {
  OrganizationMembershipCard,
  OrganizationMembershipCardSkeleton,
} from '@/features/team/components/OrganizationMembershipCard'
import {
  OwnedOrganizationCard,
  OwnedOrganizationCardSkeleton,
} from '@/features/team/components/OwnedOrganizationCard'
import { useMyOrganizations } from '@/features/team/hooks/useMyOrganizations'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'

export function MyGroupPage() {
  const { appUser, currentUser } = useAuth()
  const {
    membershipOrganization,
    ownedOrganization,
    showMembershipBlock,
    showOwnedBlock,
    showActivateBlock,
    loading,
    error,
    updateOwnedTeamName,
  } = useMyOrganizations()

  const canEditOwnedTeamName = Boolean(
    ownedOrganization?.team &&
      currentUser?.uid &&
      ownedOrganization.team.ownerUid === currentUser.uid,
  )

  const hasAnyOrganization = showMembershipBlock || showOwnedBlock

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title={MY_GROUP_COPY.pageTitle}
        subtitle={MY_GROUP_COPY.pageSubtitle}
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      {loading ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex min-h-[16vh] items-center justify-center">
            <p className="flex items-center gap-2 text-sm text-hero-text/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando tu información de grupo...
            </p>
          </div>
          {showMembershipBlock ? <OrganizationMembershipCardSkeleton /> : null}
          {showOwnedBlock ? <OwnedOrganizationCardSkeleton /> : null}
        </div>
      ) : error ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
          {showActivateBlock ? <ActivateOwnedOrganizationCard /> : null}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          {showMembershipBlock && membershipOrganization ? (
            <OrganizationMembershipCard organization={membershipOrganization} />
          ) : null}

          {showOwnedBlock && ownedOrganization ? (
            <OwnedOrganizationCard
              organization={ownedOrganization}
              canEditTeamName={canEditOwnedTeamName}
              onSaveTeamName={updateOwnedTeamName}
            />
          ) : null}

          {showActivateBlock ? <ActivateOwnedOrganizationCard /> : null}

          {!hasAnyOrganization && !showActivateBlock ? (
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
          ) : null}

          {!hasAnyOrganization && showActivateBlock && !appUser?.homeTeamId ? (
            <EmptyState
              icon={Users}
              title="Aún no perteneces a un grupo"
              description="Únete con un código de invitación o activa tu propia organización para empezar."
              className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
