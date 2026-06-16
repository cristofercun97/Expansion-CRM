import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { academyService } from '@/features/academy/services/academy.service'
import { academyTestsService } from '@/features/academy/services/academy-tests.service'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

export type SyncLegacyAcademyContentResult = {
  materialsUpdated: number
  testsUpdated: number
}

function isLegacyMaterialWithoutTeamId(
  material: AcademyMaterial,
  ownerUid: string,
): boolean {
  return material.ownerUid === ownerUid && !material.teamId
}

function isLegacyTestForMaterial(
  test: AcademyTest,
  ownerUid: string,
  legacyMaterialIds: Set<string>,
): boolean {
  return (
    test.ownerUid === ownerUid &&
    !test.teamId &&
    legacyMaterialIds.has(test.materialId)
  )
}

export async function hasLegacyAcademyContent(ownerUid: string): Promise<boolean> {
  const [materials, tests] = await Promise.all([
    academyService.getAcademyMaterialsByOwner(ownerUid),
    academyTestsService.getAcademyTestsByOwner(ownerUid),
  ])

  const legacyMaterialIds = new Set(
    materials.filter((material) => isLegacyMaterialWithoutTeamId(material, ownerUid)).map(
      (material) => material.id,
    ),
  )

  if (legacyMaterialIds.size > 0) {
    return true
  }

  return tests.some((test) => isLegacyTestForMaterial(test, ownerUid, legacyMaterialIds))
}

export async function syncLegacyAcademyContentToOwnedTeam(
  ownerUid: string,
  ownedTeamId: string,
): Promise<SyncLegacyAcademyContentResult> {
  const team = await teamService.getTeamById(ownedTeamId)

  if (!team || team.ownerUid !== ownerUid) {
    throw new Error('No tienes permiso para sincronizar materiales con este grupo.')
  }

  const [materials, tests] = await Promise.all([
    academyService.getAcademyMaterialsByOwner(ownerUid),
    academyTestsService.getAcademyTestsByOwner(ownerUid),
  ])

  const legacyMaterials = materials.filter((material) =>
    isLegacyMaterialWithoutTeamId(material, ownerUid),
  )
  const legacyMaterialIds = new Set(legacyMaterials.map((material) => material.id))
  const legacyTests = tests.filter((test) =>
    isLegacyTestForMaterial(test, ownerUid, legacyMaterialIds),
  )

  if (legacyMaterials.length === 0 && legacyTests.length === 0) {
    return {
      materialsUpdated: 0,
      testsUpdated: 0,
    }
  }

  const db = getFirebaseDb()
  const now = serverTimestamp()

  await Promise.all([
    ...legacyMaterials.map((material) =>
      updateDoc(doc(db, COLLECTIONS.academyMaterials, material.id), {
        teamId: ownedTeamId,
        updatedAt: now,
      }),
    ),
    ...legacyTests.map((test) =>
      updateDoc(doc(db, COLLECTIONS.academyTests, test.id), {
        teamId: ownedTeamId,
        updatedAt: now,
      }),
    ),
  ])

  return {
    materialsUpdated: legacyMaterials.length,
    testsUpdated: legacyTests.length,
  }
}
