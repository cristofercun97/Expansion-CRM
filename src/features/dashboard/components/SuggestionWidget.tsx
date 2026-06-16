import { ArrowRight, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { DashboardSuggestion } from '@/features/dashboard/types/dashboard.types'

type SuggestionWidgetProps = {
  suggestion: DashboardSuggestion
}

export function SuggestionWidget({ suggestion }: SuggestionWidgetProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-accent/12 text-teal-accent">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-text-dark">{suggestion.title}</h2>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-text-soft">{suggestion.message}</p>

      <Link to={suggestion.actionTo} className="mt-5 block">
        <Button
          variant="secondary"
          size="sm"
          className="w-full bg-petrol-deep text-hero-text hover:bg-petrol-dark"
        >
          {suggestion.actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Link>
    </section>
  )
}
