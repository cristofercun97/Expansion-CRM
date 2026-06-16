import type { Timestamp } from 'firebase/firestore'

export const ACADEMY_TEST_QUESTION_COUNT = 5
export const ACADEMY_TEST_OPTION_COUNT = 4

export type AcademyTestCorrectOptionIndex = 0 | 1 | 2 | 3

export type AcademyTestQuestion = {
  questionText: string
  options: [string, string, string, string]
  correctOptionIndex: AcademyTestCorrectOptionIndex
}

export type AcademyTest = {
  id: string
  ownerUid: string
  teamId?: string
  materialId: string
  title: string
  questions: AcademyTestQuestion[]
  isActive: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type UpsertAcademyTestInput = {
  title: string
  questions: AcademyTestQuestion[]
  isActive: boolean
}
