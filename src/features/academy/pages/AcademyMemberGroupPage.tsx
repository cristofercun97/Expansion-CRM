import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button, PageHeader } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AcademySection } from '@/features/academy/components/AcademySection'
import { AcademyTakeTestModal } from '@/features/academy/components/AcademyTakeTestModal'
import { useAcademyTeamContext } from '@/features/academy/hooks/useAcademyTeamContext'
import { useMemberHomeTeamInfo } from '@/features/academy/hooks/useMemberHomeTeamInfo'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import { academyTestsService } from '@/features/academy/services/academy-tests.service'
import { academyService } from '@/features/academy/services/academy.service'
import type { AcademyTest, AcademyTestCorrectOptionIndex } from '@/features/academy/types/academy-test.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import { resolveMaterialTeamId } from '@/features/academy/utils/academyTeamAccess'
import { teamService } from '@/features/team/services/team.service'

export function AcademyMemberGroupPage() {
  const { teamId = '' } = useParams()
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const { teamContext, resolvingTeams } = useAcademyTeamContext()
  const { team, leaderName, loading: loadingTeamInfo, error: teamInfoError } =
    useMemberHomeTeamInfo(teamId || null)

  const [materials, setMaterials] = useState<AcademyMaterial[]>([])
  const [testsByMaterialId, setTestsByMaterialId] = useState<Record<string, AcademyTest>>({})
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [materialsError, setMaterialsError] = useState('')
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null)
  const [takeTestMaterial, setTakeTestMaterial] = useState<AcademyMaterial | null>(null)
  const [takeTestRecord, setTakeTestRecord] = useState<AcademyTest | null>(null)
  const [isTakeTestModalOpen, setIsTakeTestModalOpen] = useState(false)
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false)
  const [studiedMaterialIds, setStudiedMaterialIds] = useState<ReadonlySet<string>>(new Set())

  const uid = currentUser?.uid
  const memberTeamId = teamContext.memberTeamId

  const materialEngagementTracking = useMemo(() => {
    if (!uid) {
      return null
    }

    return {
      memberUid: uid,
      memberName:
        appUser?.displayName?.trim() ||
        currentUser?.displayName?.trim() ||
        'Usuario',
      memberEmail: appUser?.email?.trim() || currentUser?.email?.trim() || '',
    }
  }, [appUser?.displayName, appUser?.email, currentUser?.displayName, currentUser?.email, uid])

  useEffect(() => {
    if (!initialized || authLoading || resolvingTeams || !uid || !teamId) {
      return
    }

    if (memberTeamId === teamId) {
      setAccessAllowed(true)
      return
    }

    let cancelled = false

    void teamService
      .getActiveTeamMembershipsByMemberUid(uid)
      .then((memberships) => {
        if (!cancelled) {
          setAccessAllowed(memberships.some((membership) => membership.teamId === teamId))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccessAllowed(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, initialized, memberTeamId, resolvingTeams, teamId, uid])

  const handleMaterialStudied = useCallback((materialId: string) => {
    setStudiedMaterialIds((current) => {
      if (current.has(materialId)) {
        return current
      }

      return new Set([...current, materialId])
    })
  }, [])

  const loadMaterials = useCallback(async () => {
    if (!teamId || accessAllowed !== true) {
      setMaterials([])
      setTestsByMaterialId({})
      setStudiedMaterialIds(new Set())
      setLoadingMaterials(false)
      return
    }

    setLoadingMaterials(true)
    setMaterialsError('')

    try {
      const loadedMaterials = await academyService.getMemberAcademyMaterials(teamId)
      const tests = await academyTestsService.getMemberAcademyTests(
        teamId,
        loadedMaterials.map((material) => material.id),
      )

      setMaterials(loadedMaterials)
      setTestsByMaterialId(academyTestsService.buildTestsByMaterialId(tests))

      if (uid) {
        const engagements =
          await academyMaterialEngagementsService.getMyEngagementsByMemberUid(uid)
        setStudiedMaterialIds(new Set(engagements.map((engagement) => engagement.materialId)))
      } else {
        setStudiedMaterialIds(new Set())
      }
    } catch (error) {
      setMaterials([])
      setTestsByMaterialId({})
      setStudiedMaterialIds(new Set())
      setMaterialsError(
        error instanceof Error
          ? error.message
          : 'No pudimos cargar los materiales del grupo. Intenta nuevamente.',
      )
    } finally {
      setLoadingMaterials(false)
    }
  }, [accessAllowed, teamId, uid])

  useEffect(() => {
    if (accessAllowed === true) {
      void loadMaterials()
    }
  }, [accessAllowed, loadMaterials])

  const handleTakeTest = useCallback((material: AcademyMaterial, test: AcademyTest) => {
    setTakeTestMaterial(material)
    setTakeTestRecord(test)
    setIsTakeTestModalOpen(true)
  }, [])

  const handleSubmitAttempt = useCallback(
    async (selectedAnswers: AcademyTestCorrectOptionIndex[]) => {
      if (!uid || !takeTestMaterial || !takeTestRecord) {
        throw new Error('Debes iniciar sesión para enviar el test.')
      }

      const resolvedTeamId = resolveMaterialTeamId(takeTestMaterial, takeTestRecord, teamId)

      if (!resolvedTeamId) {
        throw new Error('No encontramos el grupo asociado a este test.')
      }

      setIsSubmittingAttempt(true)

      try {
        return await academyTestAttemptsService.submitTestAttempt(
          {
            teamId: resolvedTeamId,
            materialId: takeTestMaterial.id,
            testId: takeTestRecord.id,
            memberUid: uid,
            memberName:
              appUser?.displayName?.trim() ||
              currentUser?.displayName?.trim() ||
              'Usuario',
            memberEmail: appUser?.email?.trim() || currentUser?.email?.trim() || '',
            selectedAnswers,
          },
          takeTestRecord,
        )
      } finally {
        setIsSubmittingAttempt(false)
      }
    },
    [
      appUser?.displayName,
      appUser?.email,
      currentUser?.displayName,
      currentUser?.email,
      takeTestMaterial,
      takeTestRecord,
      teamId,
      uid,
    ],
  )

  const pageTitle = useMemo(() => {
    const teamName = team?.name.trim()
    return teamName ? `Academia de ${teamName}` : 'Academia de mi grupo'
  }, [team?.name])

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver Academia.</p>
      </div>
    )
  }

  if (initialized && !authLoading && (resolvingTeams || accessAllowed === null)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Verificando acceso al grupo...
        </p>
      </div>
    )
  }

  if (accessAllowed === false) {
    return <Navigate to="/dashboard/academia" replace />
  }

  const loading = loadingTeamInfo || loadingMaterials
  const error = teamInfoError || materialsError

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title={pageTitle}
        subtitle={
          leaderName
            ? `Materiales compartidos por ${leaderName}. Solo lectura.`
            : 'Materiales compartidos por tu grupo principal. Solo lectura.'
        }
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        actions={
          <Link to="/dashboard/academia">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando materiales del grupo...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <AcademySection
          title="Materiales del grupo"
          materials={materials}
          testsByMaterialId={testsByMaterialId}
          readOnly
          memberTeamId={teamId}
          materialEngagementTracking={materialEngagementTracking}
          studiedMaterialIds={studiedMaterialIds}
          onMaterialStudied={handleMaterialStudied}
          onTakeTest={handleTakeTest}
          emptyMessage="Este grupo aún no tiene materiales de academia publicados."
        />
      )}

      <AcademyTakeTestModal
        open={isTakeTestModalOpen}
        material={takeTestMaterial}
        test={takeTestRecord}
        isSubmitting={isSubmittingAttempt}
        onClose={() => {
          if (!isSubmittingAttempt) {
            setIsTakeTestModalOpen(false)
            setTakeTestMaterial(null)
            setTakeTestRecord(null)
          }
        }}
        onSubmit={handleSubmitAttempt}
      />
    </div>
  )
}
