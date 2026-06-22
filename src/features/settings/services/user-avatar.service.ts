import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage } from '@/lib/firebase'
import { MAX_AVATAR_BYTES } from '@/features/settings/utils/userSettings.utils'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.'
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return 'La imagen no puede superar 5 MB.'
  }

  return null
}

export async function uploadUserAvatar(uid: string, file: File): Promise<string> {
  const validationError = validateAvatarFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const storageRef = ref(getFirebaseStorage(), `users/${uid}/profile/avatar.${extension}`)

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: uid,
    },
  })

  return getDownloadURL(storageRef)
}
