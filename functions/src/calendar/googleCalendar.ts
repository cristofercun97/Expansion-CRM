import {randomBytes} from "node:crypto";
import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {google} from "googleapis";
import {FieldValue} from "firebase-admin/firestore";
import {requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";

const googleOAuthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOAuthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const googleOAuthRedirectUri = defineSecret("GOOGLE_OAUTH_REDIRECT_URI");
const appBaseUrl = defineSecret("APP_BASE_URL");

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

type ConnectionDoc = {
  email?: string;
  refreshToken?: string;
  accessToken?: string;
  expiryDate?: number;
  updatedAt?: unknown;
};

function requireConfiguredSecrets(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
} {
  const clientId = googleOAuthClientId.value()?.trim();
  const clientSecret = googleOAuthClientSecret.value()?.trim();
  const redirectUri = googleOAuthRedirectUri.value()?.trim();
  const baseUrl = appBaseUrl.value()?.trim() || "https://expansion-proyect.web.app";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new HttpsError(
      "failed-precondition",
      "Google Calendar no está configurado todavía. Contacta con el administrador.",
    );
  }

  return {clientId, clientSecret, redirectUri, baseUrl};
}

function createOAuthClient() {
  const {clientId, clientSecret, redirectUri} = requireConfiguredSecrets();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

async function createOAuthState(uid: string): Promise<string> {
  const stateId = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;

  await getDefaultFirestore()
    .collection(COLLECTIONS.googleOAuthStates)
    .doc(stateId)
    .set({
      uid,
      expiresAt,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });

  return stateId;
}

async function consumeOAuthState(stateId: string): Promise<string> {
  const stateRef = getDefaultFirestore().collection(COLLECTIONS.googleOAuthStates).doc(stateId);

  const uid = await getDefaultFirestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(stateRef);
    if (!snapshot.exists) {
      throw new HttpsError("invalid-argument", "El estado de autorización de Google no es válido.");
    }

    const data = snapshot.data() as {
      uid?: string;
      expiresAt?: number;
      used?: boolean;
    };

    if (!data.uid || data.used) {
      throw new HttpsError("invalid-argument", "El estado de autorización de Google no es válido.");
    }

    if (!Number.isFinite(data.expiresAt) || Date.now() > Number(data.expiresAt)) {
      throw new HttpsError("invalid-argument", "El estado de autorización de Google ha expirado.");
    }

    tx.update(stateRef, {
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    return data.uid;
  });

  return uid;
}

async function getConnection(uid: string): Promise<ConnectionDoc | null> {
  const snapshot = await getDefaultFirestore()
    .collection(COLLECTIONS.googleCalendarConnections)
    .doc(uid)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as ConnectionDoc;
}

async function getAuthorizedCalendarClient(uid: string) {
  const connection = await getConnection(uid);
  if (!connection?.refreshToken) {
    throw new HttpsError(
      "failed-precondition",
      "Conecta Google Calendar para crear el enlace de Google Meet.",
    );
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    refresh_token: connection.refreshToken,
    access_token: connection.accessToken,
    expiry_date: connection.expiryDate,
  });

  oauth2Client.on("tokens", async (tokens) => {
    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (tokens.access_token) {
      patch.accessToken = tokens.access_token;
    }
    if (tokens.expiry_date) {
      patch.expiryDate = tokens.expiry_date;
    }
    if (tokens.refresh_token) {
      patch.refreshToken = tokens.refresh_token;
    }

    await getDefaultFirestore()
      .collection(COLLECTIONS.googleCalendarConnections)
      .doc(uid)
      .set(patch, {merge: true});
  });

  return google.calendar({version: "v3", auth: oauth2Client});
}

function mapEventResult(event: {
  id?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  conferenceData?: {entryPoints?: Array<{entryPointType?: string | null; uri?: string | null}>};
}) {
  const meetEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );

  return {
    googleCalendarEventId: event.id || "",
    googleCalendarHtmlLink: event.htmlLink || null,
    googleMeetUrl: meetEntry?.uri || event.hangoutLink || null,
  };
}

export type CalendarEventInput = {
  title: string;
  description: string;
  startAtIso: string;
  endAtIso: string;
  timezone: string;
  attendeeEmails: string[];
};

/** Shared helper for Agenda group meetings (organizer OAuth). */
export async function createCalendarEventForUid(uid: string, data: CalendarEventInput) {
  const calendar = await getAuthorizedCalendarClient(uid);
  const requestId = randomBytes(8).toString("hex");

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: data.title.trim(),
      description: data.description?.trim() || "",
      start: {
        dateTime: data.startAtIso,
        timeZone: data.timezone,
      },
      end: {
        dateTime: data.endAtIso,
        timeZone: data.timezone,
      },
      attendees: (data.attendeeEmails || [])
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
        .map((email) => ({email})),
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  const mapped = mapEventResult(response.data);
  if (!mapped.googleCalendarEventId) {
    throw new HttpsError("internal", "Google Calendar no devolvió un ID de evento.");
  }

  return mapped;
}

/** Shared helper for Agenda group meetings (organizer OAuth). */
export async function updateCalendarEventForUid(
  uid: string,
  data: CalendarEventInput & {googleCalendarEventId: string},
) {
  const calendar = await getAuthorizedCalendarClient(uid);
  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: data.googleCalendarEventId,
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: data.title.trim(),
      description: data.description?.trim() || "",
      start: {
        dateTime: data.startAtIso,
        timeZone: data.timezone || "UTC",
      },
      end: {
        dateTime: data.endAtIso,
        timeZone: data.timezone || "UTC",
      },
      attendees: (data.attendeeEmails || [])
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
        .map((email) => ({email})),
    },
  });

  return mapEventResult(response.data);
}

export const getGoogleCalendarConnectionStatus = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const configured = Boolean(
      googleOAuthClientId.value()?.trim() &&
        googleOAuthClientSecret.value()?.trim() &&
        googleOAuthRedirectUri.value()?.trim(),
    );
    const connection = await getConnection(uid);

    return {
      configured,
      connected: Boolean(connection?.refreshToken),
      email: connection?.email || null,
    };
  },
);

export const getGoogleCalendarConnectUrl = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const oauth2Client = createOAuthClient();
    const state = await createOAuthState(uid);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: CALENDAR_SCOPES,
      state,
      include_granted_scopes: true,
    });

    return {url};
  },
);

export const disconnectGoogleCalendar = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const connection = await getConnection(uid);

    if (connection?.refreshToken || connection?.accessToken) {
      try {
        const oauth2Client = createOAuthClient();
        const tokenToRevoke = connection.refreshToken || connection.accessToken;
        if (tokenToRevoke) {
          await oauth2Client.revokeToken(tokenToRevoke);
        }
      } catch {
        // Best-effort revoke; still clear local connection.
      }
    }

    await getDefaultFirestore()
      .collection(COLLECTIONS.googleCalendarConnections)
      .doc(uid)
      .delete();
    return {ok: true};
  },
);

export const googleCalendarOAuthCallback = onRequest(
  {
    region: "europe-west1",
    cors: true,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (req, res) => {
    const {baseUrl} = requireConfiguredSecrets();
    const errorRedirect = `${baseUrl}/dashboard/agenda?googleCalendar=error`;

    try {
      const code = typeof req.query.code === "string" ? req.query.code : "";
      const state = typeof req.query.state === "string" ? req.query.state : "";
      if (!code || !state) {
        res.redirect(errorRedirect);
        return;
      }

      const uid = await consumeOAuthState(state);
      const oauth2Client = createOAuthClient();
      const {tokens} = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({version: "v2", auth: oauth2Client});
      const profile = await oauth2.userinfo.get();

      if (!tokens.refresh_token) {
        const existing = await getConnection(uid);
        if (!existing?.refreshToken) {
          res.redirect(`${baseUrl}/dashboard/agenda?googleCalendar=missing_refresh`);
          return;
        }
      }

      await getDefaultFirestore()
        .collection(COLLECTIONS.googleCalendarConnections)
        .doc(uid)
        .set(
          {
            email: profile.data.email || "",
            refreshToken: tokens.refresh_token || (await getConnection(uid))?.refreshToken || "",
            accessToken: tokens.access_token || "",
            expiryDate: tokens.expiry_date || null,
            updatedAt: FieldValue.serverTimestamp(),
            connectedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

      res.redirect(`${baseUrl}/dashboard/agenda?googleCalendar=connected`);
    } catch {
      res.redirect(errorRedirect);
    }
  },
);

export const createGoogleCalendarEvent = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = request.data as {
      title?: string;
      description?: string;
      startAtIso?: string;
      endAtIso?: string;
      timezone?: string;
      attendeeEmails?: string[];
    };

    if (!data.title?.trim() || !data.startAtIso || !data.endAtIso || !data.timezone) {
      throw new HttpsError("invalid-argument", "Faltan datos para crear el evento de Calendar.");
    }

    return createCalendarEventForUid(uid, {
      title: data.title,
      description: data.description || "",
      startAtIso: data.startAtIso,
      endAtIso: data.endAtIso,
      timezone: data.timezone,
      attendeeEmails: data.attendeeEmails || [],
    });
  },
);

export const updateGoogleCalendarEvent = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = request.data as {
      googleCalendarEventId?: string;
      title?: string;
      description?: string;
      startAtIso?: string;
      endAtIso?: string;
      timezone?: string;
      attendeeEmails?: string[];
    };

    if (!data.googleCalendarEventId || !data.title?.trim() || !data.startAtIso || !data.endAtIso) {
      throw new HttpsError("invalid-argument", "Faltan datos para actualizar el evento de Calendar.");
    }

    return updateCalendarEventForUid(uid, {
      googleCalendarEventId: data.googleCalendarEventId,
      title: data.title,
      description: data.description || "",
      startAtIso: data.startAtIso,
      endAtIso: data.endAtIso,
      timezone: data.timezone || "UTC",
      attendeeEmails: data.attendeeEmails || [],
    });
  },
);

export const cancelGoogleCalendarEvent = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = request.data as {googleCalendarEventId?: string};

    if (!data.googleCalendarEventId) {
      throw new HttpsError("invalid-argument", "Falta el ID del evento de Calendar.");
    }

    const calendar = await getAuthorizedCalendarClient(uid);
    await calendar.events.delete({
      calendarId: "primary",
      eventId: data.googleCalendarEventId,
      sendUpdates: "all",
    });

    return {ok: true};
  },
);
