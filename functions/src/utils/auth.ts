import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import {COLLECTIONS, getDefaultFirestore} from "./firestore.js";

export function requireAuthUid(request: CallableRequest): string {
  const uid = request.auth?.uid?.trim();

  if (!uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para continuar.");
  }

  return uid;
}

export async function requireAdminUid(request: CallableRequest): Promise<string> {
  const uid = requireAuthUid(request);
  const userDoc = await getDefaultFirestore().collection(COLLECTIONS.users).doc(uid).get();
  const role = userDoc.data()?.role;

  if (!userDoc.exists || role !== "admin") {
    throw new HttpsError("permission-denied", "Solo administradores pueden realizar esta acción.");
  }

  return uid;
}
