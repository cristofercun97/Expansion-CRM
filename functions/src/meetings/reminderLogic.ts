/**
 * Pure meeting reminder scheduling helpers (no I/O).
 * scheduledFor is always absolute UTC ms derived from startAt.
 */

export type MeetingReminderType = "24h" | "1h" | "10m";

export type ReminderSlot = {
  reminderType: MeetingReminderType;
  scheduledForMs: number;
  offsetMs: number;
};

export const REMINDER_OFFSETS_MS: Record<MeetingReminderType, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "10m": 10 * 60 * 1000,
};

export const REMINDER_TYPES_ORDER: MeetingReminderType[] = ["24h", "1h", "10m"];

/** Build future-only reminder slots for a meeting start time. */
export function computeReminderSlots(options: {
  meetingStartAtMs: number;
  nowMs: number;
}): ReminderSlot[] {
  const {meetingStartAtMs, nowMs} = options;
  const slots: ReminderSlot[] = [];

  for (const reminderType of REMINDER_TYPES_ORDER) {
    const offsetMs = REMINDER_OFFSETS_MS[reminderType];
    const scheduledForMs = meetingStartAtMs - offsetMs;
    if (scheduledForMs > nowMs) {
      slots.push({reminderType, scheduledForMs, offsetMs});
    }
  }

  return slots;
}

export function buildReminderDedupeKey(options: {
  meetingId: string;
  recipientUid: string;
  reminderType: MeetingReminderType;
  meetingStartAtMs: number;
}): string {
  return [
    options.meetingId.trim(),
    options.recipientUid.trim(),
    options.reminderType,
    String(options.meetingStartAtMs),
  ].join("_");
}

/** Unique internal recipients: organizer + participants, no duplicates. */
export function resolveReminderRecipients(options: {
  organizerId: string;
  participantUserIds: string[];
}): string[] {
  const ids = new Set<string>();
  const organizer = options.organizerId.trim();
  if (organizer) {
    ids.add(organizer);
  }
  for (const uid of options.participantUserIds || []) {
    const normalized = uid.trim();
    if (normalized) {
      ids.add(normalized);
    }
  }
  return [...ids].sort();
}

export function shouldSuppressReminders(status: string | undefined | null): boolean {
  return status === "cancelled" || status === "completed" || status === "no_show";
}

export function formatReminderCopy(options: {
  reminderType: MeetingReminderType;
  title: string;
  timeLabel: string;
}): {title: string; message: string} {
  const meetingTitle = options.title.trim() || "Reunión";
  if (options.reminderType === "24h") {
    return {
      title: "Tu reunión es mañana",
      message: `${meetingTitle} · ${options.timeLabel}`,
    };
  }
  if (options.reminderType === "1h") {
    return {
      title: "Tu reunión comienza en 1 hora",
      message: `${meetingTitle} · ${options.timeLabel}`,
    };
  }
  return {
    title: "Tu reunión comienza en 10 minutos",
    message: `${meetingTitle} · ${options.timeLabel}`,
  };
}

export type NotificationType =
  | "meeting_reminder"
  | "meeting_invitation"
  | "meeting_rescheduled"
  | "meeting_cancelled"
  | "meeting_result_pending"
  | "public_booking_created";

export function buildNotificationDedupeKey(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join("_");
}
