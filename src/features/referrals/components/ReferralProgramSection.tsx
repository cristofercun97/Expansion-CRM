import { Check, Loader2, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useRecommendationCode } from '@/features/referrals/hooks/useRecommendationCode'
import { REFERRAL_REWARD_LEVELS } from '@/features/referrals/constants/referralProgram.constants'
import { REFERRAL_REWARDS_MI_GRUPO_CTA } from '@/features/referrals/utils/referralRewardCopy'
import { REFERRAL_PROGRAM_COPY } from '@/features/referrals/utils/referralProgramCopy'
import { buildRecommendationMessage } from '@/features/referrals/utils/recommendationUtils'
import { cn } from '@/lib/utils'

type ReferralProgramSectionProps = {
  className?: string
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

export function ReferralProgramSection({ className }: ReferralProgramSectionProps) {
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
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
          <Sparkles className="h-5 w-5 text-gold-light" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-hero-text">{REFERRAL_PROGRAM_COPY.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            {REFERRAL_PROGRAM_COPY.intro}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
            {REFERRAL_PROGRAM_COPY.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-teal-accent/20 bg-teal-accent/5 px-4 py-4">
        <p className="text-sm leading-relaxed text-hero-text/75">{REFERRAL_PROGRAM_COPY.levelsIntro}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {REFERRAL_REWARD_LEVELS.map((rewardLevel) => (
            <li
              key={rewardLevel.level}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
            >
              <p className="text-2xl font-bold text-gold-light">{rewardLevel.amount} €</p>
              <p className="mt-1 text-xs leading-relaxed text-hero-text/65">{rewardLevel.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-hero-text/60">
          {REFERRAL_PROGRAM_COPY.levelsNote}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {REFERRAL_PROGRAM_COPY.fomoLines.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm leading-relaxed text-hero-text/70">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-accent" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-3">
        <p className="text-sm leading-relaxed text-hero-text/70">
          Úsalo para recomendar Expansión sin añadir a la persona a tu grupo.
        </p>
        <div className="flex flex-wrap items-center gap-3">
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
            {REFERRAL_PROGRAM_COPY.shareCta}
          </Button>

          <Link to="/dashboard/recompensas">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
            >
              {REFERRAL_REWARDS_MI_GRUPO_CTA}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gold/25 bg-gradient-to-br from-gold/8 via-white/5 to-teal-accent/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-semibold text-hero-text">
              {REFERRAL_PROGRAM_COPY.transparencyTitle}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
              {REFERRAL_PROGRAM_COPY.transparencyBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
