import type { Timestamp } from 'firebase/firestore'

export const ACADEMY_MATERIAL_TYPES = ['presentation', 'pdf', 'video'] as const

export type AcademyMaterialType = (typeof ACADEMY_MATERIAL_TYPES)[number]

export type AcademyMaterial = {
  id: string
  ownerUid: string
  teamId?: string
  title: string
  description: string
  type: AcademyMaterialType
  url: string
  imageUrl?: string
  isActive: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateAcademyMaterialInput = {
  title: string
  description: string
  type: AcademyMaterialType
  url: string
  imageUrl?: string
  isActive: boolean
}

export type UpdateAcademyMaterialInput = CreateAcademyMaterialInput
