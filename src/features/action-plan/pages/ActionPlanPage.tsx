import { ClipboardList, Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ActionPlanBlockedState } from '@/features/action-plan/components/ActionPlanBlockedState'
import { TeamActionMapSection } from '@/features/action-plan/components/TeamActionMapSection'
import { ActionTaskList } from '@/features/action-plan/components/ActionTaskList'
import { ActionTaskManagedList } from '@/features/action-plan/components/ActionTaskManagedList'
import { ActionTaskMemberList } from '@/features/action-plan/components/ActionTaskMemberList'
import { CreateActionTaskModal } from '@/features/action-plan/components/CreateActionTaskModal'
import type { ActionTaskTeamMemberOption } from '@/features/action-plan/components/CreateActionTaskModal'
import { useActionPlanTeamContext } from '@/features/action-plan/hooks/useActionPlanTeamContext'
import { TeamContextSelector } from '@/features/team/components/TeamContextSelector'
import { TeamContextSwitcher } from '@/features/team/components/TeamContextSwitcher'
import { useTeamContextSelection } from '@/features/team/hooks/useTeamContextSelection'
import { applyActionPlanTeamContextMode } from '@/features/team/utils/teamContextUtils'
import { useTeamActionMap } from '@/features/action-plan/hooks/useTeamActionMap'
import { actionTaskProgressService } from '@/features/action-plan/services/action-task-progress.service'
import { actionPlanService } from '@/features/action-plan/services/action-plan.service'
import { teamActionMapService } from '@/features/action-plan/services/team-action-map.service'
import { teamService } from '@/features/team/services/team.service'
import type {
  ActionTask,
  ActionTaskProgress,
  ActionTaskStatus,
  CreateActionTaskInput,
} from '@/features/action-plan/types/action-plan.types'
import { buildProgressMapByTaskId } from '@/features/action-plan/utils/actionTaskProgressUtils'
import { SalesGoalCard } from '@/features/sales-goals/components/SalesGoalCard'

function logActionPlanDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

type SectionLoadState = {
  loading: boolean
  error: string
}

const INITIAL_SECTION_STATE: SectionLoadState = {
  loading: true,
  error: '',
}

export function ActionPlanPage() {
  const { showToast } = useToast()
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const { teamContext: rawTeamContext, resolvedHomeTeamId, resolvingTeams } =
    useActionPlanTeamContext()
  const teamContextSelection = useTeamContextSelection({
    resolvedHomeTeamId,
    resolvingHomeTeam: resolvingTeams,
  })
  const teamContext = useMemo(
    () =>
      teamContextSelection.mode
        ? applyActionPlanTeamContextMode(rawTeamContext, teamContextSelection.mode)
        : rawTeamContext,
    [rawTeamContext, teamContextSelection.mode],
  )

  const [memberTasks, setMemberTasks] = useState<ActionTask[]>([])
  const [memberProgress, setMemberProgress] = useState<ActionTaskProgress[]>([])
  const [memberSection, setMemberSection] = useState<SectionLoadState>(INITIAL_SECTION_STATE)

  const [managedTasks, setManagedTasks] = useState<ActionTask[]>([])
  const [managedProgress, setManagedProgress] = useState<ActionTaskProgress[]>([])
  const [managedSection, setManagedSection] = useState<SectionLoadState>(INITIAL_SECTION_STATE)

  const [adminTasks, setAdminTasks] = useState<ActionTask[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [progressError, setProgressError] = useState('')
  const [teamMemberOptions, setTeamMemberOptions] = useState<ActionTaskTeamMemberOption[]>([])

  const uid = currentUser?.uid
  const memberTeamId = teamContext.memberTeamId
  const managedTeamId = teamContext.managedTeamId
  const isSalesLeader = teamContextSelection.mode === 'leader'
  const salesTeamId = isSalesLeader ? managedTeamId : memberTeamId
  const { map: managedTeamMap, reload: reloadManagedTeamMap } = useTeamActionMap(managedTeamId)

  const isAdminWithoutTeam =
    appUser?.role === 'admin' &&
    !teamContext.hasManagedSection &&
    !teamContext.hasMemberSection &&
    !teamContext.isBlocked

  const memberTracking = useMemo(() => {
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

  const memberProgressByTaskId = useMemo(
    () => buildProgressMapByTaskId(memberProgress, uid ?? ''),
    [memberProgress, uid],
  )

  const managedOwnerProgressByTaskId = useMemo(
    () => buildProgressMapByTaskId(managedProgress, uid ?? ''),
    [managedProgress, uid],
  )

  const loadMemberSection = useCallback(async () => {
    if (!memberTeamId) {
      setMemberTasks([])
      setMemberProgress([])
      setMemberSection({ loading: false, error: '' })
      return
    }

    setMemberSection({ loading: true, error: '' })

    try {
      const [tasks, progress] = await Promise.all([
        actionPlanService.getTasksByTeamId(memberTeamId),
        uid
          ? actionTaskProgressService.getMyProgressByTeamId(memberTeamId, uid)
          : Promise.resolve([]),
      ])

      setMemberTasks(tasks)
      setMemberProgress(progress)
    } catch (loadError) {
      logActionPlanDevError('[Plan de Acción] Error al cargar plan de mi grupo', loadError)
      setMemberTasks([])
      setMemberProgress([])
      setMemberSection({
        loading: false,
        error:
          loadError instanceof Error
            ? loadError.message
            : 'No pudimos cargar el plan de tu grupo. Intenta nuevamente.',
      })
      return
    }

    setMemberSection({ loading: false, error: '' })
  }, [memberTeamId, uid])

  const loadManagedSection = useCallback(async () => {
    if (!uid || !managedTeamId) {
      setManagedTasks([])
      setManagedProgress([])
      setManagedSection({ loading: false, error: '' })
      return
    }

    setManagedSection({ loading: true, error: '' })

    try {
      void actionPlanService.associateLegacyTasksWithTeam(uid, managedTeamId).catch((syncError) => {
        logActionPlanDevError('[Plan de Acción] Error al asociar tareas legacy', syncError)
      })

      const [tasks, progress] = await Promise.all([
        actionPlanService.getManagedTasks(uid, managedTeamId),
        actionTaskProgressService.getProgressByTeamId(managedTeamId),
      ])

      setManagedTasks(tasks)
      setManagedProgress(progress)
    } catch (loadError) {
      logActionPlanDevError('[Plan de Acción] Error al cargar plan administrado', loadError)
      setManagedTasks([])
      setManagedProgress([])
      setManagedSection({
        loading: false,
        error:
          loadError instanceof Error
            ? loadError.message
            : 'No pudimos cargar tu plan administrado. Intenta nuevamente.',
      })
      return
    }

    setManagedSection({ loading: false, error: '' })
  }, [managedTeamId, uid])

  const loadAdminTasks = useCallback(async () => {
    if (!uid) {
      setAdminTasks([])
      setAdminLoading(false)
      return
    }

    setAdminLoading(true)
    setAdminError('')

    try {
      const tasks = await actionPlanService.getTasksByOwner(uid)
      setAdminTasks(tasks)
    } catch (loadError) {
      logActionPlanDevError('[Plan de Acción] Error al cargar tareas admin', loadError)
      setAdminTasks([])
      setAdminError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tus tareas. Intenta nuevamente.',
      )
    } finally {
      setAdminLoading(false)
    }
  }, [uid])

  useEffect(() => {
    if (!initialized || authLoading || resolvingTeams) {
      return
    }

    if (teamContext.isBlocked) {
      return
    }

    if (isAdminWithoutTeam) {
      void loadAdminTasks()
      return
    }

    void loadMemberSection()
    void loadManagedSection()
  }, [
    authLoading,
    initialized,
    isAdminWithoutTeam,
    loadAdminTasks,
    loadManagedSection,
    loadMemberSection,
    resolvingTeams,
    teamContext.isBlocked,
  ])

  useEffect(() => {
    if (!managedTeamId || !uid || !teamContext.canManageTeamTasks) {
      setTeamMemberOptions([])
      return
    }

    let cancelled = false

    teamService
      .getTeamMembersByTeamId(managedTeamId, uid)
      .then((members) => {
        if (cancelled) {
          return
        }

        setTeamMemberOptions(
          members
            .filter((member) => member.status === 'active' && member.memberUid !== uid)
            .map((member) => ({
              uid: member.memberUid,
              name: member.memberName?.trim() || member.memberEmail?.trim() || 'Miembro',
            })),
        )
      })
      .catch((loadError) => {
        logActionPlanDevError('[Plan de Acción] Error al cargar miembros del grupo', loadError)

        if (!cancelled) {
          setTeamMemberOptions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [managedTeamId, teamContext.canManageTeamTasks, uid])

  const handleCreateTask = useCallback(
    async (data: CreateActionTaskInput) => {
      if (!uid) {
        throw new Error('Debes iniciar sesión para agregar tareas.')
      }

      setIsCreatingTask(true)

      try {
        const created = isAdminWithoutTeam
          ? await actionPlanService.createTask(uid, data)
          : await actionPlanService.createTeamTask(uid, managedTeamId, data)

        if (!isAdminWithoutTeam && data.areaId && managedTeamId) {
          try {
            await teamActionMapService.linkTaskToArea(managedTeamId, data.areaId, created.id)
            reloadManagedTeamMap()
          } catch (linkError) {
            logActionPlanDevError('[Plan de Acción] Error al vincular tarea con el mapa', linkError)
          }
        }

        if (isAdminWithoutTeam) {
          setAdminTasks((current) => [created, ...current])
        } else {
          setManagedTasks((current) => [created, ...current])
        }

        showToast('Tarea creada correctamente.', 'success')
        setIsCreateModalOpen(false)
      } catch (createError) {
        logActionPlanDevError('[Plan de Acción] Error al crear tarea', createError)
        throw createError instanceof Error
          ? createError
          : new Error('No pudimos guardar la tarea. Intenta nuevamente.')
      } finally {
        setIsCreatingTask(false)
      }
    },
    [isAdminWithoutTeam, managedTeamId, reloadManagedTeamMap, showToast, uid],
  )

  const handleMemberProgressChange = useCallback(
    async (taskId: string, status: ActionTaskStatus) => {
      if (!uid || !memberTracking) {
        return
      }

      const task = memberTasks.find((entry) => entry.id === taskId)
      const taskTeamId = task?.teamId?.trim() || null

      if (!taskTeamId) {
        if (import.meta.env.DEV) {
          console.warn('[ActionPlan Progress Debug] Sin task.teamId — progreso omitido', { taskId })
        }
        setProgressError('No pudimos registrar tu avance porque la tarea no tiene grupo asociado.')
        return
      }

      const currentStatus = memberProgressByTaskId.get(taskId)?.status ?? 'pending'

      if (currentStatus === status) {
        return
      }

      setUpdatingTaskId(taskId)
      setProgressError('')

      try {
        const result = await actionTaskProgressService.upsertMyTaskProgress(
          {
            taskId,
            teamId: taskTeamId,
            memberUid: uid,
            memberName: memberTracking.memberName,
            memberEmail: memberTracking.memberEmail,
            status,
          },
          {
            authUid: uid,
            authEmail: currentUser?.email ?? null,
            emailVerified: currentUser?.emailVerified ?? false,
            appUserUid: appUser?.uid ?? null,
            homeTeamId: appUser?.homeTeamId ?? null,
            ownedTeamId: appUser?.ownedTeamId ?? null,
            taskId,
            taskTeamId,
            resolvedProgressTeamId: taskTeamId,
            memberUid: uid,
            nextStatus: status,
          },
        )

        if (!result.tracked) {
          setProgressError('No pudimos actualizar tu progreso. Intenta nuevamente.')
          return
        }

        setMemberProgress((current) => {
          const next = current.filter((entry) => entry.id !== result.progress.id)
          return [result.progress, ...next]
        })

        if (status === 'completed' && currentStatus !== 'completed') {
          showToast(`¡Felicidades! Has completado ${task?.title ?? 'el objetivo'} 🎉`, 'success')
        }
      } catch (updateError) {
        logActionPlanDevError('[Plan de Acción] Error al actualizar progreso', updateError)
        setProgressError('No pudimos actualizar tu progreso. Intenta nuevamente.')
      } finally {
        setUpdatingTaskId(null)
      }
    },
    [
      appUser?.homeTeamId,
      appUser?.ownedTeamId,
      appUser?.uid,
      currentUser?.email,
      currentUser?.emailVerified,
      memberProgressByTaskId,
      memberTasks,
      memberTracking,
      showToast,
      uid,
    ],
  )

  const handleManagedOwnerProgressChange = useCallback(
    async (taskId: string, status: ActionTaskStatus) => {
      if (!uid || !memberTracking) {
        return
      }

      const task = managedTasks.find((entry) => entry.id === taskId)
      const taskTeamId = task?.teamId?.trim() || managedTeamId

      if (!taskTeamId) {
        if (import.meta.env.DEV) {
          console.warn('[ActionPlan Progress Debug] Sin task.teamId — progreso omitido', { taskId })
        }
        setProgressError('No pudimos registrar tu avance porque la tarea no tiene grupo asociado.')
        return
      }

      const currentStatus = managedOwnerProgressByTaskId.get(taskId)?.status ?? 'pending'

      if (currentStatus === status) {
        return
      }

      setUpdatingTaskId(taskId)
      setProgressError('')

      try {
        const result = await actionTaskProgressService.upsertMyTaskProgress(
          {
            taskId,
            teamId: taskTeamId,
            memberUid: uid,
            memberName: memberTracking.memberName,
            memberEmail: memberTracking.memberEmail,
            status,
          },
          {
            authUid: uid,
            authEmail: currentUser?.email ?? null,
            emailVerified: currentUser?.emailVerified ?? false,
            appUserUid: appUser?.uid ?? null,
            homeTeamId: appUser?.homeTeamId ?? null,
            ownedTeamId: appUser?.ownedTeamId ?? null,
            taskId,
            taskTeamId: task?.teamId ?? taskTeamId,
            resolvedProgressTeamId: taskTeamId,
            memberUid: uid,
            nextStatus: status,
          },
        )

        if (!result.tracked) {
          setProgressError('No pudimos actualizar tu progreso. Intenta nuevamente.')
          return
        }

        setManagedProgress((current) => {
          const next = current.filter((entry) => entry.id !== result.progress.id)
          return [result.progress, ...next]
        })
      } catch (updateError) {
        logActionPlanDevError('[Plan de Acción] Error al actualizar progreso propio', updateError)
        setProgressError('No pudimos actualizar tu progreso. Intenta nuevamente.')
      } finally {
        setUpdatingTaskId(null)
      }
    },
    [
      appUser?.homeTeamId,
      appUser?.ownedTeamId,
      appUser?.uid,
      currentUser?.email,
      currentUser?.emailVerified,
      managedOwnerProgressByTaskId,
      managedTasks,
      managedTeamId,
      memberTracking,
      uid,
    ],
  )

  const handleAdminStatusChange = useCallback(
    async (taskId: string, status: ActionTaskStatus) => {
      const currentTask = adminTasks.find((task) => task.id === taskId)

      if (!currentTask || currentTask.status === status) {
        return
      }

      setUpdatingTaskId(taskId)
      setProgressError('')

      try {
        await actionPlanService.updateTaskStatus(taskId, status)
        setAdminTasks((current) =>
          current.map((task) => (task.id === taskId ? { ...task, status } : task)),
        )
      } catch (updateError) {
        logActionPlanDevError('[Plan de Acción] Error al actualizar estado', updateError)
        setProgressError('No pudimos actualizar el estado. Intenta nuevamente.')
      } finally {
        setUpdatingTaskId(null)
      }
    },
    [adminTasks],
  )

  const pageLoading =
    !initialized || authLoading || resolvingTeams || (isAdminWithoutTeam && adminLoading)

  const showCreateButton =
    !pageLoading &&
    !teamContext.isBlocked &&
    (teamContext.canManageTeamTasks || isAdminWithoutTeam)

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver tu plan de acción.</p>
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
    <div className="space-y-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Plan de Acción"
        subtitle="Organiza objetivos compartidos de tu grupo y da seguimiento a tu avance."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        actions={
          showCreateButton ? (
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar tarea
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

      {pageLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando plan de acción...
          </p>
        </div>
      ) : teamContext.isBlocked ? (
        <ActionPlanBlockedState />
      ) : (
        <>
          {progressError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {progressError}
            </div>
          ) : null}

          {salesTeamId ? (
            <SalesGoalCard
              teamId={salesTeamId}
              isLeader={isSalesLeader}
              contextQuery={teamContextSelection.mode ?? undefined}
            />
          ) : null}

          {managedTeamId && uid ? (
            <TeamActionMapSection
              teamId={managedTeamId}
              ownerUid={uid}
              canEdit={teamContext.canManageTeamTasks}
              sectionLabel="Mapa activo del grupo que administras"
              linkedTasks={managedTasks}
            />
          ) : null}

          {memberTeamId ? (
            <TeamActionMapSection
              teamId={memberTeamId}
              ownerUid={uid ?? ''}
              canEdit={false}
              sectionLabel="Mapa activo de mi grupo"
              linkedTasks={memberTasks}
            />
          ) : null}

          {isAdminWithoutTeam ? (
            <section className="space-y-4">
              {adminError ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {adminError}
                </div>
              ) : adminTasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Aún no tienes tareas"
                  description="Crea tu primera acción para empezar."
                  className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
                  action={
                    <Button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gold text-petrol-deep hover:bg-gold-light"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Agregar tarea
                    </Button>
                  }
                />
              ) : (
                <ActionTaskList
                  tasks={adminTasks}
                  updatingTaskId={updatingTaskId}
                  onStatusChange={handleAdminStatusChange}
                />
              )}
            </section>
          ) : null}

          {teamContext.hasMemberSection ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-hero-text">Plan de mi grupo</h2>
                <p className="mt-1 text-sm text-hero-text/70">
                  Objetivos compartidos por el grupo al que perteneces.
                </p>
              </div>

              {memberSection.loading ? (
                <p className="flex items-center gap-2 text-sm text-hero-text/70">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Cargando objetivos del grupo...
                </p>
              ) : memberSection.error ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {memberSection.error}
                </div>
              ) : memberTasks.length === 0 ? (
                <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
                  Tu grupo aún no ha publicado objetivos en el plan de acción.
                </p>
              ) : (
                <ActionTaskMemberList
                  tasks={memberTasks}
                  progressByTaskId={memberProgressByTaskId}
                  updatingTaskId={updatingTaskId}
                  onProgressChange={handleMemberProgressChange}
                />
              )}
            </section>
          ) : null}

          {teamContext.hasManagedSection ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-hero-text">Plan que administro</h2>
                <p className="mt-1 text-sm text-hero-text/70">
                  Crea y administra los objetivos de tu propio grupo.
                </p>
              </div>

              {managedSection.loading ? (
                <p className="flex items-center gap-2 text-sm text-hero-text/70">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Cargando objetivos administrados...
                </p>
              ) : managedSection.error ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {managedSection.error}
                </div>
              ) : managedTasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Aún no hay objetivos en tu grupo"
                  description="Crea el primer objetivo para tu equipo."
                  className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
                  action={
                    <Button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gold text-petrol-deep hover:bg-gold-light"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Agregar tarea
                    </Button>
                  }
                />
              ) : (
                <ActionTaskManagedList
                  tasks={managedTasks}
                  teamProgress={managedProgress}
                  ownerUid={uid}
                  ownerProgressByTaskId={managedOwnerProgressByTaskId}
                  updatingTaskId={updatingTaskId}
                  onOwnerProgressChange={handleManagedOwnerProgressChange}
                />
              )}
            </section>
          ) : null}

          <CreateActionTaskModal
            open={isCreateModalOpen}
            isSubmitting={isCreatingTask}
            managedTeamId={managedTeamId}
            roadmapAreas={managedTeamMap?.areas ?? []}
            teamMembers={teamMemberOptions}
            onClose={() => {
              if (!isCreatingTask) {
                setIsCreateModalOpen(false)
              }
            }}
            onSubmit={handleCreateTask}
          />
        </>
      )}
    </div>
  )
}
