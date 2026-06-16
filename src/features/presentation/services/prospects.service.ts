import { FirebaseError } from 'firebase/app'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import type { CreatePresentationProspectInput } from '@/features/presentation/types/prospect.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function buildPresentationProspectDocument(data: CreatePresentationProspectInput) {
  const document: Record<string, string> = {
    ownerUid: data.ownerUid.trim(),
    leaderId: data.leaderId.trim(),
    landingSlug: data.landingSlug.trim(),
    source: 'presentation_landing',
    status: 'new',
  }

  if (data.name !== undefined) {
    document.name = data.name.trim()
  }

  if (data.whatsapp !== undefined) {
    document.whatsapp = data.whatsapp.trim()
  }

  if (data.interest !== undefined) {
    document.interest = data.interest.trim()
  }

  if (data.message !== undefined) {
    document.message = data.message.trim()
  }

  if (data.whatsappGroupUrl !== undefined) {
    document.whatsappGroupUrl = data.whatsappGroupUrl.trim()
  }

  return {
    ...document,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

async function createPresentationProspect(data: CreatePresentationProspectInput): Promise<string> {
  const docRef = await addDoc(
    collection(getFirebaseDb(), COLLECTIONS.prospects),
    buildPresentationProspectDocument(data),
  )

  return docRef.id
}

export const presentationProspectsService = {
  createPresentationProspect,
}

export function getPresentationProspectSubmitErrorMessage(error: unknown): string {
  if (
    error instanceof FirebaseError &&
    (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED')
  ) {
    return 'No pudimos guardar tu información por un problema de permisos. Intenta nuevamente en unos minutos.'
  }

  if (error instanceof FirebaseError && error.code === 'unavailable') {
    return 'No hay conexión con el servidor. Revisa tu internet e intenta otra vez.'
  }

  if (error instanceof Error && error.message.trim()) {
    const normalizedMessage = error.message.trim()

    if (normalizedMessage === 'Missing or insufficient permissions.') {
      return 'No pudimos guardar tu información por un problema de permisos. Intenta nuevamente en unos minutos.'
    }

    return normalizedMessage
  }

  return 'No pudimos enviar tu información. Intenta nuevamente en unos momentos.'
}
