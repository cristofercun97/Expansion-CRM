import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import {
  GROUP_ACTIVATION_PROOF_ALLOWED_TYPES,
  GROUP_ACTIVATION_PROOF_MAX_BYTES,
} from '@/features/group-activation/constants/groupActivation.constants'
import { getFirebaseStorage } from '@/lib/firebase'

export function validateActivationProofFile(file: File): string | null {
  const normalizedType = file.type === 'image/jpg' ? 'image/jpeg' : file.type

  if (
    !GROUP_ACTIVATION_PROOF_ALLOWED_TYPES.includes(
      normalizedType as (typeof GROUP_ACTIVATION_PROOF_ALLOWED_TYPES)[number],
    )
  ) {
    return 'El comprobante debe ser JPG, PNG o PDF.'
  }

  if (file.size <= 0) {
    return 'El archivo del comprobante está vacío.'
  }

  if (file.size > GROUP_ACTIVATION_PROOF_MAX_BYTES) {
    return 'El comprobante no puede superar 5 MB.'
  }

  return null
}

function resolveProofExtension(contentType: string, fileName: string): string {
  if (contentType === 'application/pdf') {
    return 'pdf'
  }

  if (contentType === 'image/png') {
    return 'png'
  }

  const lowerName = fileName.toLowerCase()
  if (lowerName.endsWith('.png')) {
    return 'png'
  }

  if (lowerName.endsWith('.pdf')) {
    return 'pdf'
  }

  return 'jpg'
}

export async function uploadActivationProof(uid: string, file: File): Promise<{
  proofUrl: string
  proofFileName: string
  proofContentType: string
}> {
  const validationError = validateActivationProofFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  const contentType = file.type === 'image/jpg' ? 'image/jpeg' : file.type
  const extension = resolveProofExtension(contentType, file.name)
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40)
  const storagePath = `users/${uid}/activation-proofs/${Date.now()}_${safeBaseName || 'comprobante'}.${extension}`
  const storageRef = ref(getFirebaseStorage(), storagePath)

  await uploadBytes(storageRef, file, {
    contentType,
    customMetadata: {
      uploadedBy: uid,
      purpose: 'group_activation_proof',
    },
  })

  const proofUrl = await getDownloadURL(storageRef)

  return {
    proofUrl,
    proofFileName: file.name.trim() || `comprobante.${extension}`,
    proofContentType: contentType,
  }
}
