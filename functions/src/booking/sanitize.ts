/**
 * Public booking request sanitization / validation.
 */
import {
  BOOKING_MAX_ADVANCE_DAYS,
  daySpanInclusive,
  parseDateKey,
} from "./availability.js";

export type PublicLeadData = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  whatsapp: string;
  sessionReason: string;
  objective: string;
  message: string;
  privacyAccepted: boolean;
};

export const SESSION_REASONS = [
  "Desarrollo personal",
  "Bienestar emocional",
  "Objetivos profesionales",
  "Liderazgo",
  "Otro",
] as const;

export const SESSION_OBJECTIVES = [
  "Clarificar mi situación",
  "Definir próximos pasos",
  "Resolver una dificultad",
  "Conocer el proceso",
  "Otro",
] as const;

function cleanString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeEmail(value: unknown): string {
  return cleanString(value, 160).toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

export function sanitizeAvailabilityRequest(data: unknown): {
  slug: string;
  dateFrom: string;
  dateTo: string;
} {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const slug = cleanString(raw.slug, 80).toLowerCase();
  const dateFrom = cleanString(raw.dateFrom ?? raw.from, 10);
  const dateTo = cleanString(raw.dateTo ?? raw.to, 10);

  if (!slug) {
    throw Object.assign(new Error("slug es obligatorio."), {code: "invalid-argument"});
  }
  if (!parseDateKey(dateFrom) || !parseDateKey(dateTo)) {
    throw Object.assign(new Error("Rango de fechas inválido."), {code: "invalid-argument"});
  }
  if (dateFrom > dateTo) {
    throw Object.assign(new Error("Rango de fechas inválido."), {code: "invalid-argument"});
  }
  const span = daySpanInclusive(dateFrom, dateTo);
  if (span > BOOKING_MAX_ADVANCE_DAYS) {
    throw Object.assign(new Error("El rango máximo es de 31 días."), {
      code: "invalid-argument",
      reason: "range_too_large",
    });
  }
  return {slug, dateFrom, dateTo};
}

export function sanitizeCreateBookingRequest(data: unknown): {
  slug: string;
  selectedDate: string;
  selectedTime: string;
  clientRequestId: string;
  lead: PublicLeadData;
} {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const slug = cleanString(raw.slug, 80).toLowerCase();
  const selectedDate = cleanString(raw.selectedDate, 10);
  const selectedTime = cleanString(raw.selectedTime, 5);
  const clientRequestId = cleanString(raw.clientRequestId, 80);
  const leadRaw =
    raw.leadData && typeof raw.leadData === "object"
      ? (raw.leadData as Record<string, unknown>)
      : raw;

  const firstName = cleanString(leadRaw.firstName, 60);
  const lastName = cleanString(leadRaw.lastName, 60);
  const email = normalizeEmail(leadRaw.email);
  const country = cleanString(leadRaw.country, 80);
  const city = cleanString(leadRaw.city, 80);
  const whatsapp = cleanString(leadRaw.whatsapp, 40);
  const sessionReason = cleanString(leadRaw.sessionReason, 80);
  const objective = cleanString(leadRaw.objective, 80);
  const message = cleanString(leadRaw.message, 500);
  const privacyAccepted = leadRaw.privacyAccepted === true;

  if (!slug || !parseDateKey(selectedDate) || !/^\d{2}:\d{2}$/.test(selectedTime)) {
    throw Object.assign(new Error("Datos de reserva incompletos."), {code: "invalid-argument"});
  }
  if (!clientRequestId || clientRequestId.length < 8) {
    throw Object.assign(new Error("clientRequestId inválido."), {code: "invalid-argument"});
  }
  if (!firstName) {
    throw Object.assign(new Error("El nombre es obligatorio."), {code: "invalid-argument"});
  }
  if (!isValidEmail(email)) {
    throw Object.assign(new Error("Email inválido."), {code: "invalid-argument"});
  }
  if (!country || !city) {
    throw Object.assign(new Error("País y ciudad son obligatorios."), {code: "invalid-argument"});
  }
  if (!sessionReason || !objective || !message) {
    throw Object.assign(new Error("Motivo, objetivo y mensaje son obligatorios."), {
      code: "invalid-argument",
    });
  }
  if (!privacyAccepted) {
    throw Object.assign(new Error("Debes aceptar la política de privacidad."), {
      code: "failed-precondition",
      reason: "privacy_required",
    });
  }

  return {
    slug,
    selectedDate,
    selectedTime,
    clientRequestId,
    lead: {
      firstName,
      lastName,
      email,
      country,
      city,
      whatsapp,
      sessionReason,
      objective,
      message,
      privacyAccepted,
    },
  };
}
