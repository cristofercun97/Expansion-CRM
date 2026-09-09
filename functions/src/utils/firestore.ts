import {getApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const FIRESTORE_DATABASE_ID = "default";

export function getDefaultFirestore() {
  return getFirestore(getApp(), FIRESTORE_DATABASE_ID);
}

export const COLLECTIONS = {
  users: "users",
  referralRewards: "referralRewards",
  referralPayoutRequests: "referralPayoutRequests",
  googleCalendarConnections: "googleCalendarConnections",
  googleOAuthStates: "googleOAuthStates",
  meetings: "meetings",
  teams: "teams",
  teamMembers: "teamMembers",
  meetingReminders: "meetingReminders",
  notifications: "notifications",
  actionTasks: "actionTasks",
  leadActivities: "leadActivities",
  meetingNextActionLocks: "meetingNextActionLocks",
} as const;
