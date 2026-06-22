import { doc, getDoc, type DocumentData } from 'firebase/firestore'
import { actionTaskProgressService } from '@/features/action-plan/services/action-task-progress.service'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import type {
  RecognitionRankingRawData,
  WeeklyRankingEntry,
  WeeklyRecognitionRanking,
} from '@/features/recognitions/types/recognition-ranking.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import {
  logRecognitionRankingError,
  logRecognitionRankingSourceDebug,
} from '@/features/recognitions/utils/recognitionRankingDebug'
import type { TeamMember } from '@/features/team/types/team.types'
import {
  buildPersonalWeeklyRankingEntry,
  buildWeeklyRecognitionRanking,
  getCurrentRecognitionWeekPeriod,
  snapshotToWeeklyRecognitionRanking,
  weeklyRecognitionRankingToSnapshotInput,
} from '@/features/recognitions/utils/recognitionScoring'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import { remindersService } from '@/features/reminders/services/reminders.service'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

type RecognitionRankingLoadContext = {
  authUid?: string | null
  viewRole: RecognitionsViewRole
}

function mapTeamMemberDocument(id: string, data: DocumentData): TeamMember {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    memberUid: typeof data.memberUid === 'string' ? data.memberUid : '',
    memberName:
      typeof data.memberName === 'string' && data.memberName.trim().length > 0
        ? data.memberName.trim()
        : undefined,
    memberEmail:
      typeof data.memberEmail === 'string' && data.memberEmail.trim().length > 0
        ? data.memberEmail.trim()
        : undefined,
    role: data.role === 'owner' ? 'owner' : 'member',
    status: data.status === 'active' ? 'active' : 'active',
    joinedAt: data.joinedAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

async function getOwnTeamMember(teamId: string, memberUid: string): Promise<TeamMember | null> {
  const normalizedTeamId = teamId.trim()
  const normalizedMemberUid = memberUid.trim()

  if (!normalizedTeamId || !normalizedMemberUid) {
    return null
  }

  const memberDoc = await getDoc(
    doc(getFirebaseDb(), COLLECTIONS.teamMembers, `${normalizedTeamId}_${normalizedMemberUid}`),
  )

  if (!memberDoc.exists()) {
    return null
  }

  return mapTeamMemberDocument(memberDoc.id, memberDoc.data())
}

async function loadLeaderRecognitionRankingRawData(
  teamId: string,
  context: RecognitionRankingLoadContext,
): Promise<RecognitionRankingRawData> {
  const normalizedTeamId = teamId.trim()
  const loadWarnings: string[] = []
  const period = getCurrentRecognitionWeekPeriod()

  logRecognitionRankingSourceDebug({
    source: 'teamMembers',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })
  logRecognitionRankingSourceDebug({
    source: 'engagements',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })
  logRecognitionRankingSourceDebug({
    source: 'attempts',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })
  logRecognitionRankingSourceDebug({
    source: 'taskProgress',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })
  logRecognitionRankingSourceDebug({
    source: 'reminders',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })
  logRecognitionRankingSourceDebug({
    source: 'salesReports',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole,
  })

  const team = await teamService.getTeamById(normalizedTeamId)

  if (!team) {
    throw new Error('No encontramos el equipo para calcular el ranking.')
  }

  const [membersResult, engagementsResult, attemptsResult, progressResult, remindersResult, salesReportsResult] =
    await Promise.all([
      teamService
        .getTeamMembersByTeamId(normalizedTeamId, team.ownerUid)
        .then((members) => ({ data: members, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.teamMembers',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar la lista de miembros del equipo.',
          }
        }),
      academyMaterialEngagementsService
        .getEngagementsByTeamId(normalizedTeamId)
        .then((engagements) => ({ data: engagements, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.engagements',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar la actividad de Academia para el ranking.',
          }
        }),
      academyTestAttemptsService
        .getAttemptsByTeamId(normalizedTeamId)
        .then((attempts) => ({ data: attempts, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.attempts',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar los tests de Academia para el ranking.',
          }
        }),
      actionTaskProgressService
        .getProgressByTeamId(normalizedTeamId)
        .then((taskProgress) => ({ data: taskProgress, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.taskProgress',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar el avance del Plan de Acción para el ranking.',
          }
        }),
      remindersService
        .getTeamReminders(normalizedTeamId)
        .then((reminders) => ({ data: reminders, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.reminders',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar los recordatorios para el ranking.',
          }
        }),
      salesGoalService
        .getValidatedReportsForRanking(normalizedTeamId, period)
        .then((salesReports) => ({ data: salesReports, warning: '' }))
        .catch((error) => {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error,
              authUid: context.authUid,
              viewRole: context.viewRole,
              teamId: normalizedTeamId,
              period,
              failedStep: 'leader.salesReports',
            })
          }

          return {
            data: [],
            warning: 'No pudimos cargar el impacto comercial validado para el ranking.',
          }
        }),
    ])

  for (const warning of [
    membersResult.warning,
    engagementsResult.warning,
    attemptsResult.warning,
    progressResult.warning,
    remindersResult.warning,
    salesReportsResult.warning,
  ]) {
    if (warning) {
      loadWarnings.push(warning)
    }
  }

  return {
    teamId: normalizedTeamId,
    members: membersResult.data,
    engagements: engagementsResult.data,
    attempts: attemptsResult.data,
    taskProgress: progressResult.data,
    reminders: remindersResult.data,
    salesReports: salesReportsResult.data,
    loadWarnings,
  }
}

async function loadMemberPersonalRankingRawData(
  teamId: string,
  memberUid: string,
): Promise<RecognitionRankingRawData> {
  const normalizedTeamId = teamId.trim()
  const normalizedMemberUid = memberUid.trim()
  const loadWarnings: string[] = []
  const period = getCurrentRecognitionWeekPeriod()

  const member = await getOwnTeamMember(normalizedTeamId, normalizedMemberUid)

  if (!member) {
    throw new Error('No encontramos tu membresía en el equipo.')
  }

  const [engagementsResult, attemptsResult, progressResult, remindersResult, salesReportsResult] =
    await Promise.all([
    academyMaterialEngagementsService
      .getMyEngagementsByTeamId(normalizedTeamId, normalizedMemberUid)
      .then((engagements) => ({ data: engagements, warning: '' }))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[recognition-ranking] Failed to load personal academy engagements', error)
        }

        return {
          data: [],
          warning: 'No pudimos cargar tu actividad de Academia.',
        }
      }),
    academyTestAttemptsService
      .getMyAttemptsByTeamId(normalizedTeamId, normalizedMemberUid)
      .then((attempts) => ({ data: attempts, warning: '' }))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[recognition-ranking] Failed to load personal academy attempts', error)
        }

        return {
          data: [],
          warning: 'No pudimos cargar tus tests de Academia.',
        }
      }),
    actionTaskProgressService
      .getMyProgressByTeamId(normalizedTeamId, normalizedMemberUid)
      .then((taskProgress) => ({ data: taskProgress, warning: '' }))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[recognition-ranking] Failed to load personal action task progress', error)
        }

        return {
          data: [],
          warning: 'No pudimos cargar tu avance del Plan de Acción.',
        }
      }),
    remindersService
      .getMyReminders(normalizedMemberUid)
      .then((reminders) => ({
        data: reminders.filter((reminder) => reminder.teamId === normalizedTeamId),
        warning: '',
      }))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[recognition-ranking] Failed to load personal reminders', error)
        }

        return {
          data: [],
          warning: 'No pudimos cargar tus recordatorios.',
        }
      }),
    salesGoalService
      .getMemberValidatedReportsForRanking(normalizedTeamId, normalizedMemberUid, period)
      .then((salesReports) => ({ data: salesReports, warning: '' }))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[recognition-ranking] Failed to load personal validated sales', error)
        }

        return {
          data: [],
          warning: 'No pudimos cargar tu impacto comercial validado.',
        }
      }),
  ])

  for (const warning of [
    engagementsResult.warning,
    attemptsResult.warning,
    progressResult.warning,
    remindersResult.warning,
    salesReportsResult.warning,
  ]) {
    if (warning) {
      loadWarnings.push(warning)
    }
  }

  return {
    teamId: normalizedTeamId,
    members: [member],
    engagements: engagementsResult.data,
    attempts: attemptsResult.data,
    taskProgress: progressResult.data,
    reminders: remindersResult.data,
    salesReports: salesReportsResult.data,
    loadWarnings,
  }
}

async function getWeeklyRecognitionRankingForLeader(
  teamId: string,
  context: RecognitionRankingLoadContext,
): Promise<WeeklyRecognitionRanking> {
  const rawData = await loadLeaderRecognitionRankingRawData(teamId, context)
  return buildWeeklyRecognitionRanking(rawData, getCurrentRecognitionWeekPeriod())
}

async function getMemberPersonalWeeklyEntry(
  teamId: string,
  memberUid: string,
): Promise<WeeklyRankingEntry | null> {
  try {
    const rawData = await loadMemberPersonalRankingRawData(teamId, memberUid)
    const member = rawData.members[0]

    if (!member) {
      return null
    }

    return buildPersonalWeeklyRankingEntry(member, rawData, getCurrentRecognitionWeekPeriod())
  } catch {
    return null
  }
}

async function getPublishedWeeklyRecognitionRanking(
  teamId: string,
  context: RecognitionRankingLoadContext,
): Promise<WeeklyRecognitionRanking | null> {
  const snapshot = await recognitionWeeklySnapshotService.getPublishedSnapshotByPeriod(
    teamId,
    getCurrentRecognitionWeekPeriod(),
    {
      teamId,
      authUid: context.authUid,
      viewRole: context.viewRole,
    },
  )

  if (!snapshot) {
    return null
  }

  return snapshotToWeeklyRecognitionRanking(snapshot)
}

async function publishWeeklyRecognitionRanking(
  teamId: string,
  generatedByUid: string,
  context: RecognitionRankingLoadContext,
): Promise<void> {
  const ranking = await getWeeklyRecognitionRankingForLeader(teamId, context)
  const snapshotInput = weeklyRecognitionRankingToSnapshotInput(ranking, generatedByUid)
  await recognitionWeeklySnapshotService.publishWeeklySnapshot(snapshotInput)
}

async function hasPublishedWeeklySnapshot(
  teamId: string,
  context: RecognitionRankingLoadContext,
): Promise<boolean> {
  const snapshot = await recognitionWeeklySnapshotService.getPublishedSnapshotByPeriod(
    teamId,
    getCurrentRecognitionWeekPeriod(),
    {
      teamId,
      authUid: context.authUid,
      viewRole: context.viewRole,
    },
  )

  return Boolean(snapshot)
}

export const recognitionRankingService = {
  getWeeklyRecognitionRankingForLeader,
  getMemberPersonalWeeklyEntry,
  getPublishedWeeklyRecognitionRanking,
  publishWeeklyRecognitionRanking,
  hasPublishedWeeklySnapshot,
}

export type { RecognitionRankingLoadContext }
