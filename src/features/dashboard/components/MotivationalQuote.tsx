import { Quote } from 'lucide-react'
import type { DashboardMotivationalQuote } from '@/features/dashboard/types/dashboard.types'

type MotivationalQuoteProps = {
  quote: DashboardMotivationalQuote
}

export function MotivationalQuote({ quote }: MotivationalQuoteProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl">
      <Quote className="h-5 w-5 text-teal-accent" aria-hidden="true" />
      <p className="mt-3 text-sm italic leading-relaxed text-hero-text/85">{quote.text}</p>
      <div className="mt-4 h-0.5 w-12 rounded-full bg-gold" aria-hidden="true" />
    </section>
  )
}
