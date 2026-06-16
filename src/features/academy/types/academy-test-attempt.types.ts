import type { Timestamp } from 'firebase/firestore'
import type { AcademyTestCorrectOptionIndex } from '@/features/academy/types/academy-test.types'
import { ACADEMY_TEST_QUESTION_COUNT } from '@/features/academy/types/academy-test.types'

export type AcademyTestAttemptAnswer = {
  questionIndex: number
  selectedOptionIndex: AcademyTestCorrectOptionIndex
  correctOptionIndex: AcademyTestCorrectOptionIndex
  isCorrect: boolean
}

export type AcademyTestAttempt = {
  id: string
  teamId: string
  materialId: string
  testId: string
  memberUid: string
  memberName: string
  memberEmail: string
  answers: AcademyTestAttemptAnswer[]
  correctAnswers: number
  totalQuestions: number
  score: number
  submittedAt: Timestamp | null
  createdAt: Timestamp | null
}

export type SubmitTestAttemptInput = {
  teamId: string
  materialId: string
  testId: string
  memberUid: string
  memberName: string
  memberEmail: string
  selectedAnswers: AcademyTestCorrectOptionIndex[]
}

export type AcademyTestAttemptResult = {
  score: number
  correctAnswers: number
  totalQuestions: typeof ACADEMY_TEST_QUESTION_COUNT
}
