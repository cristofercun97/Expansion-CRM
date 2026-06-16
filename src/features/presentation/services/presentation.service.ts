import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { mapDocumentToPresentationRecord, mapFormToFirestorePayload } from '@/features/presentation/utils/presentationMappers'
import { normalizeSlug, validateSlug } from '@/features/presentation/utils/slugUtils'
import type {
  PresentationRecord,
  PresentationUpsertInput,
} from '@/features/presentation/types/presentation.types'
import { COLLECTIONS, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'

const SLUG_IN_USE_MESSAGE = 'Este enlace ya está en uso. Prueba con otro.'

function assertOwner(uid: string): void {
  const authUid = getFirebaseAuth().currentUser?.uid

  if (!authUid || authUid !== uid) {
    throw new Error('No tienes permiso para acceder a esta presentación.')
  }
}

function getPresentationRef(uid: string) {
  return doc(getFirebaseDb(), COLLECTIONS.leaderLandingPages, uid)
}

function getSlugRef(slug: string) {
  return doc(getFirebaseDb(), COLLECTIONS.slugs, slug)
}

async function assertSlugAvailableForUid(slug: string, uid: string): Promise<void> {
  const snapshot = await getDoc(getSlugRef(slug))

  if (!snapshot.exists()) {
    return
  }

  const ownerUid = String(snapshot.data().uid ?? '')

  if (ownerUid !== uid) {
    throw new Error(SLUG_IN_USE_MESSAGE)
  }
}

async function reserveSlugIfNeeded(uid: string, slug: string): Promise<void> {
  const slugRef = getSlugRef(slug)
  const snapshot = await getDoc(slugRef)

  if (snapshot.exists()) {
    return
  }

  await setDoc(slugRef, {
    slug,
    uid,
    type: 'presentation',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function getPresentationByOwner(uid: string): Promise<PresentationRecord | null> {
  assertOwner(uid)

  const snapshot = await getDoc(getPresentationRef(uid))

  if (!snapshot.exists()) {
    return null
  }

  return mapDocumentToPresentationRecord(uid, snapshot.data())
}

async function getPublishedPresentationBySlug(slug: string): Promise<PresentationRecord | null> {
  const normalizedSlug = normalizeSlug(slug)

  if (!normalizedSlug) {
    return null
  }

  const slugSnapshot = await getDoc(getSlugRef(normalizedSlug))

  if (!slugSnapshot.exists()) {
    return null
  }

  const slugData = slugSnapshot.data()

  if (!slugData.isActive) {
    return null
  }

  const ownerUid = String(slugData.uid ?? '')

  if (!ownerUid) {
    return null
  }

  const landingSnapshot = await getDoc(getPresentationRef(ownerUid))

  if (!landingSnapshot.exists()) {
    return null
  }

  const record = mapDocumentToPresentationRecord(ownerUid, landingSnapshot.data())

  if (!record.isPublished || record.slug !== normalizedSlug) {
    return null
  }

  return record
}

async function upsertPresentation(uid: string, input: PresentationUpsertInput): Promise<void> {
  assertOwner(uid)

  const ref = getPresentationRef(uid)
  const snapshot = await getDoc(ref)
  const payload = mapFormToFirestorePayload(uid, input)

  if (snapshot.exists()) {
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp(),
    })
    return
  }

  await setDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function updatePresentationSlug(uid: string, slugInput: string): Promise<string> {
  assertOwner(uid)

  const slug = normalizeSlug(slugInput)
  const validationError = validateSlug(slug)

  if (validationError) {
    throw new Error(validationError)
  }

  await assertSlugAvailableForUid(slug, uid)

  await updateDoc(getPresentationRef(uid), {
    slug,
    updatedAt: serverTimestamp(),
  })

  return slug
}

async function publishPresentation(uid: string, slugInput: string): Promise<string> {
  assertOwner(uid)

  const slug = normalizeSlug(slugInput)
  const validationError = validateSlug(slug)

  if (validationError) {
    throw new Error(validationError)
  }

  await assertSlugAvailableForUid(slug, uid)
  await reserveSlugIfNeeded(uid, slug)

  await setDoc(
    getPresentationRef(uid),
    {
      slug,
      ownerUid: uid,
      leaderId: uid,
      isPublished: true,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return slug
}

async function unpublishPresentation(uid: string): Promise<void> {
  assertOwner(uid)

  await updateDoc(getPresentationRef(uid), {
    isPublished: false,
    updatedAt: serverTimestamp(),
  })
}

export const presentationService = {
  getPresentationByOwner,
  getPublishedPresentationBySlug,
  upsertPresentation,
  updatePresentationSlug,
  publishPresentation,
  unpublishPresentation,
}
