import { Crown, Network, Sprout, Users } from 'lucide-react'
import type { OwnedOrganizationDuplicationMetrics } from '@/features/team/types/organization-metrics.types'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type OrganizationDuplicationSectionProps = {
  metrics: OwnedOrganizationDuplicationMetrics
  className?: string
}

function DuplicationMetricCard({
  icon: Icon,
  title,
  value,
  description,
  accent = 'border-white/10 bg-white/5',
}: {
  icon: typeof Users
  title: string
  value: number
  description: string
  accent?: string
}) {
  return (
    <article className={cn('rounded-xl border p-4 backdrop-blur-xl', accent)}>
      <div className="flex items-center gap-2 text-hero-text/60">
        <Icon className="h-4 w-4 shrink-0 text-teal-accent" aria-hidden="true" />
        <h4 className="text-xs font-medium uppercase tracking-wide">{title}</h4>
      </div>
      <p className="mt-3 text-3xl font-bold text-hero-text">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-hero-text/60">{description}</p>
    </article>
  )
}

export function OrganizationDuplicationSection({
  metrics,
  className,
}: OrganizationDuplicationSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-gold-light" aria-hidden="true" />
          <h3 className="text-base font-semibold text-hero-text">
            {MY_GROUP_COPY.duplicationTitle}
          </h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
          {MY_GROUP_COPY.duplicationDescription}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DuplicationMetricCard
          icon={Users}
          title={MY_GROUP_COPY.duplicationDirectTitle}
          value={metrics.directMembers}
          description={MY_GROUP_COPY.duplicationDirectDescription}
          accent="border-teal-accent/20 bg-teal-accent/5"
        />
        <DuplicationMetricCard
          icon={Crown}
          title={MY_GROUP_COPY.duplicationDirectLeadersTitle}
          value={metrics.directLeaders}
          description={MY_GROUP_COPY.duplicationDirectLeadersDescription}
          accent="border-gold/20 bg-gold/5"
        />
        <DuplicationMetricCard
          icon={Network}
          title={MY_GROUP_COPY.duplicationExtendedTitle}
          value={metrics.extendedTotal}
          description={MY_GROUP_COPY.duplicationExtendedDescription}
        />
        <DuplicationMetricCard
          icon={Sprout}
          title={MY_GROUP_COPY.duplicationExpansionLeadersTitle}
          value={metrics.downstreamLeaders}
          description={MY_GROUP_COPY.duplicationExpansionLeadersDescription}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">
            {MY_GROUP_COPY.duplicationNormalMembersLabel}
          </p>
          <p className="mt-1 text-xl font-bold text-hero-text">{metrics.directNormalMembers}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">
            {MY_GROUP_COPY.duplicationDownstreamMembersLabel}
          </p>
          <p className="mt-1 text-xl font-bold text-hero-text">{metrics.downstreamMembers}</p>
        </div>
      </div>
    </section>
  )
}
