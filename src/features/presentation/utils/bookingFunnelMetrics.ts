export type BookingFunnelMetrics = {
  views: number
  bookingClicks: number
  bookings: number
}

export function emptyBookingFunnelMetrics(): BookingFunnelMetrics {
  return { views: 0, bookingClicks: 0, bookings: 0 }
}

export function mapBookingFunnelMetrics(raw: unknown): BookingFunnelMetrics {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    views: Math.max(0, Number(source.views) || 0),
    bookingClicks: Math.max(0, Number(source.bookingClicks) || 0),
    bookings: Math.max(0, Number(source.bookings) || 0),
  }
}

/** Null when clicks = 0 → UI shows "—". */
export function bookingClickToBookingRate(metrics: BookingFunnelMetrics): number | null {
  if (metrics.bookingClicks <= 0) return null
  return (metrics.bookings / metrics.bookingClicks) * 100
}

export function formatBookingConversionRate(metrics: BookingFunnelMetrics): string {
  const rate = bookingClickToBookingRate(metrics)
  if (rate == null) return '—'
  const rounded = Math.round(rate * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}

/**
 * Resolve public free-session CTA.
 * When booking is enabled → /reservar/:slug.
 * When disabled → hide CTA (no broken /reservar link; legacy resourceUrl ignored).
 */
export function resolvePresentationBookingCta(input: {
  bookingEnabled: boolean
  landingSlug?: string | null
  /** @deprecated Kept for call-site compat; no longer used for public CTA. */
  resourceUrl?: string | null
}): {
  href?: string
  scrollToForm: boolean
  hideCta: boolean
  mode: 'booking' | 'resource' | 'form' | 'hidden'
} {
  if (input.bookingEnabled) {
    const slug = input.landingSlug?.trim()
    if (slug) {
      return {
        href: `/reservar/${slug}`,
        scrollToForm: false,
        hideCta: false,
        mode: 'booking',
      }
    }
    // Enabled but slug missing — never invent a broken route.
    return {
      href: undefined,
      scrollToForm: false,
      hideCta: true,
      mode: 'hidden',
    }
  }

  return {
    href: undefined,
    scrollToForm: false,
    hideCta: true,
    mode: 'hidden',
  }
}
