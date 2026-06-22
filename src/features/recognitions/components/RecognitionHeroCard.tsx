import { Sparkles } from 'lucide-react'
import { RECOGNITIONS_HERO } from '@/features/recognitions/utils/recognitionCopy'

export function RecognitionHeroCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/12 via-white/8 to-teal-accent/5 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
          <Sparkles className="h-6 w-6 text-gold-light" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold leading-snug text-hero-text sm:text-2xl">
            {RECOGNITIONS_HERO.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hero-text/75 sm:text-base">
            {RECOGNITIONS_HERO.description}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-light">
            {RECOGNITIONS_HERO.cta}
          </p>
        </div>
      </div>
    </article>
  )
}
