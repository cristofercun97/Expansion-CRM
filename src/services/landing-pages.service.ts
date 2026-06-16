import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type {
  CreateLeaderLandingPageInput,
  LeaderLandingPage,
  UpdateLeaderLandingPageInput,
} from '@/types'

function mapLandingPage(leaderId: string, data: DocumentData): LeaderLandingPage {
  return {
    leaderId,
    heroTitle: data.heroTitle ?? '',
    heroSubtitle: data.heroSubtitle ?? '',
    description: data.description ?? '',
    videoUrl: data.videoUrl ?? '',
    whatsappMessage: data.whatsappMessage ?? '',
    ctaText: data.ctaText ?? '',
    isPublished: Boolean(data.isPublished),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

async function getLandingPageByLeaderId(leaderId: string): Promise<LeaderLandingPage | null> {
  const snapshot = await getDoc(
    doc(getFirebaseDb(), COLLECTIONS.leaderLandingPages, leaderId),
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapLandingPage(snapshot.id, snapshot.data())
}

async function createLandingPage(
  leaderId: string,
  data: CreateLeaderLandingPageInput,
): Promise<void> {
  await setDoc(doc(getFirebaseDb(), COLLECTIONS.leaderLandingPages, leaderId), {
    ...data,
    leaderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function updateLandingPage(
  leaderId: string,
  data: UpdateLeaderLandingPageInput,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.leaderLandingPages, leaderId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const landingPagesService = {
  getLandingPageByLeaderId,
  createLandingPage,
  updateLandingPage,
}
