import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/functions'
import { getFirebaseApp } from '@/lib/firebase'

export type PresentationFunnelEventKind =
  | 'presentation_view'
  | 'presentation_booking_click'
  | 'booking_started'

function getExpansionFunctions() {
  return getFunctions(getFirebaseApp(), 'europe-west1')
}

function sessionEventId(eventKind: PresentationFunnelEventKind, slug: string): string {
  const key = `pb_funnel_${eventKind}_${slug}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

/** Fire-and-forget funnel event. Never sends PII. */
export async function trackPresentationFunnelEvent(input: {
  eventKind: PresentationFunnelEventKind
  presentationSlug: string
  source?: string
  bookingDuration?: number
  /** When true, reuse one clientEventId per browser session (dedupe). */
  oncePerSession?: boolean
}): Promise<void> {
  const slug = input.presentationSlug.trim().toLowerCase()
  if (!slug) return

  const payload: Record<string, unknown> = {
    eventKind: input.eventKind,
    presentationSlug: slug,
    source: input.source || 'presentation',
  }
  if (typeof input.bookingDuration === 'number') {
    payload.bookingDuration = input.bookingDuration
  }
  if (input.oncePerSession !== false) {
    payload.clientEventId = sessionEventId(input.eventKind, slug)
  }

  try {
    const fn = httpsCallable(getExpansionFunctions(), 'trackPresentationFunnelEvent')
    await fn(payload)
  } catch {
    // Analytics must never block UX
  }
}

export const presentationFunnelService = {
  trackPresentationFunnelEvent,
}
