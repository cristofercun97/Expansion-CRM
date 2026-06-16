import type { AcademyMaterialType } from '@/features/academy/types/academy.types'

export type AcademyMaterialFormValues = {
  title: string
  description: string
  type: AcademyMaterialType | ''
  url: string
  imageUrl: string
  isActive: boolean
}

export type AcademyMaterialFormErrors = {
  title?: string
  type?: string
  url?: string
  imageUrl?: string
}

export const DEFAULT_ACADEMY_MATERIAL_FORM: AcademyMaterialFormValues = {
  title: '',
  description: '',
  type: '',
  url: '',
  imageUrl: '',
  isActive: true,
}

export function buildAcademyMaterialFormFromMaterial(
  material: {
    title: string
    description: string
    type: AcademyMaterialType
    url: string
    imageUrl?: string
    isActive: boolean
  },
): AcademyMaterialFormValues {
  return {
    title: material.title,
    description: material.description,
    type: material.type,
    url: material.url,
    imageUrl: material.imageUrl ?? '',
    isActive: material.isActive,
  }
}

const HTTP_URL_PATTERN = /^https?:\/\/.+/i

export function validateAcademyMaterialForm(
  values: AcademyMaterialFormValues,
): AcademyMaterialFormErrors {
  const errors: AcademyMaterialFormErrors = {}
  const title = values.title.trim()

  if (title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.'
  }

  if (!values.type) {
    errors.type = 'Selecciona un tipo de material.'
  }

  const url = values.url.trim()

  if (!url) {
    errors.url = 'La URL es obligatoria.'
  } else if (!HTTP_URL_PATTERN.test(url)) {
    errors.url = 'La URL debe comenzar con http:// o https://'
  }

  const imageUrl = values.imageUrl.trim()

  if (imageUrl && !HTTP_URL_PATTERN.test(imageUrl)) {
    errors.imageUrl = 'La URL de imagen debe comenzar con http:// o https://'
  }

  return errors
}

export function hasAcademyMaterialFormErrors(errors: AcademyMaterialFormErrors): boolean {
  return Object.keys(errors).length > 0
}
