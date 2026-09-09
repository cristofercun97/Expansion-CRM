/**
 * Pure recurrence helpers for Agenda Fase 3B (no Firestore I/O).
 */

export const RECURRENCE_MAX_OCCURRENCES = 52;

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";
export type RecurrenceEndMode = "count" | "until";
export type RecurrenceEditScope = "this" | "this_and_future";

export type RecurrenceRuleInput = {
  frequency: RecurrenceFrequency;
  seriesStartAtMs: number;
  endMode: RecurrenceEndMode;
  count?: number;
  untilAtMs?: number;
};

export type OccurrenceStart = {
  index: number;
  startAtMs: number;
};

const DAY_MS = 24 * 60 * 60_000;

export function isActiveSeriesStatus(status: string | undefined): boolean {
  return status === "scheduled" || status === "rescheduled";
}

export function isTerminalSeriesStatus(status: string | undefined): boolean {
  return status === "completed" || status === "cancelled" || status === "no_show";
}

export function addCalendarMonthsPreservingAnchorDay(
  base: Date,
  monthsToAdd: number,
  anchorDay: number,
): Date {
  const hours = base.getHours();
  const minutes = base.getMinutes();
  const seconds = base.getSeconds();
  const ms = base.getMilliseconds();
  const year = base.getFullYear();
  const month = base.getMonth() + monthsToAdd;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(anchorDay, lastDay);
  return new Date(year, month, day, hours, minutes, seconds, ms);
}

export function occurrenceStartAtMs(
  seriesStartAtMs: number,
  frequency: RecurrenceFrequency,
  index: number,
): number {
  if (index < 0) {
    throw new Error("INVALID_INDEX");
  }
  const seriesStart = new Date(seriesStartAtMs);
  if (Number.isNaN(seriesStart.getTime())) {
    throw new Error("INVALID_SERIES_START");
  }

  if (frequency === "weekly") {
    return seriesStartAtMs + index * 7 * DAY_MS;
  }
  if (frequency === "biweekly") {
    return seriesStartAtMs + index * 14 * DAY_MS;
  }

  const anchorDay = seriesStart.getDate();
  return addCalendarMonthsPreservingAnchorDay(seriesStart, index, anchorDay).getTime();
}

export function expandRecurrenceStarts(rule: RecurrenceRuleInput): OccurrenceStart[] {
  const frequency = rule.frequency;
  const seriesStartAtMs = rule.seriesStartAtMs;
  if (!Number.isFinite(seriesStartAtMs)) {
    throw new Error("INVALID_SERIES_START");
  }
  if (frequency !== "weekly" && frequency !== "biweekly" && frequency !== "monthly") {
    throw new Error("INVALID_FREQUENCY");
  }

  const starts: OccurrenceStart[] = [];

  if (rule.endMode === "count") {
    const count = Number(rule.count);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("INVALID_COUNT");
    }
    if (count > RECURRENCE_MAX_OCCURRENCES) {
      throw new Error("MAX_OCCURRENCES_EXCEEDED");
    }
    for (let index = 0; index < count; index += 1) {
      starts.push({
        index,
        startAtMs: occurrenceStartAtMs(seriesStartAtMs, frequency, index),
      });
    }
    return starts;
  }

  if (rule.endMode === "until") {
    const untilAtMs = Number(rule.untilAtMs);
    if (!Number.isFinite(untilAtMs) || untilAtMs < seriesStartAtMs) {
      throw new Error("INVALID_UNTIL");
    }
    for (let index = 0; index < RECURRENCE_MAX_OCCURRENCES + 1; index += 1) {
      const startAtMs = occurrenceStartAtMs(seriesStartAtMs, frequency, index);
      if (startAtMs > untilAtMs) {
        break;
      }
      starts.push({index, startAtMs});
      if (starts.length > RECURRENCE_MAX_OCCURRENCES) {
        throw new Error("MAX_OCCURRENCES_EXCEEDED");
      }
    }
    if (starts.length === 0) {
      throw new Error("EMPTY_SERIES");
    }
    return starts;
  }

  throw new Error("INVALID_END_MODE");
}

export function buildOccurrenceMeetingId(seriesId: string, index: number): string {
  const id = seriesId.trim();
  if (!id) throw new Error("INVALID_SERIES_ID");
  if (!Number.isInteger(index) || index < 0) throw new Error("INVALID_INDEX");
  return `${id}_${index}`;
}

export function assertValidClientRequestId(clientRequestId: string): string {
  const id = clientRequestId.trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    throw new Error("INVALID_CLIENT_REQUEST_ID");
  }
  return id;
}

export function applyStartDelta(options: {
  previousStartAtMs: number;
  nextStartAtMs: number;
  targetStartAtMs: number;
}): number {
  const delta = options.nextStartAtMs - options.previousStartAtMs;
  return options.targetStartAtMs + delta;
}

export function filterEditableSeriesOccurrences<T extends {
  recurrenceIndex?: number;
  status?: string;
  startAtMs?: number;
}>(options: {
  occurrences: T[];
  fromIndex: number;
  scope: RecurrenceEditScope;
}): T[] {
  const fromIndex = options.fromIndex;
  return options.occurrences.filter((item) => {
    const index = typeof item.recurrenceIndex === "number" ? item.recurrenceIndex : -1;
    if (index < 0) return false;
    if (options.scope === "this") {
      return index === fromIndex && isActiveSeriesStatus(item.status);
    }
    return index >= fromIndex && isActiveSeriesStatus(item.status);
  });
}

export function assertCanModifySeries(options: {
  uid: string;
  organizerId: string;
  isAdmin?: boolean;
}): void {
  const uid = options.uid.trim();
  if (!uid) throw new Error("UNAUTHENTICATED");
  if (options.isAdmin) return;
  if (options.organizerId.trim() !== uid) {
    throw new Error("PERMISSION_DENIED");
  }
}

export function countConflictingOccurrenceStarts(options: {
  occurrenceStarts: Array<{startAtMs: number; endAtMs: number}>;
  busyIntervals: Array<{startAtMs: number; endAtMs: number}>;
}): number {
  let count = 0;
  for (const occurrence of options.occurrenceStarts) {
    const hits = options.busyIntervals.some(
      (busy) =>
        occurrence.startAtMs < busy.endAtMs && occurrence.endAtMs > busy.startAtMs,
    );
    if (hits) count += 1;
  }
  return count;
}

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Cada 2 semanas",
  monthly: "Mensual",
};
