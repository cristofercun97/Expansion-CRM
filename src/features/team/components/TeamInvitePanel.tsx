import { Check, Copy, Link2, Loader2, MessageCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useRecommendationCode } from '@/features/referrals/hooks/useRecommendationCode'
import { buildRecommendationMessage } from '@/features/referrals/utils/recommendationUtils'
import type { Team } from '@/features/team/types/team.types'
import {
  buildTeamInviteMessage,
  buildTeamInviteUrl,
} from '@/features/team/utils/teamInviteUtils'
import { cn } from '@/lib/utils'

type TeamInvitePanelProps = {
  team: Team
  compact?: boolean
  className?: string
}

type CopiedField = 'groupMessage' | 'recommendationMessage' | 'code' | 'link'

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

export function TeamInvitePanel({ team, compact = false, className }: TeamInvitePanelProps) {
  const { showToast } = useToast()
  const { code: recommendationCode, ensureCode, ensuring } = useRecommendationCode()
  const [copiedField, setCopiedField] = useState<CopiedField | null>(null)
  const inviteUrl = buildTeamInviteUrl(team.inviteCode)
  const inviteMessage = buildTeamInviteMessage(team.name, team.inviteCode)

  async function handleCopy(value: string, field: CopiedField, successMessage: string) {
    try {
      await copyText(value)
      setCopiedField(field)
      showToast(successMessage, 'success')
      window.setTimeout(() => setCopiedField(null), 1800)
    } catch {
      showToast('No pudimos copiar al portapapeles.', 'info')
    }
  }

  async function handleCopyRecommendation() {
    const code = recommendationCode ?? (await ensureCode())

    if (!code) {
      showToast('No pudimos preparar tu código de recomendación.', 'info')
      return
    }

    await handleCopy(
      buildRecommendationMessage(code),
      'recommendationMessage',
      'Recomendación copiada al portapapeles.',
    )
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl',
        compact ? 'p-5' : 'p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-hero-text/65">Grupo</p>
          <h3 className={cn('font-semibold text-hero-text', compact ? 'text-lg' : 'text-xl')}>
            {team.name}
          </h3>
        </div>
        <Badge
          variant="teal"
          className="border border-teal-accent/30 bg-teal-accent/15 text-teal-accent"
        >
          Activo
        </Badge>
      </div>

      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4">
          <p className="text-sm font-medium text-hero-text">Invitación de grupo</p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            Úsalo para sumar miembros a tu grupo de trabajo.
          </p>
          {!compact ? (
            <p className="mt-3 break-words text-sm leading-relaxed text-hero-text/70">
              {inviteMessage}
            </p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-3 cursor-pointer"
            onClick={() =>
              void handleCopy(inviteMessage, 'groupMessage', 'Invitación de grupo copiada al portapapeles.')
            }
          >
            {copiedField === 'groupMessage' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            )}
            Copiar invitación de grupo
          </Button>
        </div>

        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-sm font-medium text-hero-text">Recomendación comercial</p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            Úsalo para recomendar Expansión sin añadir a la persona a tu grupo.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 cursor-pointer border-gold/30 bg-gold/10 text-hero-text hover:bg-gold/15 hover:text-gold-light"
            disabled={ensuring}
            onClick={() => void handleCopyRecommendation()}
          >
            {ensuring ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : copiedField === 'recommendationMessage' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            Copiar recomendación
          </Button>
        </div>

        <div>
          <p className="text-sm font-medium text-hero-text/65">Código de invitación</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-xl border border-white/10 bg-petrol-deep/60 px-4 py-2 text-base font-semibold tracking-wider text-gold-light">
              {team.inviteCode}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer border-white/20 bg-white/5 text-hero-text hover:bg-white/10 hover:text-[#81C3BC]"
              onClick={() =>
                void handleCopy(team.inviteCode, 'code', 'Código de invitación copiado.')
              }
            >
              {copiedField === 'code' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              Copiar código
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-hero-text/65">Enlace de invitación</p>
          <p className="mt-2 break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/75">
            {inviteUrl}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 cursor-pointer border-white/20 bg-white/5 text-hero-text hover:bg-white/10 hover:text-[#81C3BC]"
            onClick={() => void handleCopy(inviteUrl, 'link', 'Enlace de invitación copiado.')}
          >
            {copiedField === 'link' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
            Copiar enlace
          </Button>
        </div>
      </div>
    </section>
  )
}

type TeamInvitePanelSkeletonProps = {
  compact?: boolean
  className?: string
}

export function TeamInvitePanelSkeleton({ compact = false, className }: TeamInvitePanelSkeletonProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl',
        compact ? 'p-5' : 'p-6',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-hero-text/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Preparando tu grupo...
      </div>
    </section>
  )
}
