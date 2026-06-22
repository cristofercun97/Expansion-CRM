import {
  Crown,
  Flame,
  HandHeart,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRecentAchievementsFeed } from '@/features/recognitions/hooks/useRecentAchievementsFeed'
import type {
  RecognitionAchievement,
  RecognitionAchievementType,
} from '@/features/recognitions/types/recognition-achievement.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import {
  formatRecognitionAchievementDate,
  getRecognitionAchievementTypeLabel,
  RECENT_ACHIEVEMENTS_SECTION,
} from '@/features/recognitions/utils/recognitionAchievements'
import { cn } from '@/lib/utils'

type RecentAchievementsSectionProps = {
  teamId: string
  viewRole: RecognitionsViewRole
}

const ACHIEVEMENT_ICON_MAP: Record<RecognitionAchievementType, LucideIcon> = {
  recognition: HandHeart,
  podium: Trophy,
  team_movement: Users,
  mvp: Crown,
  personal: TrendingUp,
}

const ACHIEVEMENT_ACCENT_MAP: Record<RecognitionAchievementType, string> = {
  recognition: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  podium: 'border-gold/25 bg-gold/10 text-gold-light',
  team_movement: 'border-teal-accent/20 bg-white/8 text-teal-accent',
  mvp: 'border-gold/30 bg-gold/12 text-gold-light',
  personal: 'border-teal-accent/25 bg-teal-accent/8 text-teal-accent',
}

export function RecentAchievementsSection({ teamId, viewRole }: RecentAchievementsSectionProps) {
  const { currentUser } = useAuth()
  const { achievements, fomoMessage, loading, error } = useRecentAchievementsFeed({
    teamId,
    viewerUid: currentUser?.uid ?? null,
    viewRole,
  })

  return (
    <article
      id="recent-achievements"
      className="scroll-mt-24 rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-teal-accent" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-hero-text">
            {RECENT_ACHIEVEMENTS_SECTION.title}
          </h2>
          <p className="mt-1 text-sm text-hero-text/70">{RECENT_ACHIEVEMENTS_SECTION.subtitle}</p>
        </div>
      </div>

      <PositiveFomoCard message={fomoMessage} />

      {loading ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando logros recientes...
        </p>
      ) : error ? (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : achievements.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4">
          <p className="text-sm leading-relaxed text-hero-text/70">
            {RECENT_ACHIEVEMENTS_SECTION.emptyMessage}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </ul>
      )}
    </article>
  )
}

function PositiveFomoCard({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-white/5 to-teal-accent/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
          <Target className="h-5 w-5 text-gold-light" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-hero-text">
            {RECENT_ACHIEVEMENTS_SECTION.fomoTitle}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/75">{message}</p>
        </div>
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: RecognitionAchievement }) {
  const Icon = ACHIEVEMENT_ICON_MAP[achievement.type]
  const formattedDate = formatRecognitionAchievementDate(achievement.createdAt)

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            ACHIEVEMENT_ACCENT_MAP[achievement.type],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                ACHIEVEMENT_ACCENT_MAP[achievement.type],
              )}
            >
              {getRecognitionAchievementTypeLabel(achievement.type)}
            </span>
            {achievement.visibility === 'private' ? (
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-hero-text/50">
                Privado
              </span>
            ) : null}
            {formattedDate ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-hero-text/45">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {formattedDate}
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-sm font-semibold text-hero-text">{achievement.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/75">{achievement.description}</p>
        </div>
      </div>
    </li>
  )
}
