import { Lightbulb } from 'lucide-react'
import { getRadarHighlightLabel } from '@/features/radar/utils/radarMetrics'

type RadarHighlightsProps = {
  topInterest: string | null
  topLanding: string | null
}

export function RadarHighlights({ topInterest, topLanding }: RadarHighlightsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <p className="text-sm text-hero-text/65">Interés más repetido</p>
        <p className="mt-2 text-xl font-semibold text-hero-text">
          {getRadarHighlightLabel(topInterest)}
        </p>
      </article>

      <article className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <p className="text-sm text-hero-text/65">Presentación con más respuestas</p>
        <p className="mt-2 text-xl font-semibold text-hero-text">
          {getRadarHighlightLabel(topLanding)}
        </p>
      </article>
    </section>
  )
}

type RadarSummaryProps = {
  summary: string
}

export function RadarSummary({ summary }: RadarSummaryProps) {
  return (
    <section className="rounded-2xl border border-gold/20 bg-gold/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-light">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-hero-text">Resumen inteligente</h2>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/80">{summary}</p>
        </div>
      </div>
    </section>
  )
}
