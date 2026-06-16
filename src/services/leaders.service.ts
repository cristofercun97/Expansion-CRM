import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { CreateLeaderInput, Leader, UpdateLeaderInput } from '@/types'

function mapLeader(uid: string, data: DocumentData): Leader {
  return {
    uid,
    displayName: data.displayName ?? '',
    slug: data.slug ?? '',
    referralCode: data.referralCode ?? '',
    whatsapp: data.whatsapp ?? '',
    bio: data.bio ?? '',
    avatarUrl: data.avatarUrl ?? '',
    landingEnabled: Boolean(data.landingEnabled),
    stats: {
      totalProspects: data.stats?.totalProspects ?? 0,
      totalContacted: data.stats?.totalContacted ?? 0,
      totalRegistered: data.stats?.totalRegistered ?? 0,
      totalActive: data.stats?.totalActive ?? 0,
    },
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

async function getLeaderById(uid: string): Promise<Leader | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.leaders, uid))

  if (!snapshot.exists()) {
    return null
  }

  return mapLeader(snapshot.id, snapshot.data())
}

// TODO/SECURITY:
// Resuelve perfil por slug vía query en leaders. No usar en registro (usar slugs/{slug}).
// Landing pública futura requerirá reglas dedicadas, slugs->uid lookup o endpoint server-side.
async function getLeaderBySlug(slug: string): Promise<Leader | null> {
  const leadersQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.leaders),
    where('slug', '==', slug),
  )
  const snapshot = await getDocs(leadersQuery)

  if (snapshot.empty) {
    return null
  }

  const leaderDoc = snapshot.docs[0]
  return mapLeader(leaderDoc.id, leaderDoc.data())
}

async function createLeaderProfile(uid: string, data: CreateLeaderInput): Promise<void> {
  await setDoc(doc(getFirebaseDb(), COLLECTIONS.leaders, uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function updateLeaderProfile(uid: string, data: UpdateLeaderInput): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.leaders, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const leadersService = {
  getLeaderById,
  getLeaderBySlug,
  createLeaderProfile,
  updateLeaderProfile,
}
