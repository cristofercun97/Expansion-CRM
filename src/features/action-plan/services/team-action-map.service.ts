import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import type {
  TeamActionMap,
  TeamActionMapAreaInput,
  TeamMapArea,
  UpsertTeamActionMapInput,
} from '@/features/action-plan/types/team-action-map.types'
import {
  getTeamMapPeriodLabel,
  parseTeamMapDate,
  parseTeamMapStatus,
  resolveLegacyMainObjective,
  resolveLegacyPeriodLabel,
  resolveLegacyPeriodType,
  resolveLegacyStatus,
} from '@/features/action-plan/utils/teamActionMapUtils'
import type { TeamActionMapDebugContext } from '@/features/action-plan/utils/teamActionMapDebug'
import {
  logTeamActionMapReadDebug,
  logTeamActionMapReadError,
} from '@/features/action-plan/utils/teamActionMapDebug'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapTeamMapArea(value: unknown, index: number): TeamMapArea | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const area = value as Record<string, unknown>
  const id = typeof area.id === 'string' ? area.id.trim() : ''
  const title = typeof area.title === 'string' ? area.title.trim() : ''

  if (!id || !title) {
    return null
  }

  const linkedTaskIds = Array.isArray(area.linkedTaskIds)
    ? area.linkedTaskIds.filter((item): item is string => typeof item === 'string')
    : undefined

  return {
    id,
    title,
    description: typeof area.description === 'string' ? area.description : '',
    objective: typeof area.objective === 'string' ? area.objective : '',
    indicator: typeof area.indicator === 'string' ? area.indicator : '',
    status: parseTeamMapStatus(area.status) ?? 'yellow',
    order: typeof area.order === 'number' ? area.order : index,
    linkedTaskIds,
  }
}

function mapTeamActionMapDocument(teamId: string, data: DocumentData): TeamActionMap {
  const rawAreas = Array.isArray(data.areas) ? data.areas : []
  const areas = rawAreas
    .map((area, index) => mapTeamMapArea(area, index))
    .filter((area): area is TeamMapArea => area !== null)
    .sort((left, right) => left.order - right.order)

  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined
  const periodType = resolveLegacyPeriodType(data.periodType)
  const periodLabel = resolveLegacyPeriodLabel(periodType, data.periodLabel)

  return {
    id: teamId,
    teamId: typeof data.teamId === 'string' ? data.teamId : teamId,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    title: typeof data.title === 'string' ? data.title : '',
    description,
    vision: typeof data.vision === 'string' ? data.vision : '',
    mainObjective: resolveLegacyMainObjective(data.mainObjective, data.description),
    periodType,
    periodLabel,
    startDate: parseTeamMapDate(data.startDate),
    endDate: parseTeamMapDate(data.endDate),
    status: resolveLegacyStatus(data.status),
    isActive: data.isActive === true,
    areas,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function normalizeAreas(areas: TeamActionMapAreaInput[]): TeamMapArea[] {
  return areas
    .map((area, index) => ({
      id: area.id?.trim() || crypto.randomUUID(),
      title: area.title.trim(),
      description: area.description?.trim() ?? '',
      objective: area.objective?.trim() ?? '',
      indicator: area.indicator?.trim() ?? '',
      status: area.status ?? 'yellow',
      order: index,
      linkedTaskIds: area.linkedTaskIds ?? [],
    }))
    .filter((area) => area.title.length >= 2)
}

function buildMapPayload(input: UpsertTeamActionMapInput) {
  const description = input.description?.trim() ?? ''
  const periodLabel = getTeamMapPeriodLabel(input.periodType)

  return {
    title: input.title.trim(),
    description,
    vision: input.vision.trim(),
    mainObjective: input.mainObjective.trim(),
    periodType: input.periodType,
    periodLabel,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    areas: normalizeAreas(input.areas),
    isActive: true,
    updatedAt: serverTimestamp(),
  }
}

async function getTeamActionMap(
  teamId: string,
  debugContext?: TeamActionMapDebugContext,
): Promise<TeamActionMap | null> {
  const normalizedTeamId = teamId.trim()

  if (!normalizedTeamId) {
    return null
  }

  if (debugContext) {
    logTeamActionMapReadDebug({
      ...debugContext,
      teamIdUsed: normalizedTeamId,
    })
  }

  try {
    const snapshot = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.teamActionMaps, normalizedTeamId),
    )

    if (!snapshot.exists()) {
      return null
    }

    return mapTeamActionMapDocument(normalizedTeamId, snapshot.data())
  } catch (error) {
    if (debugContext) {
      logTeamActionMapReadError(
        {
          ...debugContext,
          teamIdUsed: normalizedTeamId,
        },
        error,
      )
    }

    throw error
  }
}

async function createTeamActionMap(
  ownerUid: string,
  teamId: string,
  input: UpsertTeamActionMapInput,
): Promise<void> {
  const payload = {
    teamId,
    ownerUid,
    ...buildMapPayload(input),
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(getFirebaseDb(), COLLECTIONS.teamActionMaps, teamId), payload)
}

async function updateTeamActionMap(teamId: string, input: UpsertTeamActionMapInput): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.teamActionMaps, teamId), buildMapPayload(input))
}

async function linkTaskToArea(teamId: string, areaId: string, taskId: string): Promise<void> {
  const normalizedTeamId = teamId.trim()
  const normalizedAreaId = areaId.trim()
  const normalizedTaskId = taskId.trim()

  if (!normalizedTeamId || !normalizedAreaId || !normalizedTaskId) {
    return
  }

  const existingMap = await getTeamActionMap(normalizedTeamId)

  if (!existingMap) {
    return
  }

  const targetArea = existingMap.areas.find((area) => area.id === normalizedAreaId)

  if (!targetArea) {
    return
  }

  const linkedTaskIds = targetArea.linkedTaskIds ?? []

  if (linkedTaskIds.includes(normalizedTaskId)) {
    return
  }

  await updateTeamActionMap(normalizedTeamId, {
    title: existingMap.title,
    description: existingMap.description,
    vision: existingMap.vision,
    mainObjective: existingMap.mainObjective,
    periodType: existingMap.periodType,
    startDate: existingMap.startDate,
    endDate: existingMap.endDate,
    status: existingMap.status,
    areas: existingMap.areas.map((area) => ({
      id: area.id,
      title: area.title,
      description: area.description,
      objective: area.objective,
      indicator: area.indicator,
      status: area.status,
      order: area.order,
      linkedTaskIds:
        area.id === normalizedAreaId
          ? [...(area.linkedTaskIds ?? []), normalizedTaskId]
          : area.linkedTaskIds,
    })),
  })
}

export const teamActionMapService = {
  getTeamActionMap,
  createTeamActionMap,
  updateTeamActionMap,
  linkTaskToArea,
}
