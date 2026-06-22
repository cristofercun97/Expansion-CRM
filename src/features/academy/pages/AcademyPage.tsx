import { BookOpen, Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  AcademyHomeTeamCard,
  AcademyHomeTeamCardSkeleton,
} from '@/features/academy/components/AcademyHomeTeamCard'
import { AcademySection } from '@/features/academy/components/AcademySection'
import { AcademyTakeTestModal } from '@/features/academy/components/AcademyTakeTestModal'
import { AcademyTestAttemptsModal } from '@/features/academy/components/AcademyTestAttemptsModal'
import { AcademyTestModal } from '@/features/academy/components/AcademyTestModal'
import { CreateAcademyMaterialModal } from '@/features/academy/components/CreateAcademyMaterialModal'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import { academyTestsService } from '@/features/academy/services/academy-tests.service'
import { academyService } from '@/features/academy/services/academy.service'
import type { AcademyTest, UpsertAcademyTestInput } from '@/features/academy/types/academy-test.types'
import type { AcademyTestCorrectOptionIndex } from '@/features/academy/types/academy-test.types'
import type {
  AcademyMaterial,
  CreateAcademyMaterialInput,
} from '@/features/academy/types/academy.types'
import {
  isLegacyManagedMaterial,
  resolveMaterialTeamId,
} from '@/features/academy/utils/academyTeamAccess'
import { useEnsureOwnedTeamForActiveUser } from '@/features/team/hooks/useEnsureOwnedTeamForActiveUser'
import { useSyncLegacyAcademyToOwnedTeam } from '@/features/academy/hooks/useSyncLegacyAcademyToOwnedTeam'
import { useAcademyTeamContext } from '@/features/academy/hooks/useAcademyTeamContext'
import { useMemberHomeTeamInfo } from '@/features/academy/hooks/useMemberHomeTeamInfo'
import { TeamContextSelector } from '@/features/team/components/TeamContextSelector'
import { TeamContextSwitcher } from '@/features/team/components/TeamContextSwitcher'
import { useTeamContextSelection } from '@/features/team/hooks/useTeamContextSelection'
import { applyAcademyTeamContextMode } from '@/features/team/utils/teamContextUtils'

function logAcademyDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

function logAcademyDevInfo(message: string, details?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.info(message, details)
  }
}

export function AcademyPage() {
  const { showToast } = useToast()
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const { isEnsuring, ensureError } = useEnsureOwnedTeamForActiveUser()
  const { isSyncing, syncError } = useSyncLegacyAcademyToOwnedTeam()
  const { teamContext: rawTeamContext, resolvedHomeTeamId, resolvingTeams } = useAcademyTeamContext()
  const teamContextSelection = useTeamContextSelection({
    resolvedHomeTeamId,
    resolvingHomeTeam: resolvingTeams,
  })
  const teamContext = useMemo(
    () =>
      teamContextSelection.mode
        ? applyAcademyTeamContextMode(rawTeamContext, teamContextSelection.mode)
        : rawTeamContext,
    [rawTeamContext, teamContextSelection.mode],
  )
  const {
    team: memberHomeTeam,
    leaderName: memberHomeLeaderName,
    loading: loadingMemberHomeTeam,
    error: memberHomeTeamError,
  } = useMemberHomeTeamInfo(teamContext.memberTeamId)

  const [managedMaterials, setManagedMaterials] = useState<AcademyMaterial[]>([])
  const [managedTestsByMaterialId, setManagedTestsByMaterialId] = useState<
    Record<string, AcademyTest>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<AcademyMaterial | null>(null)
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<AcademyMaterial | null>(null)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [isSavingTest, setIsSavingTest] = useState(false)
  const [takeTestMaterial, setTakeTestMaterial] = useState<AcademyMaterial | null>(null)
  const [takeTestRecord, setTakeTestRecord] = useState<AcademyTest | null>(null)
  const [isTakeTestModalOpen, setIsTakeTestModalOpen] = useState(false)
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false)
  const [viewAttemptsMaterial, setViewAttemptsMaterial] = useState<AcademyMaterial | null>(null)
  const [viewAttemptsTest, setViewAttemptsTest] = useState<AcademyTest | null>(null)
  const [isAttemptsModalOpen, setIsAttemptsModalOpen] = useState(false)
  const [studiedMaterialIds, setStudiedMaterialIds] = useState<ReadonlySet<string>>(new Set())

  const uid = currentUser?.uid
  const ownedTeamId = teamContext.managedTeamId

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

  const handleMaterialStudied = useCallback((materialId: string) => {
    setStudiedMaterialIds((current) => {
      if (current.has(materialId)) {
        return current
      }

      return new Set([...current, materialId])
    })
  }, [])

  const selectedTest = useMemo(() => {
    if (!selectedMaterial) {
      return null
    }

    return managedTestsByMaterialId[selectedMaterial.id] ?? null
  }, [managedTestsByMaterialId, selectedMaterial])

  const loadAcademyData = useCallback(async () => {
    if (!uid || teamContext.isBlocked) {
      setManagedMaterials([])
      setManagedTestsByMaterialId({})
      setStudiedMaterialIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const tasks: Promise<void>[] = []
      let loadedManagedCount = 0

      if (teamContext.hasManagedSection && teamContext.managedTeamId) {
        const managedTeamId = teamContext.managedTeamId

        tasks.push(
          academyService
            .getManagedAcademyMaterials(uid, managedTeamId)
            .then((materials) => {
              loadedManagedCount = materials.length
              setManagedMaterials(materials)
            }),
          academyTestsService
            .getManagedAcademyTests(uid, managedTeamId)
            .then((tests) => {
              setManagedTestsByMaterialId(academyTestsService.buildTestsByMaterialId(tests))
            }),
          academyMaterialEngagementsService
            .getMyEngagementsByMemberUid(uid)
            .then((engagements) => {
              setStudiedMaterialIds(new Set(engagements.map((engagement) => engagement.materialId)))
            }),
        )
      } else {
        setManagedMaterials([])
        setManagedTestsByMaterialId({})
        setStudiedMaterialIds(new Set())
      }

      await Promise.all(tasks)

      logAcademyDevInfo('[Academia] Contexto de equipos cargado', {
        homeTeamId: appUser?.homeTeamId ?? null,
        resolvedHomeTeamId,
        ownedTeamId: appUser?.ownedTeamId ?? null,
        memberTeamId: teamContext.memberTeamId,
        managedTeamId: teamContext.managedTeamId,
        managedMaterialsCount: loadedManagedCount,
        hasManagedSection: teamContext.hasManagedSection,
        hasMemberSection: teamContext.hasMemberSection,
      })
    } catch (loadError) {
      logAcademyDevError('[Academia] Error al cargar datos', loadError)
      setManagedMaterials([])
      setManagedTestsByMaterialId({})
      setStudiedMaterialIds(new Set())
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tus materiales. Intenta nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [
    appUser?.homeTeamId,
    appUser?.ownedTeamId,
    resolvedHomeTeamId,
    teamContext.hasManagedSection,
    teamContext.hasMemberSection,
    teamContext.isBlocked,
    teamContext.managedTeamId,
    teamContext.memberTeamId,
    uid,
  ])

  useEffect(() => {
    if (!initialized || authLoading || isEnsuring || isSyncing || resolvingTeams) {
      return
    }

    if (!uid) {
      setLoading(false)
      return
    }

    void loadAcademyData()
  }, [authLoading, initialized, isEnsuring, isSyncing, loadAcademyData, resolvingTeams, uid])

  const handleOpenCreateMaterial = useCallback(() => {
    setEditingMaterial(null)
    setIsMaterialModalOpen(true)
  }, [])

  const handleEditMaterial = useCallback((material: AcademyMaterial) => {
    setEditingMaterial(material)
    setIsMaterialModalOpen(true)
  }, [])

  const assertCanManageMaterial = useCallback(
    (material: AcademyMaterial) => {
      if (!uid || !isLegacyManagedMaterial(material, uid, ownedTeamId)) {
        throw new Error('No tienes permiso para administrar este material.')
      }
    },
    [ownedTeamId, uid],
  )

  const handleSaveMaterial = useCallback(
    async (data: CreateAcademyMaterialInput) => {
      if (!uid) {
        throw new Error('Debes iniciar sesión para guardar materiales.')
      }

      if (!teamContext.canManageContent || !ownedTeamId) {
        throw new Error('Necesitas un grupo propio activo para crear materiales.')
      }

      setIsSavingMaterial(true)

      try {
        if (editingMaterial) {
          assertCanManageMaterial(editingMaterial)
          const updated = await academyService.updateAcademyMaterial(
            editingMaterial.id,
            editingMaterial,
            data,
            ownedTeamId,
          )
          setManagedMaterials((current) =>
            current.map((material) => (material.id === updated.id ? updated : material)),
          )
          showToast('Material actualizado correctamente.', 'success')
        } else {
          const created = await academyService.createAcademyMaterial(uid, ownedTeamId, data)
          setManagedMaterials((current) => [created, ...current])
          showToast('Material creado correctamente.', 'success')
        }

        setIsMaterialModalOpen(false)
        setEditingMaterial(null)
      } catch (saveError) {
        logAcademyDevError('[Academia] Error al guardar material', saveError)
        throw saveError instanceof Error
          ? saveError
          : new Error('No pudimos guardar el material. Intenta nuevamente.')
      } finally {
        setIsSavingMaterial(false)
      }
    },
    [
      assertCanManageMaterial,
      editingMaterial,
      ownedTeamId,
      showToast,
      teamContext.canManageContent,
      uid,
    ],
  )

  const handleDeleteMaterial = useCallback(
    async (material: AcademyMaterial) => {
      if (!uid) {
        showToast('Debes iniciar sesión para eliminar materiales.', 'info')
        return
      }

      try {
        assertCanManageMaterial(material)
      } catch (permissionError) {
        showToast(
          permissionError instanceof Error
            ? permissionError.message
            : 'No tienes permiso para eliminar este material.',
          'info',
        )
        return
      }

      const confirmed = window.confirm(`¿Eliminar "${material.title}"? Esta acción no se puede deshacer.`)

      if (!confirmed) {
        return
      }

      setDeletingMaterialId(material.id)

      try {
        await academyService.deleteAcademyMaterial(material.id)
        setManagedMaterials((current) => current.filter((item) => item.id !== material.id))
        setManagedTestsByMaterialId((current) => {
          const next = { ...current }
          delete next[material.id]
          return next
        })
        showToast('Material eliminado correctamente.', 'success')
      } catch (deleteError) {
        logAcademyDevError('[Academia] Error al eliminar material', deleteError)
        showToast('No pudimos eliminar el material. Intenta nuevamente.', 'info')
      } finally {
        setDeletingMaterialId(null)
      }
    },
    [assertCanManageMaterial, showToast, uid],
  )

  const handleManageTest = useCallback(
    (material: AcademyMaterial) => {
      try {
        assertCanManageMaterial(material)
      } catch (permissionError) {
        showToast(
          permissionError instanceof Error
            ? permissionError.message
            : 'No tienes permiso para administrar este test.',
          'info',
        )
        return
      }

      setSelectedMaterial(material)
      setIsTestModalOpen(true)
    },
    [assertCanManageMaterial, showToast],
  )

  const handleSaveTest = useCallback(
    async (data: UpsertAcademyTestInput) => {
      if (!uid || !selectedMaterial) {
        throw new Error('Debes iniciar sesión para guardar el test.')
      }

      setIsSavingTest(true)

      try {
        const saved = await academyTestsService.upsertAcademyTest(
          uid,
          ownedTeamId,
          selectedMaterial,
          data,
        )
        setManagedTestsByMaterialId((current) => ({
          ...current,
          [selectedMaterial.id]: saved,
        }))
        setIsTestModalOpen(false)
        setSelectedMaterial(null)
      } catch (saveError) {
        logAcademyDevError('[Academia] Error al guardar test', saveError)
        throw saveError instanceof Error
          ? saveError
          : new Error('No pudimos guardar el test. Intenta nuevamente.')
      } finally {
        setIsSavingTest(false)
      }
    },
    [ownedTeamId, selectedMaterial, uid],
  )

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

      const teamId = resolveMaterialTeamId(
        takeTestMaterial,
        takeTestRecord,
        teamContext.managedTeamId,
      )

      if (!teamId) {
        throw new Error('No encontramos el grupo asociado a este test.')
      }

      setIsSubmittingAttempt(true)

      try {
        return await academyTestAttemptsService.submitTestAttempt(
          {
            teamId,
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
    [appUser?.displayName, appUser?.email, currentUser?.displayName, currentUser?.email, takeTestMaterial, takeTestRecord, teamContext.managedTeamId, uid],
  )

  const handleViewAttempts = useCallback((material: AcademyMaterial, test: AcademyTest) => {
    setViewAttemptsMaterial(material)
    setViewAttemptsTest(test)
    setIsAttemptsModalOpen(true)
  }, [])

  const viewAttemptsTeamId = useMemo(
    () =>
      resolveMaterialTeamId(
        viewAttemptsMaterial ?? {},
        viewAttemptsTest ?? undefined,
        teamContext.managedTeamId,
      ),
    [teamContext.managedTeamId, viewAttemptsMaterial, viewAttemptsTest],
  )

  const hasAnyMaterials = managedMaterials.length > 0
  const showManagedEmptyState =
    teamContext.hasManagedSection &&
    teamContext.canManageContent &&
    !teamContext.hasMemberSection &&
    managedMaterials.length === 0
  const showGlobalEmptyState =
    !hasAnyMaterials &&
    !teamContext.hasManagedSection &&
    !teamContext.hasMemberSection &&
    !showManagedEmptyState

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver Academia.</p>
      </div>
    )
  }

  if (initialized && !authLoading && (isEnsuring || isSyncing || resolvingTeams)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {isEnsuring
            ? 'Preparando tu grupo...'
            : isSyncing
              ? 'Sincronizando materiales de tu grupo...'
              : 'Cargando academias de tu equipo...'}
        </p>
      </div>
    )
  }

  if (initialized && !authLoading && ensureError) {
    return (
      <div className="space-y-6 px-8 py-8">
        <PageHeader
          title="Academia"
          subtitle="Materiales de capacitación organizados por grupo."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {ensureError}
        </div>
      </div>
    )
  }

  if (initialized && !authLoading && syncError) {
    return (
      <div className="space-y-6 px-8 py-8">
        <PageHeader
          title="Academia"
          subtitle="Materiales de capacitación organizados por grupo."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {syncError}
        </div>
      </div>
    )
  }

  if (!loading && teamContext.isBlocked) {
    return (
      <div className="space-y-6 px-8 py-8">
        <PageHeader
          title="Academia"
          subtitle="Materiales de capacitación organizados por grupo."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />
        <EmptyState
          icon={BookOpen}
          title="Aún no perteneces a un grupo"
          description="Solicita la Activación de grupo para crear tu propia academia o únete mediante una invitación."
          className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
          action={
            <Link to="/dashboard/mi-grupo">
              <Button className="bg-gold text-petrol-deep hover:bg-gold-light">
                Ir a Mi grupo
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (teamContextSelection.showSelector) {
    return (
      <TeamContextSelector
        availability={teamContextSelection.availability}
        onSelect={teamContextSelection.selectContext}
      />
    )
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader
        title="Academia"
        subtitle="Organiza tus materiales de capacitación para que tu equipo aprenda paso a paso."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        actions={
          !loading && !error && teamContext.canManageContent ? (
            <Button
              type="button"
              onClick={handleOpenCreateMaterial}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar material
            </Button>
          ) : null
        }
      />

      {teamContextSelection.canSwitch && teamContextSelection.mode ? (
        <TeamContextSwitcher
          mode={teamContextSelection.mode}
          onSwitch={teamContextSelection.clearContext}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando materiales...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          {showManagedEmptyState ? (
            <EmptyState
              icon={BookOpen}
              title="Aún no tienes materiales"
              description="Agrega tu primera capacitación para comenzar."
              className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
              action={
                <Button
                  type="button"
                  onClick={handleOpenCreateMaterial}
                  className="bg-gold text-petrol-deep hover:bg-gold-light"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Agregar material
                </Button>
              }
            />
          ) : null}

          {teamContext.hasMemberSection ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-hero-text">Academia de mi grupo</h2>
                <p className="mt-1 text-sm text-hero-text/70">
                  Accede a los materiales compartidos por el grupo al que perteneces.
                </p>
              </div>

              {loadingMemberHomeTeam ? (
                <AcademyHomeTeamCardSkeleton />
              ) : memberHomeTeam ? (
                <AcademyHomeTeamCard team={memberHomeTeam} leaderName={memberHomeLeaderName} />
              ) : (
                <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
                  {memberHomeTeamError ||
                    'No encontramos el grupo al que perteneces. Contacta a tu líder.'}
                </p>
              )}
            </section>
          ) : null}

          {teamContext.hasManagedSection ? (
            <AcademySection
              title="Academia que administro"
              description="Crea y administra los materiales de tu grupo propio."
              materials={managedMaterials}
              testsByMaterialId={managedTestsByMaterialId}
              readOnly={!teamContext.canManageContent}
              canViewAttempts={teamContext.canManageContent}
              materialEngagementTracking={materialEngagementTracking}
              studiedMaterialIds={studiedMaterialIds}
              onMaterialStudied={handleMaterialStudied}
              deletingMaterialId={deletingMaterialId}
              onEdit={handleEditMaterial}
              onDelete={handleDeleteMaterial}
              onManageTest={handleManageTest}
              onTakeTest={handleTakeTest}
              onViewAttempts={handleViewAttempts}
            />
          ) : null}

          {showGlobalEmptyState ? (
            <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
              Aún no hay materiales disponibles en tu academia.
            </p>
          ) : null}

          <CreateAcademyMaterialModal
            open={isMaterialModalOpen}
            material={editingMaterial}
            isSubmitting={isSavingMaterial}
            onClose={() => {
              if (!isSavingMaterial) {
                setIsMaterialModalOpen(false)
                setEditingMaterial(null)
              }
            }}
            onSubmit={handleSaveMaterial}
          />

          <AcademyTestModal
            open={isTestModalOpen}
            material={selectedMaterial}
            existingTest={selectedTest}
            isSubmitting={isSavingTest}
            onClose={() => {
              if (!isSavingTest) {
                setIsTestModalOpen(false)
                setSelectedMaterial(null)
              }
            }}
            onSubmit={handleSaveTest}
          />

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

          <AcademyTestAttemptsModal
            open={isAttemptsModalOpen}
            material={viewAttemptsMaterial}
            test={viewAttemptsTest}
            teamId={viewAttemptsTeamId}
            onClose={() => {
              setIsAttemptsModalOpen(false)
              setViewAttemptsMaterial(null)
              setViewAttemptsTest(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
