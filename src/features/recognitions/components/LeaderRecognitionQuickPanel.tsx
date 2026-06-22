import {
  Crown,
  Gift,
  HandHeart,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  LEADER_PUBLISH_RANKING_LABEL,
  LEADER_UPDATE_RANKING_LABEL,
} from '@/features/recognitions/utils/recognitionWeeklySnapshotUtils'
import { cn } from '@/lib/utils'

const LEADER_QUICK_PANEL_ITEMS = [
  {
    id: 'ranking',
    icon: RefreshCw,
    title: 'Ranking semanal',
    text: 'Publica o actualiza el ranking para mantener visible el avance.',
  },
  {
    id: 'monthly-prizes',
    icon: Gift,
    title: 'Premios del mes',
    text: 'Configura qué recibirá el top 3 este mes.',
  },
  {
    id: 'mvp',
    icon: Crown,
    title: 'MVP del mes',
    text: 'El MVP refuerza constancia, compromiso y ejemplo.',
  },
  {
    id: 'recognition',
    icon: HandHeart,
    title: 'Reconocimiento manual',
    text: 'Reconoce actitud, esfuerzo o progreso aunque no estén en el top.',
  },
] as const

type LeaderRecognitionQuickPanelProps = {
  hasPublishedSnapshot?: boolean
  isPublishing?: boolean
  onPublishRanking?: () => void
  onConfigurePrizes?: () => void
  onRecognizeMember?: () => void
  onViewRecentAchievements?: () => void
  className?: string
}

export function LeaderRecognitionQuickPanel({
  hasPublishedSnapshot = false,
  isPublishing = false,
  onPublishRanking,
  onConfigurePrizes,
  onRecognizeMember,
  onViewRecentAchievements,
  className,
}: LeaderRecognitionQuickPanelProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-white/8 to-teal-accent/5 p-4 backdrop-blur-xl sm:p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
          <Sparkles className="h-5 w-5 text-gold-light" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/75">
            Panel rápido del líder
          </p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            Acciones rápidas para mantener al equipo motivado y en movimiento.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {LEADER_QUICK_PANEL_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/15 bg-gold/8">
                  <Icon className="h-4 w-4 text-gold-light" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hero-text">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-hero-text/65">{item.text}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:flex-wrap">
        {onPublishRanking ? (
          <Button
            type="button"
            className="bg-gold text-petrol-deep hover:bg-gold-light"
            disabled={isPublishing}
            onClick={onPublishRanking}
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Publicando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                {hasPublishedSnapshot
                  ? LEADER_UPDATE_RANKING_LABEL
                  : LEADER_PUBLISH_RANKING_LABEL}
              </>
            )}
          </Button>
        ) : null}

        {onConfigurePrizes ? (
          <Button
            type="button"
            variant="outline"
            className="border-gold/25 bg-gold/5 text-gold-light hover:bg-gold/10"
            onClick={onConfigurePrizes}
          >
            <Gift className="mr-2 h-4 w-4" aria-hidden="true" />
            Configurar premios del mes
          </Button>
        ) : null}

        {onRecognizeMember ? (
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
            onClick={onRecognizeMember}
          >
            <HandHeart className="mr-2 h-4 w-4" aria-hidden="true" />
            Reconocer miembro
          </Button>
        ) : null}

        {onViewRecentAchievements ? (
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
            onClick={onViewRecentAchievements}
          >
            <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
            Ver logros recientes
          </Button>
        ) : null}
      </div>
    </article>
  )
}
