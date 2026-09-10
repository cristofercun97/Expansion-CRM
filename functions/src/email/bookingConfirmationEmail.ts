/**
 * Idempotent booking confirmation email side-effect.
 * Never throws to callers in a way that should abort booking — wrap at call site.
 */

import {FieldValue} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {
  BOOKING_CONFIRMATION_SUBJECT,
  assertConfirmationEmailSafe,
  buildBookingConfirmationHtml,
  buildBookingConfirmationText,
  formatBookingEmailDate,
} from "./bookingConfirmationContent.js";
import {sendViaResend} from "./resendMailer.js";

export const resendApiKey = defineSecret("RESEND_API_KEY");
export const emailFromAddress = defineSecret("EMAIL_FROM");

const MAX_ATTEMPTS = 3;

export type EnsureBookingConfirmationEmailInput = {
  bookingId: string;
  recipientEmail: string;
  firstName: string;
  professionalName: string;
  brandName: string | null;
  dateKey: string;
  timeLabel: string;
  durationMinutes: number;
  timezone: string;
};

export type EnsureBookingConfirmationEmailResult =
  | "sent"
  | "skipped_already_sent"
  | "failed"
  | "blocked_missing_secret";

function alreadyExistsError(error: unknown): boolean {
  const code =
    typeof error === "object" && error && "code" in error ?
      Number((error as {code?: number}).code) :
      0;
  return code === 6;
}

/**
 * Send at most one confirmation email per bookingId.
 * Safe on createPublicBooking retries / success-page refresh (no frontend send).
 */
export async function ensureBookingConfirmationEmail(
  input: EnsureBookingConfirmationEmailInput,
): Promise<EnsureBookingConfirmationEmailResult> {
  const db = getDefaultFirestore();
  const ref = db.collection(COLLECTIONS.bookingEmailDeliveries).doc(input.bookingId);

  try {
    await ref.create({
      bookingId: input.bookingId,
      status: "pending",
      attempts: 0,
      provider: "resend",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      sentAt: null,
      lastError: null,
    });
  } catch (error) {
    if (!alreadyExistsError(error)) throw error;
    const existing = await ref.get();
    const data = existing.data() || {};
    if (data.status === "sent") return "skipped_already_sent";
    const attempts = Number(data.attempts || 0);
    if (attempts >= MAX_ATTEMPTS) return "failed";
  }

  const apiKey = resendApiKey.value().trim();
  const from = emailFromAddress.value().trim() || "EXPANSIÓN <onboarding@resend.dev>";
  if (!apiKey) {
    await ref.set(
      {
        status: "failed",
        lastError: "missing_resend_api_key",
        attempts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    console.info("[booking-email]", {
      bookingId: input.bookingId,
      status: "blocked_missing_secret",
    });
    return "blocked_missing_secret";
  }

  const dateLabel = formatBookingEmailDate(input.dateKey, input.timezone);
  const contentInput = {
    firstName: input.firstName,
    professionalName: input.professionalName,
    brandName: input.brandName,
    dateLabel,
    timeLabel: input.timeLabel,
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
  };
  const html = buildBookingConfirmationHtml(contentInput);
  const text = buildBookingConfirmationText(contentInput);
  assertConfirmationEmailSafe(html, text);

  await ref.set(
    {
      attempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );

  const result = await sendViaResend({
    to: input.recipientEmail,
    subject: BOOKING_CONFIRMATION_SUBJECT,
    html,
    text,
    from,
    apiKey,
  });

  if (result.ok) {
    await ref.set(
      {
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        providerMessageId: result.providerMessageId,
        lastError: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    console.info("[booking-email]", {bookingId: input.bookingId, status: "sent"});
    return "sent";
  }

  await ref.set(
    {
      status: "failed",
      lastError: result.errorCode,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
  console.info("[booking-email]", {
    bookingId: input.bookingId,
    status: "failed",
    errorCode: result.errorCode,
    retryable: result.retryable,
  });
  return "failed";
}
