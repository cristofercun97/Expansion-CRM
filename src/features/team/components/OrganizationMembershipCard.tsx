import { Crown, Sprout, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import type { MembershipOrganizationView } from '@/features/team/types/organization-metrics.types'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type OrganizationMembershipCardProps = {
  organization: MembershipOrganizationView
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
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-hero-text/60">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-hero-text">{value}</p>
    </div>
  )
}

export function OrganizationMembershipCard({
  organization,
  className,
}: OrganizationMembershipCardProps) {
  const [showParticipation, setShowParticipation] = useState(false)
  const { team, metrics, metricsAvailable } = organization

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-accent">{MY_GROUP_COPY.membershipTitle}</p>
          <h2 className="mt-1 text-xl font-semibold text-hero-text">{team.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
            {MY_GROUP_COPY.membershipSubtitle}
          </p>
        </div>
        <span className="rounded-full border border-teal-accent/25 bg-teal-accent/10 px-3 py-1 text-xs font-medium text-teal-accent">
          Miembro
        </span>
      </div>

      {metricsAvailable && metrics ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricPill icon={Users} label="Personas" value={String(metrics.totalMembers)} />
          <MetricPill icon={Sprout} label="Miembros" value={String(metrics.normalMembers)} />
          <MetricPill
            icon={Crown}
            label="Líderes activos"
            value={String(metrics.activeLeaders)}
          />
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm leading-relaxed text-hero-text/70">
          {MY_GROUP_COPY.membershipPrivacyNote}
        </p>
      )}

      <div className="mt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-teal-accent/25 bg-teal-accent/5 text-teal-accent hover:bg-teal-accent/10"
          onClick={() => setShowParticipation((current) => !current)}
        >
          {MY_GROUP_COPY.membershipParticipationCta}
        </Button>

        {showParticipation ? (
          <p className="mt-3 text-sm leading-relaxed text-hero-text/75">
            {MY_GROUP_COPY.membershipParticipationDescription}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function OrganizationMembershipCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-5 h-20 animate-pulse rounded-xl bg-white/5" />
    </section>
  )
}
