import {FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {requireAdminUid, requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {selectRewardsForRequestedAmount} from "./selectRewardsForRequestedAmount.js";

const MIN_PAYOUT_AMOUNT_EUR = 10;

const PAYMENT_METHOD_TYPES = new Set(["bank", "crypto", "paypal", "other"]);
const CARD_DIGITS_PATTERN = /\d{13,19}/;
const CARD_KEYWORDS_PATTERN = /tarjeta|card\s*number|cvv/i;

type PaymentMethodSnapshot = {
  type: "bank" | "crypto" | "paypal" | "other";
  label: string;
  details: string;
};

type RewardDoc = {
  beneficiaryUid?: string;
  status?: string;
  currency?: string;
  amount?: number;
  payoutRequestId?: string;
};

type PayoutDoc = {
  status?: string;
  rewardIds?: string[];
  amount?: number;
};

function requireRequestId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", "requestId es requerido.");
  }

  return value.trim();
}

function assertNoClientRewardIds(payload: Record<string, unknown> | undefined): void {
  if (payload && "rewardIds" in payload) {
    throw new HttpsError("invalid-argument", "No se permiten rewardIds en la solicitud.");
  }
}

function validateRequestedAmount(value: unknown): number {
  if (typeof value !== "number") {
    throw new HttpsError("invalid-argument", "amount es requerido y debe ser un número.");
  }

  if (!Number.isFinite(value) || Number.isNaN(value)) {
    throw new HttpsError("invalid-argument", "amount inválido.");
  }

  if (value < 0) {
    throw new HttpsError("invalid-argument", "amount no puede ser negativo.");
  }

  const amountCents = Math.round(value * 100);

  if (Math.abs(value * 100 - amountCents) > 1e-6) {
    throw new HttpsError("invalid-argument", "amount admite como máximo 2 decimales.");
  }

  const normalizedAmount = amountCents / 100;

  if (normalizedAmount < MIN_PAYOUT_AMOUNT_EUR) {
    throw new HttpsError("invalid-argument", "El retiro mínimo es de 10 EUR.");
  }

  return normalizedAmount;
}

function validatePaymentMethodSnapshot(value: unknown): PaymentMethodSnapshot {
  if (!value || typeof value !== "object") {
    throw new HttpsError("invalid-argument", "paymentMethodSnapshot es requerido.");
  }

  const snapshot = value as Record<string, unknown>;
  const type = typeof snapshot.type === "string" ? snapshot.type.trim() : "";
  const label = typeof snapshot.label === "string" ? snapshot.label.trim() : "";
  const details = typeof snapshot.details === "string" ? snapshot.details.trim() : "";

  if (!PAYMENT_METHOD_TYPES.has(type)) {
    throw new HttpsError("invalid-argument", "Tipo de método de pago no permitido.");
  }

  if (label.length < 2 || label.length > 80) {
    throw new HttpsError("invalid-argument", "label debe tener entre 2 y 80 caracteres.");
  }

  if (details.length < 6 || details.length > 500) {
    throw new HttpsError("invalid-argument", "details debe tener entre 6 y 500 caracteres.");
  }

  const combined = `${label} ${details}`.toLowerCase();

  if (CARD_DIGITS_PATTERN.test(details) || CARD_KEYWORDS_PATTERN.test(combined)) {
    throw new HttpsError("invalid-argument", "No se permiten datos de tarjeta en el método de pago.");
  }

  return {
    type: type as PaymentMethodSnapshot["type"],
    label,
    details,
  };
}

function validateRejectReason(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "reason es requerido.");
  }

  const reason = value.trim();

  if (reason.length < 3 || reason.length > 300) {
    throw new HttpsError("invalid-argument", "reason debe tener entre 3 y 300 caracteres.");
  }

  return reason;
}

function validateOptionalAdminNotes(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "adminNotes debe ser texto.");
  }

  const notes = value.trim();

  if (notes.length === 0) {
    return undefined;
  }

  if (notes.length > 500) {
    throw new HttpsError("invalid-argument", "adminNotes no puede superar 500 caracteres.");
  }

  return notes;
}

function assertPayableRewardData(
  rewardId: string,
  data: RewardDoc | undefined,
  uid: string,
): number {
  if (!data) {
    throw new HttpsError(
      "failed-precondition",
      `La recompensa ${rewardId} ya no está disponible. Reintenta.`,
    );
  }

  if (data.beneficiaryUid !== uid) {
    throw new HttpsError("permission-denied", "No puedes solicitar pago de recompensas ajenas.");
  }

  if (data.status !== "payable") {
    throw new HttpsError(
      "failed-precondition",
      "Una o más recompensas ya no están listas para pago. Reintenta.",
    );
  }

  if (data.currency !== "EUR") {
    throw new HttpsError("failed-precondition", "Solo se pueden solicitar recompensas en EUR.");
  }

  if (typeof data.amount !== "number" || data.amount <= 0) {
    throw new HttpsError("failed-precondition", "Recompensa con monto inválido.");
  }

  return data.amount;
}

async function loadUserDisplayFields(uid: string): Promise<{userName?: string; userEmail?: string}> {
  const userDoc = await getDefaultFirestore().collection(COLLECTIONS.users).doc(uid).get();
  const data = userDoc.data();

  if (!data) {
    return {};
  }

  const userName =
    typeof data.displayName === "string" && data.displayName.trim().length > 0
      ? data.displayName.trim()
      : undefined;
  const userEmail =
    typeof data.email === "string" && data.email.trim().length > 0 ? data.email.trim() : undefined;

  return {userName, userEmail};
}

export const requestReferralPayout = onCall(callableOptions, async (request) => {
  let uid = "";

  try {
    uid = requireAuthUid(request);
    const payload = request.data as Record<string, unknown> | undefined;

    logger.info("requestReferralPayout started", {uid});

    assertNoClientRewardIds(payload);

    const requestedAmount = validateRequestedAmount(payload?.amount);
    const paymentMethodSnapshot = validatePaymentMethodSnapshot(payload?.paymentMethodSnapshot);

    logger.info("requestReferralPayout validated input", {
      uid,
      requestedAmount,
      paymentMethodType: paymentMethodSnapshot.type,
    });

    const db = getDefaultFirestore();
    const payableSnapshot = await db
      .collection(COLLECTIONS.referralRewards)
      .where("beneficiaryUid", "==", uid)
      .where("status", "==", "payable")
      .where("currency", "==", "EUR")
      .get();

    logger.info("requestReferralPayout payable rewards loaded", {
      uid,
      payableRewardCount: payableSnapshot.size,
    });

    if (payableSnapshot.empty) {
      throw new HttpsError(
        "failed-precondition",
        "No tienes recompensas listas para solicitar pago.",
      );
    }

    const candidateRewardIds = payableSnapshot.docs.map((doc) => doc.id);
    const {userName, userEmail} = await loadUserDisplayFields(uid);
    const requestId = `payout_${uid}_${Date.now()}`;

    const result = await db.runTransaction(async (transaction) => {
      const payableRewards: Array<{id: string; amount: number}> = [];

      for (const rewardId of candidateRewardIds) {
        const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(rewardId);
        const rewardDoc = await transaction.get(rewardRef);
        const amount = assertPayableRewardData(rewardId, rewardDoc.data() as RewardDoc | undefined, uid);
        payableRewards.push({id: rewardId, amount});
      }

      if (payableRewards.length === 0) {
        throw new HttpsError(
          "failed-precondition",
          "No hay recompensas listas para solicitar pago.",
        );
      }

      const availableAmount = payableRewards.reduce((sum, reward) => sum + reward.amount, 0);

      if (requestedAmount > availableAmount) {
        throw new HttpsError(
          "failed-precondition",
          "El monto solicitado supera tu saldo disponible.",
        );
      }

      const selection = selectRewardsForRequestedAmount(payableRewards, requestedAmount);

      if (!selection) {
        throw new HttpsError(
          "failed-precondition",
          "No hay una combinación exacta de recompensas disponibles para ese monto.",
        );
      }

      const rewardIds = selection.selectedRewards.map((reward) => reward.id);
      const rewardCount = rewardIds.length;
      const amount = selection.selectedAmount;

      const payoutRef = db.collection(COLLECTIONS.referralPayoutRequests).doc(requestId);

      transaction.set(payoutRef, {
        requestId,
        userUid: uid,
        userName: userName ?? null,
        userEmail: userEmail ?? null,
        amount,
        currency: "EUR",
        status: "pending",
        rewardIds,
        rewardCount,
        paymentMethodSnapshot,
        requestedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      for (const reward of selection.selectedRewards) {
        const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(reward.id);
        transaction.update(rewardRef, {
          status: "requested",
          payoutRequestId: requestId,
          requestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {requestId, amount, rewardCount};
    });

    logger.info("Referral payout requested", {
      requestId: result.requestId,
      userUid: uid,
      rewardCount: result.rewardCount,
      amount: result.amount,
      paymentMethodType: paymentMethodSnapshot.type,
    });

    return result;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error("requestReferralPayout unexpected error", {uid, error});
    throw new HttpsError("internal", "No se pudo procesar la solicitud de pago.");
  }
});

export const adminApproveReferralPayout = onCall(callableOptions, async (request) => {
  const adminUid = await requireAdminUid(request);
  const requestId = requireRequestId((request.data as {requestId?: unknown} | undefined)?.requestId);

  const db = getDefaultFirestore();
  const payoutRef = db.collection(COLLECTIONS.referralPayoutRequests).doc(requestId);
  const payoutDoc = await payoutRef.get();

  if (!payoutDoc.exists) {
    throw new HttpsError("not-found", "Solicitud de pago no encontrada.");
  }

  const payoutData = payoutDoc.data() as PayoutDoc | undefined;

  if (payoutData?.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "Solo se pueden aprobar solicitudes en estado pending.",
    );
  }

  await payoutRef.update({
    status: "approved",
    approvedAt: FieldValue.serverTimestamp(),
    approvedByUid: adminUid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info("Referral payout approved", {requestId, adminUid});

  return {ok: true, requestId};
});

export const adminMarkReferralPayoutPaid = onCall(callableOptions, async (request) => {
  const adminUid = await requireAdminUid(request);
  const payload = request.data as {requestId?: unknown; adminNotes?: unknown} | undefined;
  const requestId = requireRequestId(payload?.requestId);
  const adminNotes = validateOptionalAdminNotes(payload?.adminNotes);

  const db = getDefaultFirestore();
  const payoutRef = db.collection(COLLECTIONS.referralPayoutRequests).doc(requestId);

  await db.runTransaction(async (transaction) => {
    const payoutDoc = await transaction.get(payoutRef);

    if (!payoutDoc.exists) {
      throw new HttpsError("not-found", "Solicitud de pago no encontrada.");
    }

    const payoutData = payoutDoc.data() as PayoutDoc | undefined;
    const payoutStatus = payoutData?.status;

    if (payoutStatus !== "pending" && payoutStatus !== "approved") {
      throw new HttpsError(
        "failed-precondition",
        "Solo se pueden marcar como pagadas solicitudes pending o approved.",
      );
    }

    const rewardIds = Array.isArray(payoutData?.rewardIds)
      ? payoutData.rewardIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    if (rewardIds.length === 0) {
      throw new HttpsError("failed-precondition", "La solicitud no tiene recompensas asociadas.");
    }

    for (const rewardId of rewardIds) {
      const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(rewardId);
      const rewardDoc = await transaction.get(rewardRef);
      const rewardData = rewardDoc.data() as RewardDoc | undefined;

      if (
        !rewardDoc.exists ||
        rewardData?.payoutRequestId !== requestId ||
        rewardData?.status !== "requested"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Las recompensas de esta solicitud no están en estado válido.",
        );
      }
    }

    transaction.update(payoutRef, {
      status: "paid",
      paidAt: FieldValue.serverTimestamp(),
      paidByUid: adminUid,
      ...(adminNotes ? {adminNotes} : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const rewardId of rewardIds) {
      const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(rewardId);
      transaction.update(rewardRef, {
        status: "paid",
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  logger.info("Referral payout marked as paid", {requestId, adminUid});

  return {ok: true, requestId};
});

export const adminRejectReferralPayout = onCall(callableOptions, async (request) => {
  const adminUid = await requireAdminUid(request);
  const payload = request.data as
    | {requestId?: unknown; reason?: unknown; returnRewardsToPayable?: unknown}
    | undefined;
  const requestId = requireRequestId(payload?.requestId);
  const reason = validateRejectReason(payload?.reason);

  if (typeof payload?.returnRewardsToPayable !== "boolean") {
    throw new HttpsError("invalid-argument", "returnRewardsToPayable debe ser boolean.");
  }

  const returnRewardsToPayable = payload.returnRewardsToPayable;
  const db = getDefaultFirestore();
  const payoutRef = db.collection(COLLECTIONS.referralPayoutRequests).doc(requestId);

  await db.runTransaction(async (transaction) => {
    const payoutDoc = await transaction.get(payoutRef);

    if (!payoutDoc.exists) {
      throw new HttpsError("not-found", "Solicitud de pago no encontrada.");
    }

    const payoutData = payoutDoc.data() as PayoutDoc | undefined;
    const payoutStatus = payoutData?.status;

    if (payoutStatus !== "pending" && payoutStatus !== "approved") {
      throw new HttpsError(
        "failed-precondition",
        "Solo se pueden rechazar solicitudes pending o approved.",
      );
    }

    const rewardIds = Array.isArray(payoutData?.rewardIds)
      ? payoutData.rewardIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    if (rewardIds.length === 0) {
      throw new HttpsError("failed-precondition", "La solicitud no tiene recompensas asociadas.");
    }

    for (const rewardId of rewardIds) {
      const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(rewardId);
      const rewardDoc = await transaction.get(rewardRef);
      const rewardData = rewardDoc.data() as RewardDoc | undefined;

      if (
        !rewardDoc.exists ||
        rewardData?.payoutRequestId !== requestId ||
        rewardData?.status !== "requested"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Las recompensas de esta solicitud no están en estado válido.",
        );
      }
    }

    transaction.update(payoutRef, {
      status: "rejected",
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedByUid: adminUid,
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const rewardId of rewardIds) {
      const rewardRef = db.collection(COLLECTIONS.referralRewards).doc(rewardId);

      if (returnRewardsToPayable) {
        transaction.update(rewardRef, {
          status: "payable",
          payoutRequestId: FieldValue.delete(),
          requestedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.update(rewardRef, {
          status: "cancelled",
          cancelledAt: FieldValue.serverTimestamp(),
          reason,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  });

  logger.info("Referral payout rejected", {
    requestId,
    adminUid,
    returnRewardsToPayable,
  });

  return {ok: true, requestId};
});
