import type {
  AcademyTestCorrectOptionIndex,
  AcademyTestQuestion,
} from '@/features/academy/types/academy-test.types'
import { ACADEMY_TEST_QUESTION_COUNT } from '@/features/academy/types/academy-test.types'

export type AcademyTestQuestionFormValues = {
  questionText: string
  options: [string, string, string, string]
  correctOptionIndex: AcademyTestCorrectOptionIndex | null
}

export type AcademyTestFormValues = {
  title: string
  isActive: boolean
  questions: AcademyTestQuestionFormValues[]
}

export type AcademyTestFormErrors = {
  title?: string
  questions?: Array<{
    questionText?: string
    options?: string[]
    correctOptionIndex?: string
  }>
}

export const ACADEMY_TEST_OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

function createEmptyQuestion(): AcademyTestQuestionFormValues {
  return {
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: null,
  }
}

export function createDefaultAcademyTestForm(): AcademyTestFormValues {
  return {
    title: '',
    isActive: true,
    questions: Array.from({ length: ACADEMY_TEST_QUESTION_COUNT }, createEmptyQuestion),
  }
}

export function buildAcademyTestFormFromQuestions(
  title: string,
  isActive: boolean,
  questions: AcademyTestQuestion[],
): AcademyTestFormValues {
  return {
    title,
    isActive,
    questions: questions.map((question) => ({
      questionText: question.questionText,
      options: [...question.options] as [string, string, string, string],
      correctOptionIndex: question.correctOptionIndex,
    })),
  }
}

export function validateAcademyTestForm(values: AcademyTestFormValues): AcademyTestFormErrors {
  const errors: AcademyTestFormErrors = {}
  const title = values.title.trim()

  if (title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.'
  }

  const questionErrors: NonNullable<AcademyTestFormErrors['questions']> = []

  values.questions.forEach((question, index) => {
    const itemErrors: NonNullable<AcademyTestFormErrors['questions']>[number] = {}

    if (!question.questionText.trim()) {
      itemErrors.questionText = 'La pregunta es obligatoria.'
    }

    const optionErrors: string[] = []
    question.options.forEach((option, optionIndex) => {
      if (!option.trim()) {
        optionErrors[optionIndex] =
          `La opción ${ACADEMY_TEST_OPTION_LABELS[optionIndex]} es obligatoria.`
      }
    })

    if (optionErrors.length > 0) {
      itemErrors.options = optionErrors
    }

    if (question.correctOptionIndex === null) {
      itemErrors.correctOptionIndex = 'Selecciona la respuesta correcta.'
    }

    if (Object.keys(itemErrors).length > 0) {
      questionErrors[index] = itemErrors
    }
  })

  if (questionErrors.some(Boolean)) {
    errors.questions = questionErrors
  }

  return errors
}

export function hasAcademyTestFormErrors(errors: AcademyTestFormErrors): boolean {
  if (errors.title) {
    return true
  }

  if (!errors.questions) {
    return false
  }

  return errors.questions.some(
    (questionError) =>
      questionError &&
      (Boolean(questionError.questionText) ||
        Boolean(questionError.correctOptionIndex) ||
        Boolean(questionError.options?.some(Boolean))),
  )
}

export function toUpsertAcademyTestQuestions(
  values: AcademyTestFormValues,
): AcademyTestQuestion[] {
  return values.questions.map((question) => ({
    questionText: question.questionText.trim(),
    options: question.options.map((option) => option.trim()) as [
      string,
      string,
      string,
      string,
    ],
    correctOptionIndex: question.correctOptionIndex as AcademyTestCorrectOptionIndex,
  }))
}
