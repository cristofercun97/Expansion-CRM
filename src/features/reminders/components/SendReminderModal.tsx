import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { remindersService } from '@/features/reminders/services/reminders.service'
import type { TeamReminderType } from '@/features/reminders/types/reminder.types'
import type { TeamMemberProgressRow } from '@/features/team-progress/types/team-progress.types'
import {
  REMINDER_TYPE_OPTIONS,
  buildDefaultReminderContent,
} from '@/features/reminders/utils/reminderLabels'
import { cn } from '@/lib/utils'

type SendReminderModalProps = {
  open: boolean
  member: TeamMemberProgressRow | null
  teamId: string | null
  senderUid: string | null
  senderName: string
  onClose: () => void
  onSent: () => void
  onError: (message: string) => void
}

export function SendReminderModal({
  open,
  member,
  teamId,
  senderUid,
  senderName,
  onClose,
  onSent,
  onError,
}: SendReminderModalProps) {
  const defaults = useMemo(() => {
    if (!member) {
      return { title: '', message: '' }
    }

    return buildDefaultReminderContent(member.memberName, member.priority, member.overallStatus)
  }, [member])

  const [type, setType] = useState<TeamReminderType>('follow_up')
  const [title, setTitle] = useState(defaults.title)
  const [message, setMessage] = useState(defaults.message)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !member) {
      return
    }

    const content = buildDefaultReminderContent(
      member.memberName,
      member.priority,
      member.overallStatus,
    )
    setType('follow_up')
    setTitle(content.title)
    setMessage(content.message)
  }, [member, open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open, submitting])

  if (!open || !member || !teamId || !senderUid) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!member || !teamId || !senderUid) {
      return
    }

    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()

    if (!trimmedTitle || !trimmedMessage) {
      onError('Completa el título y el mensaje del recordatorio.')
      return
    }

    setSubmitting(true)

    try {
      await remindersService.createTeamReminder({
        teamId,
        senderUid,
        senderName,
        recipientUid: member.memberUid,
        recipientName: member.memberName,
        recipientEmail: member.memberEmail,
        title: trimmedTitle,
        message: trimmedMessage,
        type,
        relatedContext: {
          source: 'team_progress',
          priority: member.priority,
        },
      })

      onSent()
      onClose()
    } catch (submitError) {
      onError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos enviar el recordatorio. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar modal"
        onClick={submitting ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-reminder-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="send-reminder-title" className="text-xl font-semibold text-hero-text">
              Enviar recordatorio
            </h2>
            <p className="mt-1 text-sm text-hero-text/70">
              Para {member.memberName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="reminder-type" className="mb-1.5 block text-sm font-medium text-hero-text">
                Tipo
              </label>
              <select
                id="reminder-type"
                value={type}
                onChange={(event) => setType(event.target.value as TeamReminderType)}
                disabled={submitting}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-hero-text outline-none focus:border-gold/40"
              >
                {REMINDER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-petrol-deep">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reminder-title" className="mb-1.5 block text-sm font-medium text-hero-text">
                Título
              </label>
              <input
                id="reminder-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={submitting}
                maxLength={200}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-hero-text outline-none focus:border-gold/40"
              />
            </div>

            <div>
              <label htmlFor="reminder-message" className="mb-1.5 block text-sm font-medium text-hero-text">
                Mensaje
              </label>
              <textarea
                id="reminder-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={submitting}
                rows={5}
                maxLength={2000}
                className={cn(
                  'w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-hero-text outline-none focus:border-gold/40',
                )}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                'Enviar recordatorio'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
