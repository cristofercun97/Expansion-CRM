import type { Timestamp } from 'firebase/firestore'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type {
  AcademyMemberModuleProgressItem,
  AcademyMemberProgressRow,
  AcademyMemberProgressStatus,
  AcademyMemberStudyStatus,
  AcademyProgressSummary,
} from '@/features/academy/types/academy-progress.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { TeamMember } from '@/features/team/types/team.types'

export function resolveMemberStudyStatus(
  reviewedMaterialsCount: number,
  totalMaterials: number,
  testsCompleted: number,
  averageScore: number | null,
): AcademyMemberStudyStatus {
  if (
    totalMaterials > 0 &&
    reviewedMaterialsCount === totalMaterials &&
    averageScore !== null &&
    averageScore >= 70
  ) {
    return 'good_progress'
  }

  if (testsCompleted > 0) {
    return 'studied'
  }

  if (reviewedMaterialsCount > 0) {
    return 'reviewing'
  }

  return 'not_started'
}

export function resolveMemberProgressStatus(
  studyStatus: AcademyMemberStudyStatus,
): AcademyMemberProgressStatus {
  switch (studyStatus) {
    case 'not_started':
      return 'none'
    case 'reviewing':
    case 'studied':
      return 'in_progress'
    case 'good_progress':
      return 'good'
  }
}

export function getMemberProgressStatusLabel(status: AcademyMemberProgressStatus): string {
  switch (status) {
    case 'none':
      return 'Sin iniciar'
    case 'in_progress':
      return 'En progreso'
    case 'good':
      return 'Buen avance'
  }
}

export function getMemberStudyStatusLabel(studyStatus: AcademyMemberStudyStatus): string {
  switch (studyStatus) {
    case 'not_started':
      return 'Sin iniciar'
    case 'reviewing':
      return 'Revisando contenido'
    case 'studied':
      return 'Ha estudiado'
    case 'good_progress':
      return 'Buen avance'
  }
}

export function getMemberStudyStatusBadgeClassName(
  studyStatus: AcademyMemberStudyStatus,
): string {
  switch (studyStatus) {
    case 'not_started':
      return 'border-amber-400/25 bg-amber-500/10 text-amber-200'
    case 'reviewing':
      return 'border-sky-400/25 bg-sky-500/10 text-sky-200'
    case 'studied':
      return 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent'
    case 'good_progress':
      return 'border-gold/30 bg-gold/10 text-gold-light'
  }
}

export function buildAcademyFollowUpMailto(email: string): string | null {
  const trimmed = email.trim()

  if (!trimmed || trimmed === '—') {
    return null
  }

  const subject = encodeURIComponent('Seguimiento de Academia - EXPANSIÓN')
  return `mailto:${trimmed}?subject=${subject}`
}

function resolveLatestActivity(
  attempts: AcademyTestAttempt[],
  engagements: AcademyMaterialEngagement[],
): Timestamp | null {
  const timestamps: Timestamp[] = []

  for (const attempt of attempts) {
    if (attempt.submittedAt?.toMillis) {
      timestamps.push(attempt.submittedAt)
    }
  }

  for (const engagement of engagements) {
    if (engagement.lastOpenedAt?.toMillis) {
      timestamps.push(engagement.lastOpenedAt)
    }
  }

  return timestamps.reduce<Timestamp | null>((latest, current) => {
    if (!latest?.toMillis) {
      return current
    }

    return current.toMillis() > latest.toMillis() ? current : latest
  }, null)
}

function sortMembersByActivity(members: AcademyMemberProgressRow[]): AcademyMemberProgressRow[] {
  return [...members].sort((left, right) => {
    const leftTime = left.lastActivityAt?.toMillis?.() ?? 0
    const rightTime = right.lastActivityAt?.toMillis?.() ?? 0

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return left.memberName.localeCompare(right.memberName, 'es')
  })
}

function resolveMemberDisplayInfo(
  member: TeamMember,
  attemptInfo?: { name: string; email: string },
): { memberName: string; memberEmail: string } {
  const teamName = member.memberName?.trim()
  const teamEmail = member.memberEmail?.trim()
  const attemptName = attemptInfo?.name?.trim()
  const attemptEmail = attemptInfo?.email?.trim()

  return {
    memberName: teamName || attemptName || 'Miembro del equipo',
    memberEmail: teamEmail || attemptEmail || '—',
  }
}

function buildStudyProgress(reviewedMaterialsCount: number, totalMaterials: number) {
  const studyProgressLabel =
    totalMaterials > 0
      ? `${reviewedMaterialsCount}/${totalMaterials} módulos`
      : `${reviewedMaterialsCount}/0 módulos`
  const studyProgressPercent =
    totalMaterials > 0 ? Math.round((reviewedMaterialsCount / totalMaterials) * 100) : 0

  return { studyProgressLabel, studyProgressPercent }
}

export function buildAcademyProgressSummary(
  members: TeamMember[],
  attempts: AcademyTestAttempt[],
  materials: AcademyMaterial[],
  engagements: AcademyMaterialEngagement[],
): AcademyProgressSummary {
  const totalMaterials = materials.length
  const memberInfoFromAttempts = new Map<string, { name: string; email: string }>()
  const attemptsByMember = new Map<string, AcademyTestAttempt[]>()
  const engagementsByMember = new Map<string, AcademyMaterialEngagement[]>()

  for (const attempt of attempts) {
    const memberAttempts = attemptsByMember.get(attempt.memberUid) ?? []
    memberAttempts.push(attempt)
    attemptsByMember.set(attempt.memberUid, memberAttempts)

    if (!memberInfoFromAttempts.has(attempt.memberUid)) {
      memberInfoFromAttempts.set(attempt.memberUid, {
        name: attempt.memberName,
        email: attempt.memberEmail,
      })
    }
  }

  for (const engagement of engagements) {
    const memberEngagements = engagementsByMember.get(engagement.memberUid) ?? []
    memberEngagements.push(engagement)
    engagementsByMember.set(engagement.memberUid, memberEngagements)
  }

  const memberRows = members
    .filter((member) => member.status === 'active')
    .map((member) => {
      const memberAttempts = attemptsByMember.get(member.memberUid) ?? []
      const memberEngagements = engagementsByMember.get(member.memberUid) ?? []
      const reviewedMaterialIds = new Set(memberEngagements.map((engagement) => engagement.materialId))
      const reviewedMaterialsCount = reviewedMaterialIds.size
      const testsCompleted = memberAttempts.length
      const averageScore =
        testsCompleted > 0
          ? Math.round(
              memberAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / testsCompleted,
            )
          : null
      const info = memberInfoFromAttempts.get(member.memberUid)
      const display = resolveMemberDisplayInfo(member, info)
      const studyStatus = resolveMemberStudyStatus(
        reviewedMaterialsCount,
        totalMaterials,
        testsCompleted,
        averageScore,
      )
      const { studyProgressLabel, studyProgressPercent } = buildStudyProgress(
        reviewedMaterialsCount,
        totalMaterials,
      )

      return {
        memberUid: member.memberUid,
        memberName: display.memberName,
        memberEmail: display.memberEmail,
        role: member.role,
        testsCompleted,
        averageScore,
        reviewedMaterialsCount,
        totalMaterials,
        studyProgressLabel,
        studyProgressPercent,
        studyStatus,
        lastActivityAt: resolveLatestActivity(memberAttempts, memberEngagements),
        status: resolveMemberProgressStatus(studyStatus),
      }
    })

  const totalAttempts = attempts.length
  const averageScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts)
      : null
  const membersStudied = memberRows.filter((member) => member.testsCompleted > 0).length
  const membersNotStudied = memberRows.filter((member) => member.testsCompleted === 0).length
  const membersNotReviewedModules = memberRows.filter(
    (member) => member.reviewedMaterialsCount === 0,
  ).length

  return {
    totalMembers: memberRows.length,
    totalMaterials,
    totalModulesReviewed: engagements.length,
    membersNotReviewedModules,
    totalAttempts,
    averageScore,
    membersStudied,
    membersNotStudied,
    members: sortMembersByActivity(memberRows),
  }
}

export function getAttemptsForMember(
  attempts: AcademyTestAttempt[],
  memberUid: string,
): AcademyTestAttempt[] {
  return attempts
    .filter((attempt) => attempt.memberUid === memberUid)
    .sort((left, right) => {
      const leftTime = left.submittedAt?.toMillis?.() ?? 0
      const rightTime = right.submittedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

export function getEngagementsForMember(
  engagements: AcademyMaterialEngagement[],
  memberUid: string,
): AcademyMaterialEngagement[] {
  return engagements.filter((engagement) => engagement.memberUid === memberUid)
}

export function buildMemberModuleProgressItems(
  materials: AcademyMaterial[],
  memberEngagements: AcademyMaterialEngagement[],
): AcademyMemberModuleProgressItem[] {
  const engagementsByMaterialId = new Map(
    memberEngagements.map((engagement) => [engagement.materialId, engagement]),
  )

  return [...materials]
    .sort((left, right) => left.title.localeCompare(right.title, 'es'))
    .map((material) => {
      const engagement = engagementsByMaterialId.get(material.id)

      return {
        materialId: material.id,
        title: material.title,
        reviewed: Boolean(engagement),
        lastOpenedAt: engagement?.lastOpenedAt ?? null,
        openCount: engagement?.openCount ?? 0,
      }
    })
}
