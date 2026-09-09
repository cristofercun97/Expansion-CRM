import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  disconnectGoogleCalendar,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarConnectionStatus,
  googleCalendarOAuthCallback,
  updateGoogleCalendarEvent,
} from "./calendar/googleCalendar.js";
import {
  adminApproveReferralPayout,
  adminMarkReferralPayoutPaid,
  adminRejectReferralPayout,
  requestReferralPayout,
} from "./referrals/payouts.js";
import {callableOptions} from "./utils/callableOptions.js";

admin.initializeApp();

export const healthCheck = onCall(callableOptions, async () => {
  return {
    ok: true,
    service: "expansion-functions",
  };
});

export {
  requestReferralPayout,
  adminApproveReferralPayout,
  adminMarkReferralPayoutPaid,
  adminRejectReferralPayout,
  getGoogleCalendarConnectionStatus,
  getGoogleCalendarConnectUrl,
  disconnectGoogleCalendar,
  googleCalendarOAuthCallback,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  cancelGoogleCalendarEvent,
};
