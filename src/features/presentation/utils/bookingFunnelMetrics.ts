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

/** Resolve public booking CTA href/fallback without inventing URLs. */
export function resolvePresentationBookingCta(input: {
  bookingEnabled: boolean
  landingSlug?: string | null
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
  }

  const resourceUrl = input.resourceUrl?.trim()
  if (resourceUrl) {
    return {
      href: resourceUrl,
      scrollToForm: false,
      hideCta: false,
      mode: 'resource',
    }
  }

  // Safe default already used by presentation: scroll to contact form.
  return {
    href: undefined,
    scrollToForm: true,
    hideCta: false,
    mode: 'form',
  }
}
