import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type {
  MonthlyMvpCandidate,
  MonthlyMvpMonthPeriod,
  MonthlyMvpResult,
  MonthlyMvpWinner,
} from '@/features/recognitions/types/monthly-mvp.types'

type MemberMonthlyAccumulator = {
  memberUid: string
  memberName: string
  totalMonthlyPoints: number
  weeksInPodium: number
  weeksWithActivity: number
  bestWeeklyPosition: number | null
  weeklyAppearances: number
}

function padMonth(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}-${padMonth(date.getDate())}`
}

export function getCurrentMonthlyMvpPeriod(referenceDate = new Date()): MonthlyMvpMonthPeriod {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999)

  const monthKey = `${monthStart.getFullYear()}-${padMonth(monthStart.getMonth() + 1)}`
  const monthLabel = monthStart.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return {
    monthKey,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    monthStartIso: toIsoDate(monthStart),
    monthEndIso: toIsoDate(monthEnd),
    startMs: monthStart.getTime(),
    endMs: monthEnd.getTime(),
  }
}

export function snapshotIntersectsMonth(
  snapshot: RecognitionWeeklySnapshot,
  month: MonthlyMvpMonthPeriod,
): boolean {
  if (!snapshot.weekStartDate || !snapshot.weekEndDate) {
    return false
  }

  const weekStartMs = new Date(`${snapshot.weekStartDate}T00:00:00`).getTime()
  const weekEndMs = new Date(`${snapshot.weekEndDate}T23:59:59`).getTime()

  return weekStartMs <= month.endMs && weekEndMs >= month.startMs
}

export function buildMonthlyMvpPublicSummary(candidate: MonthlyMvpCandidate): string {
  const podiumWeeksLabel =
    candidate.weeksInPodium === 1 ? '1 semana en el podio' : `${candidate.weeksInPodium} semanas en el podio`

  return `Destacó por sumar ${candidate.totalMonthlyPoints} puntos, aparecer ${podiumWeeksLabel} y mantener actividad constante durante el mes.`
}

function compareMonthlyMvpCandidates(left: MonthlyMvpCandidate, right: MonthlyMvpCandidate): number {
  if (left.totalMonthlyPoints !== right.totalMonthlyPoints) {
    return right.totalMonthlyPoints - left.totalMonthlyPoints
  }

  if (left.weeksInPodium !== right.weeksInPodium) {
    return right.weeksInPodium - left.weeksInPodium
  }

  const leftBest = left.bestWeeklyPosition ?? Number.MAX_SAFE_INTEGER
  const rightBest = right.bestWeeklyPosition ?? Number.MAX_SAFE_INTEGER

  if (leftBest !== rightBest) {
    return leftBest - rightBest
  }

  return right.weeksWithActivity - left.weeksWithActivity
}

function finalizeCandidate(accumulator: MemberMonthlyAccumulator): MonthlyMvpCandidate {
  const candidate: MonthlyMvpCandidate = {
    memberUid: accumulator.memberUid,
    memberName: accumulator.memberName,
    totalMonthlyPoints: accumulator.totalMonthlyPoints,
    weeksInPodium: accumulator.weeksInPodium,
    weeksWithActivity: accumulator.weeksWithActivity,
    bestWeeklyPosition: accumulator.bestWeeklyPosition,
    weeklyAppearances: accumulator.weeklyAppearances,
    publicSummary: '',
  }

  candidate.publicSummary = buildMonthlyMvpPublicSummary(candidate)

  return candidate
}

function accumulateSnapshotRanking(
  accumulators: Map<string, MemberMonthlyAccumulator>,
  snapshot: RecognitionWeeklySnapshot,
): void {
  for (const entry of snapshot.ranking) {
    const existing = accumulators.get(entry.memberUid)

    const next: MemberMonthlyAccumulator = existing ?? {
      memberUid: entry.memberUid,
      memberName: entry.memberName,
      totalMonthlyPoints: 0,
      weeksInPodium: 0,
      weeksWithActivity: 0,
      bestWeeklyPosition: null,
      weeklyAppearances: 0,
    }

    next.memberName = entry.memberName || next.memberName
    next.totalMonthlyPoints += entry.score
    next.weeklyAppearances += 1

    if (entry.score > 0) {
      next.weeksWithActivity += 1
    }

    if (entry.position > 0 && entry.position <= 3) {
      next.weeksInPodium += 1
    }

    if (entry.position > 0) {
      next.bestWeeklyPosition =
        next.bestWeeklyPosition === null
          ? entry.position
          : Math.min(next.bestWeeklyPosition, entry.position)
    }

    accumulators.set(entry.memberUid, next)
  }
}

export function calculateMonthlyMvpFromSnapshots(
  snapshots: RecognitionWeeklySnapshot[],
  month: MonthlyMvpMonthPeriod = getCurrentMonthlyMvpPeriod(),
): MonthlyMvpResult {
  const monthSnapshots = snapshots.filter(
    (snapshot) => snapshot.isPublished && snapshotIntersectsMonth(snapshot, month),
  )

  const accumulators = new Map<string, MemberMonthlyAccumulator>()

  for (const snapshot of monthSnapshots) {
    accumulateSnapshotRanking(accumulators, snapshot)
  }

  const candidates = [...accumulators.values()]
    .map((accumulator) => finalizeCandidate(accumulator))
    .sort(compareMonthlyMvpCandidates)

  const winner: MonthlyMvpWinner | null =
    candidates.length > 0 && candidates[0].totalMonthlyPoints > 0 ? candidates[0] : null

  const hasEnoughData =
    monthSnapshots.length > 0 && candidates.some((candidate) => candidate.totalMonthlyPoints > 0)

  return {
    monthKey: month.monthKey,
    monthLabel: month.monthLabel,
    winner,
    candidates,
    snapshotsCount: monthSnapshots.length,
    hasEnoughData,
  }
}

export const MONTHLY_MVP_NO_SNAPSHOTS_MESSAGE =
  'Aún estamos reuniendo actividad para elegir al próximo MVP.'

export const MONTHLY_MVP_NOT_ENOUGH_ACTIVITY_MESSAGE =
  'El MVP del mes se activará cuando haya más actividad semanal publicada.'

export const MONTHLY_MVP_LEADER_NOTE =
  'El MVP se calcula desde los rankings semanales publicados.'

export const MONTHLY_MVP_MEMBER_COMPETE_MESSAGE =
  'Suma puntos en los rankings semanales para competir por el MVP del mes.'
