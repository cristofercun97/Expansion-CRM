import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {
  buildNotificationDedupeKey,
  buildReminderDedupeKey,
  computeReminderSlots,
  formatReminderCopy,
  resolveReminderRecipients,
  shouldSuppressReminders,
  type MeetingReminderType,
  type NotificationType,
} from "./reminderLogic.js";

const DATABASE_ID = "default";
const REMINDER_BATCH_LIMIT = 80;
const SCHEDULER_TOLERANCE = "±5 minutes (cron every 5 minutes)";

type MeetingDoc = {
  title?: string;
  status?: string;
  startAt?: Timestamp;
  endAt?: Timestamp;
  organizerId?: string;
  organizerName?: string;
  participantUserIds?: string[];
  contactId?: string | null;
  meetingUrl?: string | null;
  googleMeetUrl?: string | null;
  timezone?: string;
  updatedBy?: string;
  nextActionTaskId?: string | null;
};

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    const fn = (value as {toMillis?: () => number}).toMillis;
    if (typeof fn === "function") return fn.call(value);
  }
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return Number((value as {_seconds: number})._seconds) * 1000;
  }
  return null;
}

function formatTimeLabel(startAtMs: number, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZone?.trim() || "UTC",
    }).format(new Date(startAtMs));
  } catch {
    return new Date(startAtMs).toISOString();
  }
}

function agendaActionUrl(meetingId: string): string {
  return `/dashboard/agenda?meetingId=${encodeURIComponent(meetingId)}`;
}

async function createNotification(options: {
  dedupeKey: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  meetingId: string;
  actionUrl: string;
  actionLabel: string;
}): Promise<"created" | "exists"> {
  const ref = getDefaultFirestore().collection(COLLECTIONS.notifications).doc(options.dedupeKey);
  try {
    await ref.create({
      recipientUid: options.recipientUid,
      type: options.type,
      title: options.title,
      message: options.message,
      meetingId: options.meetingId,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
      dedupeKey: options.dedupeKey,
    });
    return "created";
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ?
      Number((error as {code?: number}).code) :
      0;
    // Already exists (idempotent)
    if (code === 6) {
      return "exists";
    }
    throw error;
  }
}

async function cancelPendingReminders(
  meetingId: string,
  options?: {recipientUid?: string; onlyMismatchedStartAtMs?: number},
): Promise<number> {
  const db = getDefaultFirestore();
  let query = db
    .collection(COLLECTIONS.meetingReminders)
    .where("meetingId", "==", meetingId)
    .where("status", "==", "pending");

  if (options?.recipientUid) {
    query = query.where("recipientUid", "==", options.recipientUid);
  }

  const snap = await query.limit(400).get();
  let cancelled = 0;
  const batch = db.batch();
  let ops = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (typeof options?.onlyMismatchedStartAtMs === "number") {
      const snapshotMs = toMillis(data.meetingStartAtSnapshot);
      if (snapshotMs === options.onlyMismatchedStartAtMs) {
        continue;
      }
    }
    batch.update(docSnap.ref, {
      status: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    cancelled += 1;
    ops += 1;
    if (ops >= 400) break;
  }

  if (ops > 0) {
    await batch.commit();
  }
  return cancelled;
}

export async function syncMeetingRemindersForMeeting(
  meetingId: string,
  meeting: MeetingDoc,
  nowMs = Date.now(),
): Promise<{created: number; cancelled: number}> {
  if (shouldSuppressReminders(meeting.status)) {
    const cancelled = await cancelPendingReminders(meetingId);
    return {created: 0, cancelled};
  }

  if (meeting.status !== "scheduled" && meeting.status !== "rescheduled") {
    return {created: 0, cancelled: 0};
  }

  const startAtMs = toMillis(meeting.startAt);
  if (!startAtMs) {
    logger.warn("syncMeetingReminders: missing startAt", {meetingId});
    return {created: 0, cancelled: 0};
  }

  const organizerId = meeting.organizerId?.trim() || "";
  if (!organizerId) {
    return {created: 0, cancelled: 0};
  }

  const cancelled = await cancelPendingReminders(meetingId, {
    onlyMismatchedStartAtMs: startAtMs,
  });

  const recipients = resolveReminderRecipients({
    organizerId,
    participantUserIds: Array.isArray(meeting.participantUserIds) ?
      meeting.participantUserIds :
      [],
  });
  const slots = computeReminderSlots({meetingStartAtMs: startAtMs, nowMs});
  const db = getDefaultFirestore();
  let created = 0;

  for (const recipientUid of recipients) {
    for (const slot of slots) {
      const dedupeKey = buildReminderDedupeKey({
        meetingId,
        recipientUid,
        reminderType: slot.reminderType,
        meetingStartAtMs: startAtMs,
      });
      const ref = db.collection(COLLECTIONS.meetingReminders).doc(dedupeKey);
      try {
        await ref.create({
          meetingId,
          recipientUid,
          reminderType: slot.reminderType,
          scheduledFor: Timestamp.fromMillis(slot.scheduledForMs),
          status: "pending",
          meetingStartAtSnapshot: Timestamp.fromMillis(startAtMs),
          dedupeKey,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          deliveredAt: null,
          cancelledAt: null,
          failedAt: null,
          failureReason: null,
        });
        created += 1;
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ?
          Number((error as {code?: number}).code) :
          0;
        if (code !== 6) {
          throw error;
        }
      }
    }
  }

  logger.info("syncMeetingReminders", {
    meetingId,
    created,
    cancelled,
    slots: slots.map((s) => s.reminderType),
    recipients: recipients.length,
  });

  return {created, cancelled};
}

async function notifyParticipants(options: {
  meetingId: string;
  meeting: MeetingDoc;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel: string;
  excludeUid?: string;
  startAtMs: number;
  suffix: string;
}): Promise<void> {
  const recipients = resolveReminderRecipients({
    organizerId: options.meeting.organizerId || "",
    participantUserIds: Array.isArray(options.meeting.participantUserIds) ?
      options.meeting.participantUserIds :
      [],
  }).filter((uid) => uid !== options.excludeUid);

  for (const recipientUid of recipients) {
    const dedupeKey = buildNotificationDedupeKey([
      options.type,
      options.meetingId,
      recipientUid,
      options.suffix,
    ]);
    await createNotification({
      dedupeKey,
      recipientUid,
      type: options.type,
      title: options.title,
      message: options.message,
      meetingId: options.meetingId,
      actionUrl: agendaActionUrl(options.meetingId),
      actionLabel: options.actionLabel,
    });
  }
}

async function handleMeetingLifecycleNotifications(
  meetingId: string,
  before: MeetingDoc | null,
  after: MeetingDoc | null,
): Promise<void> {
  if (!after) {
    return;
  }

  const afterStartMs = toMillis(after.startAt) || 0;
  const timeLabel = formatTimeLabel(afterStartMs, after.timezone);
  const title = after.title?.trim() || "Reunión";
  const organizerName = after.organizerName?.trim() || "Organizador";

  // Create
  if (!before) {
    const participants = Array.isArray(after.participantUserIds) ? after.participantUserIds : [];
    for (const uid of participants) {
      if (!uid || uid === after.organizerId) continue;
      await createNotification({
        dedupeKey: buildNotificationDedupeKey([
          "meeting_invitation",
          meetingId,
          uid,
          String(afterStartMs),
        ]),
        recipientUid: uid,
        type: "meeting_invitation",
        title: "Te han invitado a una reunión",
        message: `${title} · ${organizerName} · ${timeLabel}`,
        meetingId,
        actionUrl: agendaActionUrl(meetingId),
        actionLabel: "Ver reunión",
      });
    }
    return;
  }

  // Cancelled
  if (before.status !== "cancelled" && after.status === "cancelled") {
    const prevStart = toMillis(before.startAt) || afterStartMs;
    await notifyParticipants({
      meetingId,
      meeting: after,
      type: "meeting_cancelled",
      title: "Reunión cancelada",
      message: `${title} · ${formatTimeLabel(prevStart, before.timezone || after.timezone)} · ${organizerName}`,
      actionLabel: "Ver reunión",
      excludeUid: after.updatedBy,
      startAtMs: prevStart,
      suffix: `cancel_${prevStart}`,
    });
    return;
  }

  // Reschedule (startAt change while still active)
  const beforeStart = toMillis(before.startAt);
  if (
    beforeStart &&
    afterStartMs &&
    beforeStart !== afterStartMs &&
    !shouldSuppressReminders(after.status)
  ) {
    await notifyParticipants({
      meetingId,
      meeting: after,
      type: "meeting_rescheduled",
      title: "Tu reunión ha sido reprogramada",
      message: `${title} · nueva hora: ${timeLabel}`,
      actionLabel: "Ver reunión",
      excludeUid: after.updatedBy,
      startAtMs: afterStartMs,
      suffix: `reschedule_${afterStartMs}`,
    });
  }

  // Participants added
  const beforeSet = new Set(
    (Array.isArray(before.participantUserIds) ? before.participantUserIds : [])
      .map((uid) => uid.trim())
      .filter(Boolean),
  );
  const afterList = (Array.isArray(after.participantUserIds) ? after.participantUserIds : [])
    .map((uid) => uid.trim())
    .filter(Boolean);

  for (const uid of afterList) {
    if (beforeSet.has(uid) || uid === after.organizerId) continue;
    await createNotification({
      dedupeKey: buildNotificationDedupeKey([
        "meeting_invitation",
        meetingId,
        uid,
        String(afterStartMs),
      ]),
      recipientUid: uid,
      type: "meeting_invitation",
      title: "Te han invitado a una reunión",
      message: `${title} · ${organizerName} · ${timeLabel}`,
      meetingId,
      actionUrl: agendaActionUrl(meetingId),
      actionLabel: "Ver reunión",
    });
  }

  // Participants removed → cancel their pending reminders
  const afterSet = new Set(afterList);
  for (const uid of beforeSet) {
    if (!afterSet.has(uid)) {
      await cancelPendingReminders(meetingId, {recipientUid: uid});
    }
  }
}

export const onMeetingWrittenSyncAgenda = onDocumentWritten(
  {
    document: "meetings/{meetingId}",
    database: DATABASE_ID,
    region: "europe-west1",
  },
  async (event) => {
    const meetingId = event.params.meetingId;
    const before = event.data?.before.exists ?
      (event.data.before.data() as MeetingDoc) :
      null;
    const after = event.data?.after.exists ?
      (event.data.after.data() as MeetingDoc) :
      null;

    if (!after) {
      return;
    }

    try {
      await syncMeetingRemindersForMeeting(meetingId, after);
      await handleMeetingLifecycleNotifications(meetingId, before, after);
    } catch (error) {
      logger.error("onMeetingWrittenSyncAgenda failed", {
        meetingId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);

export const processMeetingReminders = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "europe-west1",
    timeZone: "UTC",
  },
  async () => {
    const db = getDefaultFirestore();
    const now = Timestamp.now();
    const snap = await db
      .collection(COLLECTIONS.meetingReminders)
      .where("status", "==", "pending")
      .where("scheduledFor", "<=", now)
      .orderBy("scheduledFor", "asc")
      .limit(REMINDER_BATCH_LIMIT)
      .get();

    logger.info("processMeetingReminders batch", {
      size: snap.size,
      tolerance: SCHEDULER_TOLERANCE,
    });

    for (const reminderDoc of snap.docs) {
      const reminderId = reminderDoc.id;
      try {
        await db.runTransaction(async (tx) => {
          const fresh = await tx.get(reminderDoc.ref);
          if (!fresh.exists) return;
          const data = fresh.data() || {};
          if (data.status !== "pending") return;

          const meetingId = String(data.meetingId || "");
          const recipientUid = String(data.recipientUid || "");
          const reminderType = data.reminderType as MeetingReminderType;
          if (!meetingId || !recipientUid || !reminderType) {
            tx.update(reminderDoc.ref, {
              status: "failed",
              failedAt: FieldValue.serverTimestamp(),
              failureReason: "invalid_reminder_fields",
              updatedAt: FieldValue.serverTimestamp(),
            });
            return;
          }

          const meetingRef = db.collection(COLLECTIONS.meetings).doc(meetingId);
          const meetingSnap = await tx.get(meetingRef);
          if (!meetingSnap.exists) {
            tx.update(reminderDoc.ref, {
              status: "cancelled",
              cancelledAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            return;
          }

          const meeting = meetingSnap.data() as MeetingDoc;
          if (shouldSuppressReminders(meeting.status)) {
            tx.update(reminderDoc.ref, {
              status: "skipped",
              updatedAt: FieldValue.serverTimestamp(),
            });
            return;
          }

          const startAtMs = toMillis(meeting.startAt) || toMillis(data.meetingStartAtSnapshot) || 0;
          const timeLabel = formatTimeLabel(startAtMs, meeting.timezone);
          const copy = formatReminderCopy({
            reminderType,
            title: meeting.title || "Reunión",
            timeLabel,
          });
          const joinUrl = meeting.meetingUrl || meeting.googleMeetUrl || null;
          const actionLabel = joinUrl ? "Entrar a la reunión" : "Ver reunión";
          const actionUrl = joinUrl || agendaActionUrl(meetingId);
          const notifId = buildNotificationDedupeKey([
            "meeting_reminder",
            reminderId,
          ]);
          const notifRef = db.collection(COLLECTIONS.notifications).doc(notifId);
          const existingNotif = await tx.get(notifRef);
          if (!existingNotif.exists) {
            tx.create(notifRef, {
              recipientUid,
              type: "meeting_reminder",
              title: copy.title,
              message: copy.message,
              meetingId,
              actionUrl,
              actionLabel,
              read: false,
              createdAt: FieldValue.serverTimestamp(),
              readAt: null,
              dedupeKey: notifId,
              reminderType,
            });
          }

          tx.update(reminderDoc.ref, {
            status: "delivered",
            deliveredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        logger.info("reminder delivered", {meetingId: reminderDoc.data().meetingId, reminderId, type: reminderDoc.data().reminderType});
      } catch (error) {
        logger.error("reminder processing failed", {
          reminderId,
          meetingId: reminderDoc.data().meetingId,
          type: reminderDoc.data().reminderType,
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          await reminderDoc.ref.update({
            status: "failed",
            failedAt: FieldValue.serverTimestamp(),
            failureReason: error instanceof Error ? error.message : "unknown",
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch {
          // leave for retry if update also fails
        }
      }
    }
  },
);

export const createMeetingNextAction = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request);
  const data = request.data as {
    meetingId?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    idempotencyKey?: string;
  };

  const meetingId = data.meetingId?.trim();
  const title = data.title?.trim() || "";
  const description = data.description?.trim() || "";
  const dueDate = data.dueDate?.trim() || "";
  const idempotencyKey = data.idempotencyKey?.trim() || "";

  if (!meetingId) {
    throw new HttpsError("invalid-argument", "Falta el ID de la reunión.");
  }
  if (title.length < 3 || title.length > 200) {
    throw new HttpsError("invalid-argument", "El título debe tener entre 3 y 200 caracteres.");
  }
  if (description.length > 300) {
    throw new HttpsError("invalid-argument", "La descripción no puede superar 300 caracteres.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new HttpsError("invalid-argument", "La fecha límite debe ser YYYY-MM-DD.");
  }

  const db = getDefaultFirestore();
  const meetingRef = db.collection(COLLECTIONS.meetings).doc(meetingId);
  const lockId = idempotencyKey || `${meetingId}_${uid}`;
  const lockRef = db.collection(COLLECTIONS.meetingNextActionLocks).doc(lockId);

  return db.runTransaction(async (tx) => {
    const meetingSnap = await tx.get(meetingRef);
    if (!meetingSnap.exists) {
      throw new HttpsError("not-found", "No encontramos la reunión.");
    }
    const meeting = meetingSnap.data() as MeetingDoc;
    if (meeting.organizerId !== uid) {
      throw new HttpsError("permission-denied", "Solo el organizador puede crear la próxima acción.");
    }
    if (meeting.status !== "completed") {
      throw new HttpsError(
        "failed-precondition",
        "Solo puedes crear una próxima acción tras marcar la reunión como realizada.",
      );
    }

    if (typeof meeting.nextActionTaskId === "string" && meeting.nextActionTaskId) {
      return {taskId: meeting.nextActionTaskId, reused: true};
    }

    const lockSnap = await tx.get(lockRef);
    if (lockSnap.exists) {
      const existingTaskId = lockSnap.data()?.taskId;
      if (typeof existingTaskId === "string" && existingTaskId) {
        return {taskId: existingTaskId, reused: true};
      }
    }

    const taskRef = db.collection(COLLECTIONS.actionTasks).doc();
    const contactId =
      typeof meeting.contactId === "string" && meeting.contactId.trim() ?
        meeting.contactId.trim() :
        null;

    const taskPayload: Record<string, unknown> = {
      ownerUid: uid,
      title,
      description,
      status: "pending",
      priority: "medium",
      dueDate,
      startDate: "",
      source: "agenda",
      sourceMeetingId: meetingId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (contactId) {
      taskPayload.contactId = contactId;
    }
    tx.set(taskRef, taskPayload);

    tx.update(meetingRef, {
      nextActionTaskId: taskRef.id,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    tx.set(lockRef, {
      meetingId,
      organizerId: uid,
      taskId: taskRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (contactId) {
      const activityRef = db.collection(COLLECTIONS.leadActivities).doc();
      tx.set(activityRef, {
        prospectId: contactId,
        leaderId: uid,
        type: "task",
        description: `Próxima acción: ${title}`,
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        eventKind: "next_action_created",
        meetingId,
        taskId: taskRef.id,
      });
    }

    return {taskId: taskRef.id, reused: false};
  });
});
