import {
  addDoc,
  collection,
  deleteDoc,
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
import type {
  AcademyMaterial,
  CreateAcademyMaterialInput,
  UpdateAcademyMaterialInput,
} from '@/features/academy/types/academy.types'
import { isLegacyManagedMaterial } from '@/features/academy/utils/academyTeamAccess'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapAcademyMaterialDocument(
  id: string,
  data: DocumentData,
): AcademyMaterial {
  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    teamId: typeof data.teamId === 'string' && data.teamId.length > 0 ? data.teamId : undefined,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    type:
      data.type === 'presentation' || data.type === 'pdf' || data.type === 'video'
        ? data.type
        : 'presentation',
    url: typeof data.url === 'string' ? data.url : '',
    imageUrl: typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0
      ? data.imageUrl.trim()
      : undefined,
    isActive: data.isActive === true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function sortMaterialsByCreatedAtDesc(materials: AcademyMaterial[]): AcademyMaterial[] {
  return [...materials].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): AcademyMaterial[] {
  return docs.map((materialDoc) =>
    mapAcademyMaterialDocument(materialDoc.id, materialDoc.data()),
  )
}

function mergeMaterialsById(materialGroups: AcademyMaterial[][]): AcademyMaterial[] {
  const merged = new Map<string, AcademyMaterial>()

  for (const materials of materialGroups) {
    for (const material of materials) {
      merged.set(material.id, material)
    }
  }

  return sortMaterialsByCreatedAtDesc(Array.from(merged.values()))
}

async function getAcademyMaterialsByTeamId(teamId: string): Promise<AcademyMaterial[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.academyMaterials)
  const snapshot = await getDocs(query(collectionRef, where('teamId', '==', teamId)))

  return sortMaterialsByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function getMemberAcademyMaterials(memberTeamId: string): Promise<AcademyMaterial[]> {
  const team = await teamService.getTeamById(memberTeamId)

  if (!team) {
    return getAcademyMaterialsByTeamId(memberTeamId)
  }

  const leaderOwnedTeamId = await teamService.getTeamOwnerOwnedTeamId(team.ownerUid)
  const teamIdsToFetch = [memberTeamId]

  if (leaderOwnedTeamId && leaderOwnedTeamId !== memberTeamId) {
    teamIdsToFetch.push(leaderOwnedTeamId)
  }

  const [teamMaterialGroups, ownerMaterials] = await Promise.all([
    Promise.all(teamIdsToFetch.map((teamId) => getAcademyMaterialsByTeamId(teamId))),
    getAcademyMaterialsByOwner(team.ownerUid),
  ])

  const legacyMaterials = ownerMaterials.filter(
    (material) => material.ownerUid === team.ownerUid && !material.teamId,
  )

  return mergeMaterialsById([...teamMaterialGroups, legacyMaterials])
}

async function getAcademyMaterialsByOwner(uid: string): Promise<AcademyMaterial[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.academyMaterials)
  const snapshot = await getDocs(query(collectionRef, where('ownerUid', '==', uid)))

  return sortMaterialsByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function getManagedAcademyMaterials(
  ownerUid: string,
  ownedTeamId: string | null,
): Promise<AcademyMaterial[]> {
  if (!ownedTeamId) {
    const legacyMaterials = await getAcademyMaterialsByOwner(ownerUid)
    return legacyMaterials.filter((material) => !material.teamId)
  }

  const [teamMaterials, ownerMaterials] = await Promise.all([
    getAcademyMaterialsByTeamId(ownedTeamId),
    getAcademyMaterialsByOwner(ownerUid),
  ])

  const legacyMaterials = ownerMaterials.filter((material) =>
    isLegacyManagedMaterial(material, ownerUid, ownedTeamId),
  )

  return mergeMaterialsById([teamMaterials, legacyMaterials])
}

async function createAcademyMaterial(
  uid: string,
  ownedTeamId: string | null,
  data: CreateAcademyMaterialInput,
): Promise<AcademyMaterial> {
  if (!ownedTeamId) {
    throw new Error('Necesitas un grupo propio activo para crear materiales.')
  }

  const imageUrl = data.imageUrl?.trim() ?? ''
  const document = {
    ownerUid: uid,
    teamId: ownedTeamId,
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    url: data.url.trim(),
    imageUrl,
    isActive: data.isActive,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.academyMaterials), document)

  const now = Timestamp.now()

  return {
    id: docRef.id,
    ownerUid: uid,
    teamId: ownedTeamId,
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    url: data.url.trim(),
    imageUrl: imageUrl || undefined,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  }
}

async function updateAcademyMaterial(
  materialId: string,
  existing: AcademyMaterial,
  data: UpdateAcademyMaterialInput,
  ownedTeamId?: string | null,
): Promise<AcademyMaterial> {
  const imageUrl = data.imageUrl?.trim() ?? ''
  const updatePayload: Record<string, unknown> = {
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    url: data.url.trim(),
    imageUrl,
    isActive: data.isActive,
    updatedAt: serverTimestamp(),
  }

  if (!existing.teamId && ownedTeamId) {
    updatePayload.teamId = ownedTeamId
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.academyMaterials, materialId), updatePayload)

  return {
    ...existing,
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    url: data.url.trim(),
    imageUrl: imageUrl || undefined,
    isActive: data.isActive,
    teamId: existing.teamId ?? ownedTeamId ?? undefined,
    updatedAt: Timestamp.now(),
  }
}

async function deleteAcademyMaterial(materialId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTIONS.academyMaterials, materialId))
}

export const academyService = {
  getAcademyMaterialsByTeamId,
  getAcademyMaterialsByOwner,
  getManagedAcademyMaterials,
  getMemberAcademyMaterials,
  createAcademyMaterial,
  updateAcademyMaterial,
  deleteAcademyMaterial,
}
