import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import type {
  AcademyMaterialEngagement,
  TrackMaterialOpenInput,
  TrackMaterialOpenResult,
} from '@/features/academy/types/academy-material-engagement.types'
import {
  buildEngagementDocumentId,
} from '@/features/academy/utils/academyMaterialEngagementDebug'
import { COLLECTIONS, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'

function mapAcademyMaterialEngagement(
  id: string,
  data: DocumentData,
): AcademyMaterialEngagement | null {
  if (
    typeof data.teamId !== 'string' ||
    data.teamId.length === 0 ||
    typeof data.materialId !== 'string' ||
    data.materialId.length === 0 ||
    typeof data.memberUid !== 'string' ||
    data.memberUid.length === 0
  ) {
    return null
  }

  const openCount = typeof data.openCount === 'number' ? data.openCount : 0

  if (openCount < 1) {
    return null
  }

  return {
    id,
    teamId: data.teamId,
    materialId: data.materialId,
    memberUid: data.memberUid,
    memberName: typeof data.memberName === 'string' ? data.memberName : '',
    memberEmail: typeof data.memberEmail === 'string' ? data.memberEmail : '',
    openedAt: data.openedAt ?? null,
    lastOpenedAt: data.lastOpenedAt ?? null,
    openCount,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

async function trackMaterialOpen(
  input: TrackMaterialOpenInput,
): Promise<TrackMaterialOpenResult> {
  const teamId = input.teamId.trim()
  const materialId = input.materialId.trim()
  const memberUid = input.memberUid.trim()
  const authUser = getFirebaseAuth().currentUser
  const memberEmail = input.memberEmail.trim() || authUser?.email?.trim() || ''

  if (!teamId || !materialId || !memberUid || !memberEmail) {
    if (import.meta.env.DEV) {
      console.warn('[Academia Engagement Debug] Tracking omitido por datos incompletos', {
        teamId,
        materialId,
        memberUid,
        memberEmail,
      })
    }
    return { tracked: false, isFirstOpen: false }
  }

  const db = getFirebaseDb()
  const engagementId = buildEngagementDocumentId(teamId, materialId, memberUid)
  const engagementRef = doc(db, COLLECTIONS.academyMaterialEngagements, engagementId)
  const now = serverTimestamp()
  const memberName = input.memberName.trim() || 'Usuario'
  const authUid = authUser?.uid ?? null
  const expectedTeamMemberDocId = `${teamId}_${authUid ?? memberUid}`

  const payloadAttempted = {
    teamId,
    materialId,
    memberUid,
    memberName,
    memberEmail,
    openCount: increment(1),
    openedAt: now,
    lastOpenedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  if (import.meta.env.DEV) {
    console.info(
      '[Academia Engagement Write Attempt JSON]',
      JSON.stringify({
        engagementId,
        teamId,
        materialId,
        memberUid,
        memberName,
        memberEmail,
        authUid,
        emailVerified: authUser?.emailVerified ?? false,
        expectedTeamMemberDocId,
      }),
    )
  }

  try {
    await setDoc(engagementRef, payloadAttempted, { merge: true })
    return { tracked: true, isFirstOpen: false }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Academia Engagement Write Error JSON]',
        JSON.stringify({
          errorCode: error instanceof FirebaseError ? error.code : 'unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          engagementId,
          payloadAttempted: {
            teamId,
            materialId,
            memberUid,
            memberName,
            memberEmail,
            openCount: 'increment(1)',
            openedAt: 'serverTimestamp()',
            lastOpenedAt: 'serverTimestamp()',
            createdAt: 'serverTimestamp()',
            updatedAt: 'serverTimestamp()',
          },
          expectedTeamMemberDocId,
        }),
      )
    }

    return { tracked: false, isFirstOpen: false }
  }
}

async function getEngagementsByTeamId(teamId: string): Promise<AcademyMaterialEngagement[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.academyMaterialEngagements),
      where('teamId', '==', teamId),
    ),
  )

  return snapshot.docs
    .map((engagementDoc) => mapAcademyMaterialEngagement(engagementDoc.id, engagementDoc.data()))
    .filter((engagement): engagement is AcademyMaterialEngagement => engagement !== null)
}

async function getEngagementsForLeaderProgress(
  ownedTeamId: string,
  ownerUid: string,
): Promise<AcademyMaterialEngagement[]> {
  const db = getFirebaseDb()
  const teamIds = new Set<string>([ownedTeamId])

  const [memberTeamsSnapshot, leaderTeamsSnapshot] = await Promise.all([
    getDocs(
      query(collection(db, COLLECTIONS.teamMembers), where('ownerUid', '==', ownerUid)),
    ),
    getDocs(query(collection(db, COLLECTIONS.teams), where('ownerUid', '==', ownerUid))),
  ])

  for (const memberTeamDoc of memberTeamsSnapshot.docs) {
    const memberTeamId = memberTeamDoc.data().teamId
    if (typeof memberTeamId === 'string' && memberTeamId.length > 0) {
      teamIds.add(memberTeamId)
    }
  }

  for (const leaderTeamDoc of leaderTeamsSnapshot.docs) {
    teamIds.add(leaderTeamDoc.id)
  }

  const engagementGroups = await Promise.all(
    [...teamIds].map((teamId) => getEngagementsByTeamId(teamId)),
  )

  const merged = new Map<string, AcademyMaterialEngagement>()

  for (const engagements of engagementGroups) {
    for (const engagement of engagements) {
      merged.set(`${engagement.memberUid}_${engagement.materialId}`, engagement)
    }
  }

  return [...merged.values()]
}

async function getMyEngagementsByTeamId(
  teamId: string,
  memberUid: string,
): Promise<AcademyMaterialEngagement[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.academyMaterialEngagements),
      where('teamId', '==', teamId),
      where('memberUid', '==', memberUid),
    ),
  )

  return snapshot.docs
    .map((engagementDoc) => mapAcademyMaterialEngagement(engagementDoc.id, engagementDoc.data()))
    .filter((engagement): engagement is AcademyMaterialEngagement => engagement !== null)
}

async function getMyEngagementsByMemberUid(memberUid: string): Promise<AcademyMaterialEngagement[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.academyMaterialEngagements),
      where('memberUid', '==', memberUid),
    ),
  )

  return snapshot.docs
    .map((engagementDoc) => mapAcademyMaterialEngagement(engagementDoc.id, engagementDoc.data()))
    .filter((engagement): engagement is AcademyMaterialEngagement => engagement !== null)
}

export const academyMaterialEngagementsService = {
  trackMaterialOpen,
  getEngagementsByTeamId,
  getEngagementsForLeaderProgress,
  getMyEngagementsByTeamId,
  getMyEngagementsByMemberUid,
}
