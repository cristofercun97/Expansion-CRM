/**
 * Public booking rate limits — protect abuse without blocking human navigation.
 *
 * Availability and create use separate buckets so calendar polling cannot
 * exhaust booking-creation quota (and vice versa).
 */

export type BookingRateKind = "availability" | "create" | "funnel";

/** Availability: generous hourly window for open / month nav / reload / retry. */
export const AVAILABILITY_RATE_LIMIT = 60;
export const AVAILABILITY_WINDOW_LABEL = "hour";

/** Create: stricter daily cap against spam bookings. */
export const CREATE_RATE_LIMIT = 30;
export const CREATE_WINDOW_LABEL = "day";

/** Funnel tracking: separate bucket so analytics never starve availability. */
export const FUNNEL_RATE_LIMIT = 120;
export const FUNNEL_WINDOW_LABEL = "hour";

export function rateLimitForKind(kind: BookingRateKind): number {
  if (kind === "availability") return AVAILABILITY_RATE_LIMIT;
  if (kind === "create") return CREATE_RATE_LIMIT;
  return FUNNEL_RATE_LIMIT;
}

/**
 * Document id for the rate-limit counter.
 * Availability/funnel buckets by UTC hour; create by UTC day.
 */
export function rateLimitDocId(
  fingerprintKey: string,
  kind: BookingRateKind,
  nowMs: number = Date.now(),
): string {
  const iso = new Date(nowMs).toISOString();
  if (kind === "availability") {
    return `${fingerprintKey}_avail_${iso.slice(0, 13)}`;
  }
  if (kind === "funnel") {
    return `${fingerprintKey}_funnel_${iso.slice(0, 13)}`;
  }
  return `${fingerprintKey}_create_${iso.slice(0, 10)}`;
}

export function isRateLimitExceeded(count: number, kind: BookingRateKind): boolean {
  return count >= rateLimitForKind(kind);
}

/**
 * Approximate capacity for a normal booking session (open + month changes +
 * date picks that refetch + a few reloads). Used by tests as a sanity bound.
 */
export function normalBookingFlowRequestBudget(): number {
  // open(1) + next month(1) + prev month(1) + select/refetch(2) + reloads(3) = 8
  return 8;
}

/** Next window boundary after which a fresh bucket allows traffic again. */
export function nextRateLimitWindowMs(kind: BookingRateKind, nowMs: number = Date.now()): number {
  if (kind === "availability" || kind === "funnel") {
    const d = new Date(nowMs);
    d.setUTCMinutes(0, 0, 0);
    d.setUTCHours(d.getUTCHours() + 1);
    return d.getTime();
  }
  const d = new Date(nowMs);
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}
