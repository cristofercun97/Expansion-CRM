import { useEffect, useId, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { meetingNextActionFunctionsService } from '@/features/agenda/services/meeting-next-action-functions.service'
import type { Meeting } from '@/features/agenda/types/meeting.types'

type CreateMeetingNextActionModalProps = {
  meeting: Meeting | null
  open: boolean
  onClose: () => void
  onCreated: (taskId: string) => void
}

function todayYmd(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function CreateMeetingNextActionModal({
  meeting,
  open,
  onClose,
  onCreated,
}: CreateMeetingNextActionModalProps) {
  const titleId = useId()
  const [sessionKey, setSessionKey] = useState(`${meeting?.id || 'none'}:closed`)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(todayYmd())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(`${meeting?.id || 'x'}_session`)

  const nextSessionKey = open && meeting ? `${meeting.id}:open` : `${meeting?.id || 'none'}:closed`
  if (nextSessionKey !== sessionKey) {
    setSessionKey(nextSessionKey)
    setTitle('')
    setDescription('')
    setDueDate(todayYmd())
    setError('')
    setSubmitting(false)
    setIdempotencyKey(`${meeting?.id || 'x'}_${sessionKey}`)
  }

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !meeting) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting || !meeting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await meetingNextActionFunctionsService.createMeetingNextAction({
        meetingId: meeting.id,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        idempotencyKey,
      })
      onCreated(result.taskId)
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos crear la próxima acción.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/12 bg-petrol-deep p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-hero-text">
              Crear próxima acción
            </h2>
            <p className="mt-1 text-sm text-hero-text/65">
              Se añadirá a tu Plan de Acción.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-hero-text/60 hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm text-hero-text/80">Título</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contactar a María el viernes"
              maxLength={200}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-hero-text/80">Fecha límite</span>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-hero-text/80">Descripción (opcional)</span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={300}
              rows={3}
            />
          </label>

          {meeting.contactId ? (
            <p className="text-xs text-hero-text/55">
              Contacto relacionado: preseleccionado desde la reunión.
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || title.trim().length < 3}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Crear acción'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
