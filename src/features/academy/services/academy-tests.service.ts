import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type {
  AcademyTest,
  AcademyTestQuestion,
  UpsertAcademyTestInput,
} from '@/features/academy/types/academy-test.types'
import { ACADEMY_TEST_OPTION_COUNT, ACADEMY_TEST_QUESTION_COUNT } from '@/features/academy/types/academy-test.types'
import { isLegacyManagedMaterial } from '@/features/academy/utils/academyTeamAccess'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function isCorrectOptionIndex(value: unknown): value is 0 | 1 | 2 | 3 {
  return value === 0 || value === 1 || value === 2 || value === 3
}

function mapQuestion(value: unknown): AcademyTestQuestion | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const question = value as Record<string, unknown>
  const options = question.options

  if (!Array.isArray(options) || options.length !== ACADEMY_TEST_OPTION_COUNT) {
    return null
  }

  if (!options.every((option) => typeof option === 'string')) {
    return null
  }

  if (!isCorrectOptionIndex(question.correctOptionIndex)) {
    return null
  }

  if (typeof question.questionText !== 'string') {
    return null
  }

  return {
    questionText: question.questionText,
    options: options as [string, string, string, string],
    correctOptionIndex: question.correctOptionIndex,
  }
}

function mapAcademyTestDocument(id: string, data: DocumentData): AcademyTest | null {
  const questions = Array.isArray(data.questions) ? data.questions : []
  const mappedQuestions = questions
    .map((question) => mapQuestion(question))
    .filter((question): question is AcademyTestQuestion => question !== null)

  if (mappedQuestions.length !== ACADEMY_TEST_QUESTION_COUNT) {
    return null
  }

  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    teamId: typeof data.teamId === 'string' && data.teamId.length > 0 ? data.teamId : undefined,
    materialId: typeof data.materialId === 'string' ? data.materialId : '',
    title: typeof data.title === 'string' ? data.title : '',
    questions: mappedQuestions,
    isActive: data.isActive === true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): AcademyTest[] {
  return docs
    .map((testDoc) => mapAcademyTestDocument(testDoc.id, testDoc.data()))
    .filter((test): test is AcademyTest => test !== null)
}

function buildTestsByMaterialId(tests: AcademyTest[]): Record<string, AcademyTest> {
  return Object.fromEntries(tests.map((test) => [test.materialId, test]))
}

function mergeTestsById(testGroups: AcademyTest[][]): AcademyTest[] {
  const merged = new Map<string, AcademyTest>()

  for (const tests of testGroups) {
    for (const test of tests) {
      merged.set(test.id, test)
    }
  }

  return Array.from(merged.values())
}

async function getAcademyTestsByTeamId(teamId: string): Promise<AcademyTest[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.academyTests)
  const snapshot = await getDocs(query(collectionRef, where('teamId', '==', teamId)))

  return mapSnapshotDocs(snapshot.docs)
}

async function getAcademyTestsByOwner(ownerUid: string): Promise<AcademyTest[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.academyTests)
  const snapshot = await getDocs(query(collectionRef, where('ownerUid', '==', ownerUid)))

  return mapSnapshotDocs(snapshot.docs)
}

async function getManagedAcademyTests(
  ownerUid: string,
  ownedTeamId: string | null,
): Promise<AcademyTest[]> {
  if (!ownedTeamId) {
    const legacyTests = await getAcademyTestsByOwner(ownerUid)
    return legacyTests.filter((test) => !test.teamId)
  }

  const [teamTests, ownerTests] = await Promise.all([
    getAcademyTestsByTeamId(ownedTeamId),
    getAcademyTestsByOwner(ownerUid),
  ])

  const legacyTests = ownerTests.filter((test) => {
    if (test.teamId === ownedTeamId) {
      return true
    }

    return !test.teamId && test.ownerUid === ownerUid
  })

  return mergeTestsById([teamTests, legacyTests])
}

async function getMemberAcademyTests(
  memberTeamId: string,
  materialIds: string[],
): Promise<AcademyTest[]> {
  const team = await teamService.getTeamById(memberTeamId)

  if (!team) {
    return getAcademyTestsByTeamId(memberTeamId)
  }

  const leaderOwnedTeamId = await teamService.getTeamOwnerOwnedTeamId(team.ownerUid)
  const teamIdsToFetch = [memberTeamId]

  if (leaderOwnedTeamId && leaderOwnedTeamId !== memberTeamId) {
    teamIdsToFetch.push(leaderOwnedTeamId)
  }

  const materialIdSet = new Set(materialIds)
  const [teamTestGroups, ownerTests] = await Promise.all([
    Promise.all(teamIdsToFetch.map((teamId) => getAcademyTestsByTeamId(teamId))),
    getAcademyTestsByOwner(team.ownerUid),
  ])

  const legacyTests = ownerTests.filter(
    (test) =>
      test.ownerUid === team.ownerUid &&
      !test.teamId &&
      materialIdSet.has(test.materialId),
  )

  return mergeTestsById([...teamTestGroups, legacyTests])
}

async function getAcademyTestByMaterial(
  ownerUid: string,
  materialId: string,
): Promise<AcademyTest | null> {
  const tests = await getAcademyTestsByOwner(ownerUid)
  return tests.find((test) => test.materialId === materialId) ?? null
}

function assertCanManageMaterialTest(
  material: AcademyMaterial,
  ownerUid: string,
  ownedTeamId: string | null,
): void {
  if (!isLegacyManagedMaterial(material, ownerUid, ownedTeamId)) {
    throw new Error('No tienes permiso para administrar el test de este material.')
  }
}

async function upsertAcademyTest(
  ownerUid: string,
  ownedTeamId: string | null,
  material: AcademyMaterial,
  data: UpsertAcademyTestInput,
): Promise<AcademyTest> {
  assertCanManageMaterialTest(material, ownerUid, ownedTeamId)

  const existing = await getAcademyTestByMaterial(ownerUid, material.id)
  const teamId = material.teamId ?? ownedTeamId ?? undefined

  if (!teamId) {
    throw new Error('Este material no pertenece a un grupo que puedas administrar.')
  }

  const payload = {
    ownerUid,
    teamId,
    materialId: material.id,
    title: data.title.trim(),
    questions: data.questions,
    isActive: data.isActive,
    updatedAt: serverTimestamp(),
  }

  if (existing) {
    await updateDoc(doc(getFirebaseDb(), COLLECTIONS.academyTests, existing.id), payload)

    return {
      ...existing,
      teamId,
      title: data.title.trim(),
      questions: data.questions,
      isActive: data.isActive,
      updatedAt: Timestamp.now(),
    }
  }

  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.academyTests), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  const now = Timestamp.now()

  return {
    id: docRef.id,
    ownerUid,
    teamId,
    materialId: material.id,
    title: data.title.trim(),
    questions: data.questions,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  }
}

export const academyTestsService = {
  getAcademyTestsByTeamId,
  getAcademyTestsByOwner,
  getManagedAcademyTests,
  getMemberAcademyTests,
  getAcademyTestByMaterial,
  upsertAcademyTest,
  buildTestsByMaterialId,
}
