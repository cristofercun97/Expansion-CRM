import { Lock, Sparkles } from 'lucide-react'
import type { TeamRecognition } from '@/features/recognitions/types/team-recognition.types'
import {
  formatTeamRecognitionDate,
  getTeamRecognitionTypeLabel,
  getTeamRecognitionTypeOption,
} from '@/features/recognitions/utils/teamRecognitionCopy'
import { cn } from '@/lib/utils'

type TeamRecognitionCardProps = {
  recognition: TeamRecognition
}

export function TeamRecognitionCard({ recognition }: TeamRecognitionCardProps) {
  const typeOption = getTeamRecognitionTypeOption(recognition.type)
  const TypeIcon = typeOption.icon

  return (
    <article className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 backdrop-blur-xl sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
            typeOption.accent,
          )}
        >
          <TypeIcon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                typeOption.accent,
              )}
            >
              {getTeamRecognitionTypeLabel(recognition.type)}
            </span>
            {recognition.visibility === 'private' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-hero-text/55">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Privado
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-sm font-semibold text-hero-text">{recognition.title}</h3>
          <p className="mt-1 text-sm font-medium text-gold-light">{recognition.recipientName}</p>
          <p className="mt-3 text-sm leading-relaxed text-hero-text/78">{recognition.message}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-hero-text/50">
            <Sparkles className="h-3.5 w-3.5 text-teal-accent/80" aria-hidden="true" />
            <span>{formatTeamRecognitionDate(recognition.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>Enviado por {recognition.senderName}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
