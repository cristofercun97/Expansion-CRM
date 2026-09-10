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
  createGroupMeeting,
  updateGroupMeetingParticipants,
} from "./meetings/groupMeetings.js";
import {
  createMeetingNextAction,
  onMeetingWrittenSyncAgenda,
  processMeetingReminders,
} from "./meetings/meetingReminders.js";
import {getTeamAgenda} from "./meetings/teamAgenda.js";
import {getTeamAgendaMetrics} from "./meetings/teamAgendaMetrics.js";
import {
  cancelRecurringMeetingScope,
  createRecurringMeeting,
  editRecurringMeetingScope,
} from "./meetings/recurringMeetings.js";
import {
  adminApproveReferralPayout,
  adminMarkReferralPayoutPaid,
  adminRejectReferralPayout,
  requestReferralPayout,
} from "./referrals/payouts.js";
import {
  createPublicBooking,
  getPublicBookingAvailability,
  trackPresentationFunnelEvent,
} from "./booking/handlers.js";
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
  createGroupMeeting,
  updateGroupMeetingParticipants,
  createMeetingNextAction,
  onMeetingWrittenSyncAgenda,
  processMeetingReminders,
  getTeamAgenda,
  getTeamAgendaMetrics,
  createRecurringMeeting,
  editRecurringMeetingScope,
  cancelRecurringMeetingScope,
  getPublicBookingAvailability,
  createPublicBooking,
  trackPresentationFunnelEvent,
};
