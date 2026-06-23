import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { validateAvatarFile } from '@/features/settings/services/user-avatar.service'
import { getFirebaseStorage } from '@/lib/firebase'

export type PresentationImageKind = 'logo' | 'photo'

function resolveImageExtension(file: File): string {
  if (file.type === 'image/png') {
    return 'png'
  }

  if (file.type === 'image/webp') {
    return 'webp'
  }

  if (file.type === 'image/gif') {
    return 'gif'
  }

  return 'jpg'
}

export async function uploadPresentationImage(
  ownerUid: string,
  kind: PresentationImageKind,
  file: File,
): Promise<string> {
  const validationError = validateAvatarFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  const normalizedUid = ownerUid.trim()

  if (!normalizedUid) {
    throw new Error('Debes iniciar sesión para subir imágenes.')
  }

  const extension = resolveImageExtension(file)
  const storageRef = ref(
    getFirebaseStorage(),
    `users/${normalizedUid}/presentation/${kind}.${extension}`,
  )

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: normalizedUid,
      presentationAsset: kind,
    },
  })

  return getDownloadURL(storageRef)
}
