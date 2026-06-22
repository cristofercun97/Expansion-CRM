import { Crown, Loader2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, PageHeader } from '@/components/ui'
import { teamService } from '@/features/team/services/team.service'
import {
  TEAM_CONTEXT_SELECTOR_COPY,
  type DualTeamAvailability,
  type TeamContextMode,
} from '@/features/team/utils/teamContextUtils'
import { cn } from '@/lib/utils'

type TeamContextSelectorProps = {
  availability: DualTeamAvailability
  onSelect: (mode: TeamContextMode) => void
  className?: string
}

type TeamNames = {
  memberTeamName: string
  leaderTeamName: string
}

export function TeamContextSelector({
  availability,
  onSelect,
  className,
}: TeamContextSelectorProps) {
  const [teamNames, setTeamNames] = useState<TeamNames>({
    memberTeamName: TEAM_CONTEXT_SELECTOR_COPY.memberCard.fallbackName,
    leaderTeamName: TEAM_CONTEXT_SELECTOR_COPY.leaderCard.fallbackName,
  })
  const [loadingNames, setLoadingNames] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadTeamNames() {
      setLoadingNames(true)

      try {
        const [memberTeam, leaderTeam] = await Promise.all([
          availability.memberTeamId
            ? teamService.getTeamById(availability.memberTeamId)
            : Promise.resolve(null),
          availability.leaderTeamId
            ? teamService.getTeamById(availability.leaderTeamId)
            : Promise.resolve(null),
        ])

        if (cancelled) {
          return
        }

        setTeamNames({
          memberTeamName:
            memberTeam?.name?.trim() || TEAM_CONTEXT_SELECTOR_COPY.memberCard.fallbackName,
          leaderTeamName:
            leaderTeam?.name?.trim() || TEAM_CONTEXT_SELECTOR_COPY.leaderCard.fallbackName,
        })
      } catch {
        if (!cancelled) {
          setTeamNames({
            memberTeamName: TEAM_CONTEXT_SELECTOR_COPY.memberCard.fallbackName,
            leaderTeamName: TEAM_CONTEXT_SELECTOR_COPY.leaderCard.fallbackName,
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingNames(false)
        }
      }
    }

    void loadTeamNames()

    return () => {
      cancelled = true
    }
  }, [availability.leaderTeamId, availability.memberTeamId])

  return (
    <div className={cn('space-y-8 px-4 py-8 sm:px-8', className)}>
      <PageHeader
        title={TEAM_CONTEXT_SELECTOR_COPY.pageTitle}
        subtitle={TEAM_CONTEXT_SELECTOR_COPY.pageSubtitle}
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      <section className="mx-auto max-w-4xl space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-hero-text">
            {TEAM_CONTEXT_SELECTOR_COPY.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-hero-text/70">
            {TEAM_CONTEXT_SELECTOR_COPY.subtitle}
          </p>
        </div>

        {loadingNames ? (
          <p className="flex items-center justify-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Preparando tus grupos...
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <ContextCard
            icon={Users}
            title={TEAM_CONTEXT_SELECTOR_COPY.memberCard.title}
            description={TEAM_CONTEXT_SELECTOR_COPY.memberCard.description}
            teamName={teamNames.memberTeamName}
            roleLabel={TEAM_CONTEXT_SELECTOR_COPY.memberCard.role}
            ctaLabel={TEAM_CONTEXT_SELECTOR_COPY.memberCard.cta}
            accent="border-teal-accent/25 bg-gradient-to-br from-teal-accent/10 via-white/8 to-transparent hover:border-teal-accent/40"
            badgeClassName="border-teal-accent/25 bg-teal-accent/10 text-teal-accent"
            disabled={loadingNames}
            onSelect={() => onSelect('member')}
          />

          <ContextCard
            icon={Crown}
            title={TEAM_CONTEXT_SELECTOR_COPY.leaderCard.title}
            description={TEAM_CONTEXT_SELECTOR_COPY.leaderCard.description}
            teamName={teamNames.leaderTeamName}
            roleLabel={TEAM_CONTEXT_SELECTOR_COPY.leaderCard.role}
            ctaLabel={TEAM_CONTEXT_SELECTOR_COPY.leaderCard.cta}
            accent="border-gold/25 bg-gradient-to-br from-gold/10 via-white/8 to-transparent hover:border-gold/35"
            badgeClassName="border-gold/25 bg-gold/10 text-gold-light"
            disabled={loadingNames}
            onSelect={() => onSelect('leader')}
          />
        </div>
      </section>
    </div>
  )
}

type ContextCardProps = {
  icon: typeof Users
  title: string
  description: string
  teamName: string
  roleLabel: string
  ctaLabel: string
  accent: string
  badgeClassName: string
  disabled?: boolean
  onSelect: () => void
}

function ContextCard({
  icon: Icon,
  title,
  description,
  teamName,
  roleLabel,
  ctaLabel,
  accent,
  badgeClassName,
  disabled = false,
  onSelect,
}: ContextCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border p-5 backdrop-blur-xl transition-all duration-200 sm:p-6',
        accent,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
          <Icon className="h-5 w-5 text-hero-text" aria-hidden="true" />
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide',
            badgeClassName,
          )}
        >
          {roleLabel}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-lg font-semibold text-hero-text">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-hero-text/70">{description}</p>
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-hero-text">
          {teamName}
        </p>
      </div>

      <Button
        type="button"
        className="mt-5 w-full bg-gold text-petrol-deep hover:bg-gold-light"
        disabled={disabled}
        onClick={onSelect}
      >
        {ctaLabel}
      </Button>
    </article>
  )
}
