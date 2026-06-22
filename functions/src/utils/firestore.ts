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
} as const;
