import { ClipboardList, Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ActionTaskKpiGrid } from '@/features/action-plan/components/ActionTaskKpiGrid'
import { ActionTaskList } from '@/features/action-plan/components/ActionTaskList'
import { CreateActionTaskModal } from '@/features/action-plan/components/CreateActionTaskModal'
import { actionPlanService } from '@/features/action-plan/services/action-plan.service'
import type {
  ActionTask,
  ActionTaskStatus,
  CreateActionTaskInput,
} from '@/features/action-plan/types/action-plan.types'

function logActionPlanDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function ActionPlanPage() {
  const { showToast } = useToast()
  const { currentUser, initialized, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<ActionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState('')

  const uid = currentUser?.uid

  const loadTasks = useCallback(async (ownerUid: string) => {
    setLoading(true)
    setError('')

    try {
      const results = await actionPlanService.getTasksByOwner(ownerUid)
      setTasks(results)
    } catch (loadError) {
      logActionPlanDevError('[Plan de Acción] Error al cargar tareas', loadError)
      setTasks([])
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tus tareas. Intenta nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    if (!uid) {
      setLoading(false)
      return
    }

    void loadTasks(uid)
  }, [authLoading, initialized, loadTasks, uid])

  const handleCreateTask = useCallback(
    async (data: CreateActionTaskInput) => {
      if (!uid) {
        throw new Error('Debes iniciar sesión para agregar tareas.')
      }

      setIsCreatingTask(true)

      try {
        const created = await actionPlanService.createTask(uid, data)
        setTasks((current) => [created, ...current])
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
    [showToast, uid],
  )

  const handleStatusChange = useCallback(
    async (taskId: string, status: ActionTaskStatus) => {
      const currentTask = tasks.find((task) => task.id === taskId)

      if (!currentTask || currentTask.status === status) {
        return
      }

      setUpdatingTaskId(taskId)
      setStatusError('')

      try {
        await actionPlanService.updateTaskStatus(taskId, status)
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status,
                }
              : task,
          ),
        )
      } catch (updateError) {
        logActionPlanDevError('[Plan de Acción] Error al actualizar estado', updateError)
        setStatusError('No pudimos actualizar el estado. Intenta nuevamente.')
      } finally {
        setUpdatingTaskId(null)
      }
    },
    [tasks],
  )

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver tu plan de acción.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader
        title="Plan de Acción"
        subtitle="Organiza tus próximos pasos y mantén el enfoque diario."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        actions={
          !loading && !error ? (
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

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando tareas...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <>
          {tasks.length === 0 ? (
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
            <>
              <ActionTaskKpiGrid tasks={tasks} />

              {statusError ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {statusError}
                </div>
              ) : null}

              <ActionTaskList
                tasks={tasks}
                updatingTaskId={updatingTaskId}
                onStatusChange={handleStatusChange}
              />
            </>
          )}

          <CreateActionTaskModal
            open={isCreateModalOpen}
            isSubmitting={isCreatingTask}
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
