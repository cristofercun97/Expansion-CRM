import {
  BadgeEuro,
  Check,
  Clock3,
  Gift,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ReferralRewardStatusBadge } from '@/features/referrals/components/ReferralRewardStatusBadge'
import {
  MyReferralPayoutRequestsSection,
  ReferralPayoutRequestSection,
} from '@/features/referrals/components/ReferralPayoutSections'
import { useMyReferralPayoutRequests } from '@/features/referrals/hooks/useMyReferralPayoutRequests'
import { useMyReferralRewards } from '@/features/referrals/hooks/useMyReferralRewards'
import { useRecommendationCode } from '@/features/referrals/hooks/useRecommendationCode'
import type { ReferralRewardStatus } from '@/features/referrals/types/referral-reward.types'
import {
  REFERRAL_REWARDS_EMPTY,
  REFERRAL_REWARDS_HERO,
  REFERRAL_REWARDS_HISTORY,
  REFERRAL_REWARDS_LEVEL_SECTION,
  REFERRAL_REWARDS_PAGE_HEADER_CLASS,
  REFERRAL_REWARDS_PAGE_SUBTITLE,
  REFERRAL_REWARDS_PAGE_TITLE,
  REFERRAL_REWARDS_STATUS_COPY,
  REFERRAL_REWARDS_TRANSPARENCY,
} from '@/features/referrals/utils/referralRewardCopy'
import {
  formatReferralRewardAmount,
  formatReferralRewardDate,
  resolveActivatedUserLabel,
  shortenActivationRequestId,
} from '@/features/referrals/utils/referralRewardDashboardUtils'
import { buildRecommendationMessage } from '@/features/referrals/utils/recommendationUtils'
import { cn } from '@/lib/utils'

const STATUS_CARD_ORDER: ReferralRewardStatus[] = [
  'pending',
  'approved',
  'payable',
  'requested',
  'paid',
  'cancelled',
]

const STATUS_CARD_ICON: Record<ReferralRewardStatus, typeof Clock3> = {
  pending: Clock3,
  approved: BadgeEuro,
  payable: Wallet,
  requested: Send,
  paid: Check,
  cancelled: Sparkles,
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function TransparencyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gold/25 bg-gradient-to-br from-gold/8 via-white/5 to-teal-accent/5',
        compact ? 'p-4' : 'p-5 sm:p-6',
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-hero-text">
            {REFERRAL_REWARDS_TRANSPARENCY.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
            {REFERRAL_REWARDS_TRANSPARENCY.body}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReferralRewardsEmptyState() {
  const { showToast } = useToast()
  const { code: recommendationCode, ensureCode, ensuring } = useRecommendationCode()
  const [copiedRecommendation, setCopiedRecommendation] = useState(false)

  async function handleShareRecommendation() {
    const code = recommendationCode ?? (await ensureCode())

    if (!code) {
      showToast('No pudimos preparar tu código de recomendación.', 'info')
      return
    }

    try {
      await copyText(buildRecommendationMessage(code))
      setCopiedRecommendation(true)
      showToast('Recomendación copiada al portapapeles.', 'success')
      window.setTimeout(() => setCopiedRecommendation(false), 1800)
    } catch {
      showToast('No pudimos copiar al portapapeles.', 'info')
    }
  }

  return (
    <EmptyState
      icon={Gift}
      title={REFERRAL_REWARDS_EMPTY.title}
      description={REFERRAL_REWARDS_EMPTY.description}
      className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
      action={
        <Button
          type="button"
          className="bg-gold text-petrol-deep hover:bg-gold-light"
          disabled={ensuring}
          onClick={() => void handleShareRecommendation()}
        >
          {ensuring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : copiedRecommendation ? (
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {REFERRAL_REWARDS_EMPTY.shareCta}
        </Button>
      }
    />
  )
}

export function ReferralRewardsPage() {
  const { appUser, currentUser } = useAuth()
  const uid = currentUser?.uid ?? appUser?.uid ?? ''
  const { rewards, stats, loading, error } = useMyReferralRewards(uid)
  const {
    requests: payoutRequests,
    loading: payoutRequestsLoading,
    error: payoutRequestsError,
  } = useMyReferralPayoutRequests(uid)

  const statusCards = useMemo(
    () =>
      STATUS_CARD_ORDER.map((status) => ({
        status,
        amount:
          stats[
            `${status}Amount` as
              | 'pendingAmount'
              | 'approvedAmount'
              | 'payableAmount'
              | 'requestedAmount'
              | 'paidAmount'
              | 'cancelledAmount'
          ],
        count:
          stats[
            `${status}Count` as
              | 'pendingCount'
              | 'approvedCount'
              | 'payableCount'
              | 'requestedCount'
              | 'paidCount'
              | 'cancelledCount'
          ],
        copy: REFERRAL_REWARDS_STATUS_COPY[status],
        icon: STATUS_CARD_ICON[status],
      })),
    [stats],
  )

  const awaitingPayoutAmount =
    stats.pendingAmount + stats.approvedAmount + stats.requestedAmount

  const hasRewards = rewards.length > 0

  return (
    <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
      <PageHeader
        title={REFERRAL_REWARDS_PAGE_TITLE}
        subtitle={REFERRAL_REWARDS_PAGE_SUBTITLE}
        className={REFERRAL_REWARDS_PAGE_HEADER_CLASS}
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando recompensas...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : !hasRewards ? (
        <div className="mx-auto max-w-3xl space-y-6">
          <ReferralRewardsEmptyState />
          <MyReferralPayoutRequestsSection
            requests={payoutRequests}
            loading={payoutRequestsLoading}
          />
          <TransparencyNote />
        </div>
      ) : (
        <>
          <article className="overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/12 via-white/8 to-teal-accent/5 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                <Gift className="h-6 w-6 text-gold-light" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-hero-text sm:text-2xl">
                  {REFERRAL_REWARDS_HERO.title}
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: REFERRAL_REWARDS_HERO.totalGenerated, value: stats.totalAmount },
                    { label: REFERRAL_REWARDS_HERO.pending, value: awaitingPayoutAmount },
                    { label: REFERRAL_REWARDS_HERO.payable, value: stats.payableAmount },
                    { label: REFERRAL_REWARDS_HERO.paid, value: stats.paidAmount },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-hero-text/60">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-gold-light">
                        {formatReferralRewardAmount(metric.value)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <TransparencyNote compact />
                </div>
              </div>
            </div>
          </article>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-hero-text">Resumen por estado</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statusCards.map(({ status, amount, count, copy, icon: Icon }) => (
                <article
                  key={status}
                  className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ReferralRewardStatusBadge status={status} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-hero-text">
                    {formatReferralRewardAmount(amount)}
                  </p>
                  <p className="mt-1 text-sm text-hero-text/65">
                    {count} {count === 1 ? 'recompensa' : 'recompensas'}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-hero-text/70">{copy.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-hero-text">
                {REFERRAL_REWARDS_LEVEL_SECTION.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-hero-text/70">
                {REFERRAL_REWARDS_LEVEL_SECTION.activePeopleNote}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {stats.levelStats.map((levelStat) => (
                <article
                  key={levelStat.level}
                  className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-accent">
                    Nivel {levelStat.level}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-hero-text">{levelStat.label}</h3>
                  <p className="mt-2 text-2xl font-bold text-gold-light">
                    {formatReferralRewardAmount(levelStat.rewardAmount)}{' '}
                    <span className="text-sm font-normal text-hero-text/65">
                      {REFERRAL_REWARDS_LEVEL_SECTION.perActivation}
                    </span>
                  </p>
                  <dl className="mt-4 space-y-2 text-sm text-hero-text/75">
                    <div className="flex items-center justify-between gap-3">
                      <dt>{REFERRAL_REWARDS_LEVEL_SECTION.activePeople}</dt>
                      <dd className="font-semibold text-hero-text">{levelStat.activePeopleCount}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>{REFERRAL_REWARDS_LEVEL_SECTION.generated}</dt>
                      <dd className="font-semibold text-hero-text">
                        {formatReferralRewardAmount(levelStat.totalGeneratedAmount)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>{REFERRAL_REWARDS_LEVEL_SECTION.pending}</dt>
                      <dd>{formatReferralRewardAmount(levelStat.pendingAmount)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>{REFERRAL_REWARDS_LEVEL_SECTION.paid}</dt>
                      <dd>{formatReferralRewardAmount(levelStat.paidAmount)}</dd>
                    </div>
                    {levelStat.cancelledAmount > 0 ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt>Cancelado</dt>
                        <dd>{formatReferralRewardAmount(levelStat.cancelledAmount)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-hero-text">{REFERRAL_REWARDS_HISTORY.title}</h2>
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-hero-text/60">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Nivel</th>
                      <th className="px-4 py-3 font-medium">Activación</th>
                      <th className="px-4 py-3 font-medium">Importe</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {rewards.map((reward) => (
                      <tr key={reward.rewardId} className="text-hero-text/80">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatReferralRewardDate(reward.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">Nivel {reward.level}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-hero-text">
                            {resolveActivatedUserLabel(reward)}
                          </p>
                          <p className="text-xs text-hero-text/60">
                            {REFERRAL_REWARDS_HISTORY.itemDescription}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gold-light">
                          {formatReferralRewardAmount(reward.amount, reward.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ReferralRewardStatusBadge status={reward.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-hero-text/60">
                          {shortenActivationRequestId(reward.activationRequestId)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-white/10 md:hidden">
                {rewards.map((reward) => (
                  <li key={reward.rewardId} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-hero-text">
                          {resolveActivatedUserLabel(reward)}
                        </p>
                        <p className="mt-1 text-xs text-hero-text/60">
                          {formatReferralRewardDate(reward.createdAt)} · Nivel {reward.level}
                        </p>
                      </div>
                      <ReferralRewardStatusBadge status={reward.status} />
                    </div>
                    <p className="text-sm text-hero-text/70">{REFERRAL_REWARDS_HISTORY.itemDescription}</p>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-gold-light">
                        {formatReferralRewardAmount(reward.amount, reward.currency)}
                      </span>
                      <span className="text-xs text-hero-text/55">
                        {shortenActivationRequestId(reward.activationRequestId)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ReferralPayoutRequestSection
            stats={stats}
            payoutRequests={payoutRequests}
            rewardsLoading={loading}
            payoutRequestsLoading={payoutRequestsLoading}
          />

          <MyReferralPayoutRequestsSection
            requests={payoutRequests}
            loading={payoutRequestsLoading}
          />

          {payoutRequestsError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {payoutRequestsError}
            </div>
          ) : null}

          <TransparencyNote />
        </>
      )}
    </div>
  )
}
