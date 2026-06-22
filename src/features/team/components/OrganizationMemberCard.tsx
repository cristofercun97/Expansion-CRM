import { Button } from '@/components/ui'
import type { DirectOrganizationMemberView } from '@/features/team/types/organization-metrics.types'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type OrganizationMemberCardProps = {
  entry: DirectOrganizationMemberView
  onViewDetail: () => void
  className?: string
}

export function OrganizationMemberCard({
  entry,
  onViewDetail,
  className,
}: OrganizationMemberCardProps) {
  const { member, leaderSummary } = entry
  const isDirectLeader = Boolean(leaderSummary)
  const displayName = member.memberName?.trim() || 'Miembro del equipo'
  const displayEmail = member.memberEmail?.trim() || null
  const roleLabel = isDirectLeader ? MY_GROUP_COPY.leaderRole : MY_GROUP_COPY.memberRole

  return (
    <article
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-hero-text">{displayName}</h4>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-hero-text/75">
              {roleLabel}
            </span>
            {isDirectLeader ? (
              <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold-light">
                {MY_GROUP_COPY.leaderWithGroupBadge}
              </span>
            ) : null}
          </div>
          {displayEmail ? (
            <p className="mt-1 truncate text-sm text-hero-text/65">{displayEmail}</p>
          ) : null}
          <p className="mt-2 text-xs text-teal-accent">{MY_GROUP_COPY.activeStatus}</p>
          {isDirectLeader && leaderSummary ? (
            <>
              <p className="mt-1 text-xs text-hero-text/60">
                {MY_GROUP_COPY.memberDetailOrganizationMetrics}: {leaderSummary.totalMembers}{' '}
                personas
              </p>
              <p className="mt-0.5 text-xs text-hero-text/60">
                {MY_GROUP_COPY.leaderOrganizationLeadersLabel}: {leaderSummary.activeLeaders}
              </p>
            </>
          ) : null}
          {!isDirectLeader ? (
            <p className="mt-1 text-xs text-hero-text/55">{MY_GROUP_COPY.memberNoOrganizationYet}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
          onClick={onViewDetail}
        >
          {MY_GROUP_COPY.viewDetailButton}
        </Button>
      </div>
    </article>
  )
}
