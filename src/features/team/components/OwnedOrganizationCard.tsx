import { Crown, Network, Sprout, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { OrganizationDuplicationSection } from '@/features/team/components/OrganizationDuplicationSection'
import { OrganizationMemberCard } from '@/features/team/components/OrganizationMemberCard'
import { OrganizationMemberDetailModal } from '@/features/team/components/OrganizationMemberDetailModal'
import { TeamInvitePanel } from '@/features/team/components/TeamInvitePanel'
import { TeamNameEditor } from '@/features/team/components/TeamNameEditor'
import { ReferralProgramSection } from '@/features/referrals/components/ReferralProgramSection'
import type { DirectOrganizationMemberView, OwnedOrganizationView } from '@/features/team/types/organization-metrics.types'
import type { Team } from '@/features/team/types/team.types'
import {
  buildLeaderSummaryByUid,
  enrichDirectMemberWithLeaderSummary,
} from '@/features/team/utils/organizationMetricsUtils'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type OwnedOrganizationCardProps = {
  organization: OwnedOrganizationView
  canEditTeamName: boolean
  onSaveTeamName: (name: string) => Promise<Team>
  className?: string
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-gold/15 bg-gold/5 px-4 py-3">
      <div className="flex items-center gap-2 text-hero-text/60">
        <Icon className="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gold-light">{value}</p>
    </div>
  )
}

export function OwnedOrganizationCard({
  organization,
  canEditTeamName,
  onSaveTeamName,
  className,
}: OwnedOrganizationCardProps) {
  const [selectedMember, setSelectedMember] = useState<DirectOrganizationMemberView | null>(null)
  const { team, metrics, duplicationMetrics, directMembers } = organization

  const leaderSummaryByUid = useMemo(
    () => buildLeaderSummaryByUid(duplicationMetrics.leaders),
    [duplicationMetrics.leaders],
  )

  const visibleMembers = useMemo(
    () =>
      directMembers.map((entry) => enrichDirectMemberWithLeaderSummary(entry, leaderSummaryByUid)),
    [directMembers, leaderSummaryByUid],
  )

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    console.debug('[MyGroup Duplication Card Debug]', {
      directLeaders: duplicationMetrics.directLeaders,
      cards: visibleMembers.map((entry) => ({
        memberUid: entry.member.memberUid,
        isActiveLeader: entry.isActiveLeader,
        leaderUid: entry.leaderSummary?.leaderUid ?? null,
      })),
    })
  }, [duplicationMetrics.directLeaders, visibleMembers])

  return (
    <>
      <section
        className={cn(
          'rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/8 via-white/8 to-teal-accent/5 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gold-light">{MY_GROUP_COPY.ownedTitle}</p>
            <h2 className="mt-1 text-xl font-semibold text-hero-text">{team.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
              {MY_GROUP_COPY.ownedSubtitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-hero-text/55">
              {MY_GROUP_COPY.ownedPrivacyNote}
            </p>
          </div>
          <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-light">
            Líder
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricPill icon={Users} label="Personas" value={String(metrics.totalMembers)} />
          <MetricPill icon={Sprout} label="Miembros" value={String(metrics.normalMembers)} />
          <MetricPill icon={Crown} label="Líderes activos" value={String(metrics.activeLeaders)} />
        </div>

        {canEditTeamName ? (
          <div className="mt-5">
            <TeamNameEditor team={team} onSave={onSaveTeamName} />
          </div>
        ) : null}

        <TeamInvitePanel team={team} className="mt-5" />

        <ReferralProgramSection className="mt-5" />

        <OrganizationDuplicationSection metrics={duplicationMetrics} className="mt-6" />

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            <h3 className="text-base font-semibold text-hero-text">Miembros directos</h3>
          </div>

          {visibleMembers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-hero-text/70">
              Aún no tienes miembros directos. Comparte tu invitación para empezar a crecer tu
              organización.
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleMembers.map((entry) => (
                <li key={entry.member.id}>
                  <OrganizationMemberCard
                    entry={entry}
                    onViewDetail={() => setSelectedMember(entry)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <OrganizationMemberDetailModal
        open={Boolean(selectedMember)}
        entry={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  )
}

export function OwnedOrganizationCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gold/20 bg-white/8 p-5 backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
      </div>
    </section>
  )
}
