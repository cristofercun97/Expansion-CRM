import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore'
import type {
  RecognitionMonthlyPrizes,
  UpsertRecognitionMonthlyPrizesInput,
} from '@/features/recognitions/types/recognition-monthly-prizes.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapRecognitionMonthlyPrizesDocument(
  teamId: string,
  data: DocumentData,
): RecognitionMonthlyPrizes {
  return {
    id: teamId,
    teamId: typeof data.teamId === 'string' ? data.teamId : teamId,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    firstPrize: typeof data.firstPrize === 'string' ? data.firstPrize.trim() : '',
    secondPrize: typeof data.secondPrize === 'string' ? data.secondPrize.trim() : '',
    thirdPrize: typeof data.thirdPrize === 'string' ? data.thirdPrize.trim() : '',
    isActive: data.isActive === true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function hasConfiguredPrizes(prizes: RecognitionMonthlyPrizes): boolean {
  return (
    prizes.isActive &&
    (prizes.firstPrize.length > 0 ||
      prizes.secondPrize.length > 0 ||
      prizes.thirdPrize.length > 0)
  )
}

export const recognitionMonthlyPrizesService = {
  async getByTeamId(teamId: string): Promise<RecognitionMonthlyPrizes | null> {
    const normalizedTeamId = teamId.trim()

    if (!normalizedTeamId) {
      return null
    }

    const snapshot = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.recognitionMonthlyPrizes, normalizedTeamId),
    )

    if (!snapshot.exists()) {
      return null
    }

    const prizes = mapRecognitionMonthlyPrizesDocument(normalizedTeamId, snapshot.data())

    return hasConfiguredPrizes(prizes) ? prizes : null
  },

  async upsert(input: UpsertRecognitionMonthlyPrizesInput): Promise<void> {
    const normalizedTeamId = input.teamId.trim()
    const ownerUid = input.ownerUid.trim()

    if (!normalizedTeamId || !ownerUid) {
      throw new Error('No se pudo guardar la configuración de premios.')
    }

    const ref = doc(getFirebaseDb(), COLLECTIONS.recognitionMonthlyPrizes, normalizedTeamId)
    const existing = await getDoc(ref)

    await setDoc(
      ref,
      {
        teamId: normalizedTeamId,
        ownerUid,
        firstPrize: input.firstPrize.trim(),
        secondPrize: input.secondPrize.trim(),
        thirdPrize: input.thirdPrize.trim(),
        isActive: true,
        createdAt: existing.exists() ? existing.data()?.createdAt ?? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
}
