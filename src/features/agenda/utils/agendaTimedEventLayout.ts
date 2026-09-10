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

/**
 * Simulate absolute bounding boxes inside a day column for DOM-style validation.
 * containerWidthPx defaults to a desktop day column (~640) or week day (~110).
 */
export function simulateEventBoundingBoxes(
  layouts: OverlapLayoutItem[],
  options?: { containerWidthPx?: number; containerLeftPx?: number; containerTopPx?: number },
): Array<{
  id: string
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}> {
  const containerWidthPx = options?.containerWidthPx ?? 640
  const containerLeftPx = options?.containerLeftPx ?? 0
  const containerTopPx = options?.containerTopPx ?? 0
  return layouts.map((item) => {
    const left = containerLeftPx + (item.leftPct / 100) * containerWidthPx
    const width = (item.widthPct / 100) * containerWidthPx
    const top = containerTopPx + item.top
    return {
      id: item.id,
      top,
      bottom: top + item.height,
      left,
      right: left + width,
      width,
      height: item.height,
    }
  })
}

export function assertNoVisualOverlay(
  boxes: Array<{ id: string; top: number; bottom: number; left: number; right: number }>,
  tolerancePx = 1,
): void {
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]!
      const b = boxes[j]!
      const verticalOverlap = a.top < b.bottom - tolerancePx && b.top < a.bottom - tolerancePx
      const horizontalOverlap = a.left < b.right - tolerancePx && b.left < a.right - tolerancePx
      if (verticalOverlap && horizontalOverlap) {
        throw new Error(`Visual overlay between ${a.id} and ${b.id}`)
      }
    }
  }
}
