import { useEffect, useState } from 'react'
import {
  layoutOverlappingEvents,
  type LayoutOverlappingEventsOptions,
  type OverlapEventInput,
  type OverlapLayoutItem,
  type OverlapLayoutStrategy,
} from '@/features/agenda/utils/agendaOverlapLayout'

/** Shared compact breakpoint for day/week collision layout. */
export function useAgendaOverlapCompact(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return compact
}

/**
 * Day + Week share the same strategy: column packing (never overlay / peek).
 */
export function resolveOverlapStrategy(_compact: boolean): OverlapLayoutStrategy {
  void _compact
  return 'columns'
}

export function layoutTimedEvents(
  events: OverlapEventInput[],
  options: LayoutOverlappingEventsOptions & { compact?: boolean } = {},
): OverlapLayoutItem[] {
  const compact = options.compact ?? false
  return layoutOverlappingEvents(events, {
    strategy: resolveOverlapStrategy(compact),
    gutterPct: compact ? 0.8 : 1.2,
    edgeInsetPct: compact ? 1 : 1.5,
    ...options,
  })
}
