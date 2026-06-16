import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { CreateActionTaskInput } from '@/features/action-plan/types/action-plan.types'
import {
  ACTION_TASK_PRIORITY_OPTIONS,
  ACTION_TASK_STATUS_OPTIONS,
} from '@/features/action-plan/utils/actionTaskLabels'
import {
  DEFAULT_ACTION_TASK_FORM,
  hasActionTaskFormErrors,
  validateActionTaskForm,
  type ActionTaskFormErrors,
  type ActionTaskFormValues,
} from '@/features/action-plan/utils/actionTaskForm'

type CreateActionTaskModalProps = {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: CreateActionTaskInput) => Promise<void>
}

const selectClassName =
  'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

export function CreateActionTaskModal({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateActionTaskModalProps) {
  const [values, setValues] = useState<ActionTaskFormValues>(DEFAULT_ACTION_TASK_FORM)
  const [fieldErrors, setFieldErrors] = useState<ActionTaskFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(DEFAULT_ACTION_TASK_FORM)
    setFieldErrors({})
    setSubmitError('')

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateActionTaskForm(values)

    if (hasActionTaskFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status as CreateActionTaskInput['status'],
        priority: values.priority as CreateActionTaskInput['priority'],
        dueDate: values.dueDate.trim() || undefined,
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar la tarea. Intenta nuevamente.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar formulario"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-action-task-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-action-task-title" className="text-xl font-semibold text-text-dark">
              Agregar tarea
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              Define una acción concreta para avanzar en tu plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-text-soft transition-colors hover:bg-petrol-dark/5 hover:text-text-dark disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <Input
            label="Título"
            name="title"
            value={values.title}
            required
            minLength={3}
            disabled={isSubmitting}
            error={fieldErrors.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          />

          <Textarea
            label="Descripción"
            name="description"
            rows={3}
            maxLength={300}
            value={values.description}
            disabled={isSubmitting}
            error={fieldErrors.description}
            helperText="Opcional. Máximo 300 caracteres."
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="action-task-priority" className="text-sm font-medium text-text-dark">
                Prioridad
              </label>
              <select
                id="action-task-priority"
                name="priority"
                value={values.priority}
                required
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    priority: event.target.value as ActionTaskFormValues['priority'],
                  }))
                }
                className={selectClassName}
              >
                <option value="" disabled>
                  Selecciona prioridad
                </option>
                {ACTION_TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.priority ? (
                <p className="text-sm text-red-600">{fieldErrors.priority}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="action-task-status" className="text-sm font-medium text-text-dark">
                Estado inicial
              </label>
              <select
                id="action-task-status"
                name="status"
                value={values.status}
                required
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as ActionTaskFormValues['status'],
                  }))
                }
                className={selectClassName}
              >
                <option value="" disabled>
                  Selecciona estado
                </option>
                {ACTION_TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.status ? (
                <p className="text-sm text-red-600">{fieldErrors.status}</p>
              ) : null}
            </div>
          </div>

          <Input
            label="Fecha límite"
            name="dueDate"
            type="date"
            value={values.dueDate}
            disabled={isSubmitting}
            helperText="Opcional."
            onChange={(event) =>
              setValues((current) => ({ ...current, dueDate: event.target.value }))
            }
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Guardar tarea'
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
