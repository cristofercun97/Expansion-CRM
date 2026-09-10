/**
 * Public presentation booking — slot math (absolute timestamps + timezone).
 * No private meeting fields in outputs.
 */
export const BOOKING_DURATION_MINUTES = 30;
export const BOOKING_SLOT_INTERVAL_MINUTES = 30;
export const BOOKING_MAX_ADVANCE_DAYS = 31;
export const BOOKING_PRIVACY_VERSION = "presentation_booking_v1";

export type BusyInterval = {
  startMs: number;
  endMs: number;
};

export type BookingWindows = {
  weekdays: number[]; // 1=Mon … 7=Sun (ISO)
  startHour: number;
  endHour: number;
};

export type BookingConfig = {
  enabled: boolean;
  durationMinutes: number;
  timezone: string;
  title: string;
  description: string;
  googleMeet: boolean;
  windows: BookingWindows;
};

export const DEFAULT_BOOKING_WINDOWS: BookingWindows = {
  weekdays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 18,
};

export function mapBookingConfig(raw: unknown): BookingConfig {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const windowsRaw =
    data.windows && typeof data.windows === "object"
      ? (data.windows as Record<string, unknown>)
      : {};
  const weekdays = Array.isArray(windowsRaw.weekdays)
    ? windowsRaw.weekdays
        .map((item) => Number(item))
        .filter((item) => item >= 1 && item <= 7)
    : DEFAULT_BOOKING_WINDOWS.weekdays;

  return {
    enabled: data.enabled === true,
    durationMinutes:
      Number(data.durationMinutes) > 0
        ? Math.min(120, Math.floor(Number(data.durationMinutes)))
        : BOOKING_DURATION_MINUTES,
    timezone:
      typeof data.timezone === "string" && data.timezone.trim()
        ? data.timezone.trim()
        : "Europe/Madrid",
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim().slice(0, 120)
        : "Conversemos 30 minutos sobre tu próximo paso",
    description:
      typeof data.description === "string" ? data.description.trim().slice(0, 500) : "",
    googleMeet: data.googleMeet === true,
    windows: {
      weekdays: weekdays.length ? weekdays : DEFAULT_BOOKING_WINDOWS.weekdays,
      startHour: clampHour(windowsRaw.startHour, DEFAULT_BOOKING_WINDOWS.startHour),
      endHour: clampHour(windowsRaw.endHour, DEFAULT_BOOKING_WINDOWS.endHour),
    },
  };
}

function clampHour(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(23, Math.max(0, Math.floor(n)));
}

/** Parts of an instant in a timezone. */
export function zonedParts(
  date: Date,
  timeZone: string,
): {year: number; month: number; day: number; hour: number; minute: number; weekday: number} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday] || 1,
  };
}

export function formatDateKey(parts: {year: number; month: number; day: number}): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatTimeLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Build a Date for a local wall time in `timeZone` (approx via binary search on UTC).
 */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let low = Date.UTC(year, month - 1, day, hour, minute) - 14 * 3600_000;
  let high = Date.UTC(year, month - 1, day, hour, minute) + 14 * 3600_000;
  for (let i = 0; i < 40; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const parts = zonedParts(new Date(mid), timeZone);
    const cmp =
      parts.year !== year
        ? parts.year - year
        : parts.month !== month
          ? parts.month - month
          : parts.day !== day
            ? parts.day - day
            : parts.hour !== hour
              ? parts.hour - hour
              : parts.minute - minute;
    if (cmp === 0) return new Date(mid);
    if (cmp < 0) low = mid + 1;
    else high = mid - 1;
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isSlotFree(
  startMs: number,
  endMs: number,
  busy: BusyInterval[],
): boolean {
  return !busy.some((item) => intervalsOverlap(startMs, endMs, item.startMs, item.endMs));
}

export type AvailabilityResult = {
  timezone: string;
  durationMinutes: number;
  dates: Record<string, string[]>;
};

export function computePublicAvailability(input: {
  nowMs: number;
  rangeStartDateKey: string;
  rangeEndDateKey: string;
  config: BookingConfig;
  busy: BusyInterval[];
}): AvailabilityResult {
  const {config, busy, nowMs} = input;
  const duration = config.durationMinutes || BOOKING_DURATION_MINUTES;
  const interval = BOOKING_SLOT_INTERVAL_MINUTES;
  const dates: Record<string, string[]> = {};

  const startParts = parseDateKey(input.rangeStartDateKey);
  const endParts = parseDateKey(input.rangeEndDateKey);
  if (!startParts || !endParts) {
    return {timezone: config.timezone, durationMinutes: duration, dates: {}};
  }

  let cursor = zonedLocalToUtc(
    startParts.year,
    startParts.month,
    startParts.day,
    12,
    0,
    config.timezone,
  );
  const endLimit = zonedLocalToUtc(
    endParts.year,
    endParts.month,
    endParts.day,
    23,
    59,
    config.timezone,
  );

  for (let dayIndex = 0; dayIndex < BOOKING_MAX_ADVANCE_DAYS + 2; dayIndex += 1) {
    const noonParts = zonedParts(cursor, config.timezone);
    const dateKey = formatDateKey(noonParts);
    if (dateKey > input.rangeEndDateKey) break;

    if (config.windows.weekdays.includes(noonParts.weekday)) {
      const slots: string[] = [];
      for (
        let minuteOfDay = config.windows.startHour * 60;
        minuteOfDay + duration <= config.windows.endHour * 60;
        minuteOfDay += interval
      ) {
        const hour = Math.floor(minuteOfDay / 60);
        const minute = minuteOfDay % 60;
        const start = zonedLocalToUtc(
          noonParts.year,
          noonParts.month,
          noonParts.day,
          hour,
          minute,
          config.timezone,
        );
        const endMs = start.getTime() + duration * 60_000;
        if (start.getTime() <= nowMs) continue;
        if (!isSlotFree(start.getTime(), endMs, busy)) continue;
        slots.push(formatTimeLabel(hour, minute));
      }
      if (slots.length) dates[dateKey] = slots;
    }

    cursor = new Date(cursor.getTime() + 24 * 3600_000);
    if (cursor.getTime() > endLimit.getTime() + 24 * 3600_000) break;
  }

  return {
    timezone: config.timezone,
    durationMinutes: duration,
    dates,
  };
}

export function parseDateKey(
  value: string,
): {year: number; month: number; day: number} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function resolveSlotStartMs(
  dateKey: string,
  timeLabel: string,
  timeZone: string,
): number | null {
  const dateParts = parseDateKey(dateKey);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeLabel.trim());
  if (!dateParts || !timeMatch) return null;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;
  return zonedLocalToUtc(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    hour,
    minute,
    timeZone,
  ).getTime();
}

export function buildLockId(organizerId: string, startMs: number): string {
  return `${organizerId}_${startMs}`;
}

export function daySpanInclusive(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return Number.POSITIVE_INFINITY;
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.floor((b - a) / 86400000) + 1;
}
