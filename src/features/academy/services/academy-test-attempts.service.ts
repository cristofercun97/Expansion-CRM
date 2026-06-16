import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'
import type {
  AcademyTestAttempt,
  AcademyTestAttemptResult,
  SubmitTestAttemptInput,
} from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { buildSubmitTestAttemptPayload } from '@/features/academy/utils/academyTestAttemptUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapAcademyTestAttempt(id: string, data: DocumentData): AcademyTestAttempt | null {
  const answers = Array.isArray(data.answers) ? data.answers : []

  if (answers.length !== 5) {
    return null
  }

  const mappedAnswers = answers
    .map((answer) => {
      if (!answer || typeof answer !== 'object') {
        return null
      }

      const item = answer as Record<string, unknown>
      const selectedOptionIndex = item.selectedOptionIndex
      const correctOptionIndex = item.correctOptionIndex

      if (
        typeof item.questionIndex !== 'number' ||
        (selectedOptionIndex !== 0 &&
          selectedOptionIndex !== 1 &&
          selectedOptionIndex !== 2 &&
          selectedOptionIndex !== 3) ||
        (correctOptionIndex !== 0 &&
          correctOptionIndex !== 1 &&
          correctOptionIndex !== 2 &&
          correctOptionIndex !== 3) ||
        typeof item.isCorrect !== 'boolean'
      ) {
        return null
      }

      return {
        questionIndex: item.questionIndex,
        selectedOptionIndex,
        correctOptionIndex,
        isCorrect: item.isCorrect,
      }
    })
    .filter((answer): answer is AcademyTestAttempt['answers'][number] => answer !== null)

  if (mappedAnswers.length !== 5) {
    return null
  }

  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    materialId: typeof data.materialId === 'string' ? data.materialId : '',
    testId: typeof data.testId === 'string' ? data.testId : '',
    memberUid: typeof data.memberUid === 'string' ? data.memberUid : '',
    memberName: typeof data.memberName === 'string' ? data.memberName : '',
    memberEmail: typeof data.memberEmail === 'string' ? data.memberEmail : '',
    answers: mappedAnswers,
    correctAnswers: typeof data.correctAnswers === 'number' ? data.correctAnswers : 0,
    totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : 5,
    score: typeof data.score === 'number' ? data.score : 0,
    submittedAt: data.submittedAt ?? null,
    createdAt: data.createdAt ?? null,
  }
}

async function submitTestAttempt(
  input: SubmitTestAttemptInput,
  test: AcademyTest,
): Promise<AcademyTestAttemptResult> {
  const payload = buildSubmitTestAttemptPayload(input, test)
  const now = serverTimestamp()

  await addDoc(collection(getFirebaseDb(), COLLECTIONS.academyTestAttempts), {
    teamId: payload.teamId,
    materialId: payload.materialId,
    testId: payload.testId,
    memberUid: payload.memberUid,
    memberName: payload.memberName,
    memberEmail: payload.memberEmail,
    answers: payload.answers,
    correctAnswers: payload.correctAnswers,
    totalQuestions: payload.totalQuestions,
    score: payload.score,
    submittedAt: now,
    createdAt: now,
  })

  return {
    score: payload.score,
    correctAnswers: payload.correctAnswers,
    totalQuestions: payload.totalQuestions,
  }
}

async function getAttemptsByTest(testId: string, teamId: string): Promise<AcademyTestAttempt[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.academyTestAttempts),
      where('testId', '==', testId),
      where('teamId', '==', teamId),
    ),
  )

  return snapshot.docs
    .map((attemptDoc) => mapAcademyTestAttempt(attemptDoc.id, attemptDoc.data()))
    .filter((attempt): attempt is AcademyTestAttempt => attempt !== null)
    .sort((left, right) => {
      const leftTime = left.submittedAt?.toMillis?.() ?? 0
      const rightTime = right.submittedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

async function getAttemptsByTeamId(teamId: string): Promise<AcademyTestAttempt[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), COLLECTIONS.academyTestAttempts), where('teamId', '==', teamId)),
  )

  return snapshot.docs
    .map((attemptDoc) => mapAcademyTestAttempt(attemptDoc.id, attemptDoc.data()))
    .filter((attempt): attempt is AcademyTestAttempt => attempt !== null)
    .sort((left, right) => {
      const leftTime = left.submittedAt?.toMillis?.() ?? 0
      const rightTime = right.submittedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

async function getMyAttemptsForTest(
  testId: string,
  memberUid: string,
): Promise<AcademyTestAttempt[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.academyTestAttempts),
      where('testId', '==', testId),
      where('memberUid', '==', memberUid),
    ),
  )

  return snapshot.docs
    .map((attemptDoc) => mapAcademyTestAttempt(attemptDoc.id, attemptDoc.data()))
    .filter((attempt): attempt is AcademyTestAttempt => attempt !== null)
    .sort((left, right) => {
      const leftTime = left.submittedAt?.toMillis?.() ?? 0
      const rightTime = right.submittedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

export const academyTestAttemptsService = {
  submitTestAttempt,
  getAttemptsByTest,
  getAttemptsByTeamId,
  getMyAttemptsForTest,
}
