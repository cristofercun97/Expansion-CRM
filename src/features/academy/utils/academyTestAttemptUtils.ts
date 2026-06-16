import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import type {
  AcademyTestAttemptAnswer,
  AcademyTestAttemptResult,
  SubmitTestAttemptInput,
} from '@/features/academy/types/academy-test-attempt.types'
import { ACADEMY_TEST_QUESTION_COUNT } from '@/features/academy/types/academy-test.types'
import type { AcademyTestCorrectOptionIndex } from '@/features/academy/types/academy-test.types'

export function calculateTestAttemptResult(
  test: AcademyTest,
  selectedAnswers: AcademyTestCorrectOptionIndex[],
): AcademyTestAttemptResult & { answers: AcademyTestAttemptAnswer[] } {
  if (selectedAnswers.length !== ACADEMY_TEST_QUESTION_COUNT) {
    throw new Error('Debes responder las 5 preguntas del test.')
  }

  const answers = test.questions.map((question, questionIndex) => {
    const selectedOptionIndex = selectedAnswers[questionIndex]

    return {
      questionIndex,
      selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect: selectedOptionIndex === question.correctOptionIndex,
    }
  })

  const correctAnswers = answers.filter((answer) => answer.isCorrect).length
  const totalQuestions = ACADEMY_TEST_QUESTION_COUNT
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  return {
    answers,
    correctAnswers,
    totalQuestions,
    score,
  }
}

export function buildSubmitTestAttemptPayload(
  input: SubmitTestAttemptInput,
  test: AcademyTest,
): Omit<SubmitTestAttemptInput, 'selectedAnswers'> &
  AcademyTestAttemptResult & { answers: AcademyTestAttemptAnswer[] } {
  const result = calculateTestAttemptResult(test, input.selectedAnswers)

  return {
    teamId: input.teamId,
    materialId: input.materialId,
    testId: input.testId,
    memberUid: input.memberUid,
    memberName: input.memberName.trim(),
    memberEmail: input.memberEmail.trim(),
    ...result,
  }
}
