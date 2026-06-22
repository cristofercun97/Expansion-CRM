import { Crown, Loader2, Medal, Sparkles, Trophy } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { MONTHLY_MAIN_PRIZE_COPY } from '@/features/recognitions/components/WeeklyPrizeCard'
import { useMonthlyMvp } from '@/features/recognitions/hooks/useMonthlyMvp'
import type { MonthlyMvpCandidate } from '@/features/recognitions/types/monthly-mvp.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { MONTHLY_MVP_COPY } from '@/features/recognitions/utils/recognitionCopy'
import {
  MONTHLY_MVP_LEADER_NOTE,
  MONTHLY_MVP_MEMBER_COMPETE_MESSAGE,
  MONTHLY_MVP_NOT_ENOUGH_ACTIVITY_MESSAGE,
  MONTHLY_MVP_NO_SNAPSHOTS_MESSAGE,
} from '@/features/recognitions/utils/monthlyMvpUtils'
import { cn } from '@/lib/utils'

type MonthlyMvpSectionProps = {
  teamId: string
  viewRole: RecognitionsViewRole
}

export function MonthlyMvpSection({ teamId, viewRole }: MonthlyMvpSectionProps) {
  const { currentUser } = useAuth()
  const { mvp, loading, error } = useMonthlyMvp(teamId)
  const currentMemberUid = currentUser?.uid ?? null

  if (loading) {
    return (
      <article className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 via-white/8 to-transparent p-5 backdrop-blur-xl sm:p-6">
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Calculando MVP del mes...
        </p>
      </article>
    )
  }

  if (error || !mvp) {
    return <MonthlyMvpPlaceholderCard message={MONTHLY_MVP_NO_SNAPSHOTS_MESSAGE} />
  }

  const currentCandidate = currentMemberUid
    ? mvp.candidates.find((candidate) => candidate.memberUid === currentMemberUid) ?? null
    : null
  const isProvisionalMvp = mvp.snapshotsCount < 2
  const mvpTitle = isProvisionalMvp
    ? MONTHLY_MAIN_PRIZE_COPY.provisionalTitle
    : MONTHLY_MAIN_PRIZE_COPY.definitiveTitle

  return (
    <div className="space-y-4">
      <article className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/12 via-teal-accent/5 to-transparent p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-6">
        <header className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15">
            {mvp.winner ? (
              <Crown className="h-7 w-7 text-gold-light" aria-hidden="true" />
            ) : (
              <Trophy className="h-7 w-7 text-gold-light" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/80">
              {mvpTitle}
            </p>
            <h2 className="mt-1 text-base font-semibold capitalize text-hero-text">{mvp.monthLabel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
              {MONTHLY_MVP_COPY.description}
            </p>
          </div>
        </header>

        <MainMonthlyPrizeBlock winner={mvp.winner} snapshotsCount={mvp.snapshotsCount} />

        {mvp.winner ? (
          <WinnerHighlight winner={mvp.winner} isProvisional={isProvisionalMvp} />
        ) : (
          <PlaceholderState
            message={
              mvp.snapshotsCount === 0
                ? MONTHLY_MVP_NO_SNAPSHOTS_MESSAGE
                : MONTHLY_MVP_NOT_ENOUGH_ACTIVITY_MESSAGE
            }
          />
        )}

        {viewRole === 'leader' ? (
          <p className="mt-4 rounded-xl border border-gold/15 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-hero-text/65">
            {MONTHLY_MVP_LEADER_NOTE}
          </p>
        ) : null}

        {viewRole === 'member' ? (
          <MemberMvpInsight candidate={currentCandidate} />
        ) : null}
      </article>

      {mvp.candidates.length > 0 ? (
        <MonthlyMvpRankingCompact candidates={mvp.candidates.slice(0, 5)} winnerUid={mvp.winner?.memberUid} />
      ) : null}
    </div>
  )
}

function MonthlyMvpPlaceholderCard({ message }: { message: string }) {
  return (
    <article className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 via-white/8 to-transparent p-5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15 text-2xl">
          <span aria-hidden="true">{MONTHLY_MVP_COPY.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-hero-text">{MONTHLY_MVP_COPY.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
            {MONTHLY_MVP_COPY.description}
          </p>
        </div>
      </div>
      <MainMonthlyPrizeBlock winner={null} snapshotsCount={0} />
      <PlaceholderState message={message} />
    </article>
  )
}

function MainMonthlyPrizeBlock({
  winner,
}: {
  winner: MonthlyMvpCandidate | null
  snapshotsCount?: number
}) {
  return (
    <div className="mt-5 rounded-xl border border-gold/25 bg-gold/8 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light">
        {MONTHLY_MAIN_PRIZE_COPY.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-hero-text/80">
        {winner
          ? MONTHLY_MAIN_PRIZE_COPY.winnerLine(winner.memberName)
          : MONTHLY_MAIN_PRIZE_COPY.inactive}
      </p>
    </div>
  )
}

function WinnerHighlight({
  winner,
  isProvisional,
}: {
  winner: MonthlyMvpCandidate
  isProvisional: boolean
}) {
  return (
    <div className="mt-5 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 via-white/8 to-teal-accent/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-light" aria-hidden="true" />
        <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light">
          Miembro destacado del mes
        </p>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-light">
          {isProvisional
            ? MONTHLY_MAIN_PRIZE_COPY.provisionalBadge
            : MONTHLY_MAIN_PRIZE_COPY.mainPrizeBadge}
        </span>
      </div>

      <p className="mt-3 text-xl font-semibold text-hero-text">{winner.memberName}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill label="Puntos del mes" value={`${winner.totalMonthlyPoints}`} accent="gold" />
        <MetricPill label="Semanas en podio" value={`${winner.weeksInPodium}`} accent="teal" />
        <MetricPill label="Semanas activas" value={`${winner.weeksWithActivity}`} accent="teal" />
        <MetricPill
          label="Mejor posición"
          value={winner.bestWeeklyPosition ? `#${winner.bestWeeklyPosition}` : '—'}
          accent="gold"
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-hero-text/80">{winner.publicSummary}</p>
    </div>
  )
}

function MetricPill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'gold' | 'teal'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2',
        accent === 'gold'
          ? 'border-gold/20 bg-gold/8'
          : 'border-teal-accent/20 bg-teal-accent/8',
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-hero-text/45">{label}</p>
      <p
        className={cn(
          'mt-1 text-sm font-semibold',
          accent === 'gold' ? 'text-gold-light' : 'text-teal-accent',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function PlaceholderState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-gold/20 bg-gold/5 px-4 py-4">
      <p className="text-sm leading-relaxed text-hero-text/70">{message}</p>
    </div>
  )
}

function MemberMvpInsight({ candidate }: { candidate: MonthlyMvpCandidate | null }) {
  return (
    <p className="mt-4 rounded-xl border border-teal-accent/20 bg-teal-accent/8 px-4 py-3 text-sm leading-relaxed text-hero-text/80">
      {candidate && candidate.totalMonthlyPoints > 0 ? (
        <>
          Tu avance mensual:{' '}
          <span className="font-semibold text-gold-light">{candidate.totalMonthlyPoints} puntos</span>
          {' · '}
          <span className="font-semibold text-teal-accent">
            {candidate.weeksWithActivity}{' '}
            {candidate.weeksWithActivity === 1 ? 'semana con actividad' : 'semanas con actividad'}
          </span>
          .
        </>
      ) : (
        MONTHLY_MVP_MEMBER_COMPETE_MESSAGE
      )}
    </p>
  )
}

function MonthlyMvpRankingCompact({
  candidates,
  winnerUid,
}: {
  candidates: MonthlyMvpCandidate[]
  winnerUid?: string
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Medal className="h-4 w-4 text-teal-accent" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-hero-text">Ranking mensual</h3>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-hero-text/55">
          Top 5
        </span>
      </div>

      <ul className="space-y-2">
        {candidates.map((candidate, index) => (
          <li
            key={candidate.memberUid}
            className={cn(
              'rounded-xl border px-3 py-3',
              candidate.memberUid === winnerUid
                ? 'border-gold/25 bg-gold/8'
                : 'border-white/10 bg-white/5',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-hero-text/45">#{index + 1}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-hero-text">
                  {candidate.memberName}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-gold-light">
                {candidate.totalMonthlyPoints} pts
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-hero-text/55">
              <span>{candidate.weeksInPodium} en podio</span>
              <span aria-hidden="true">·</span>
              <span>
                Mejor posición{' '}
                {candidate.bestWeeklyPosition ? `#${candidate.bestWeeklyPosition}` : '—'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function MonthlyMvpPreview() {
  return <MonthlyMvpPlaceholderCard message={MONTHLY_MVP_COPY.placeholder} />
}
