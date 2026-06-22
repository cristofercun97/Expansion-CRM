import { Bell, Check, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import { useMyReminders } from '@/features/reminders/hooks/useMyReminders'
import { getTeamReminderTypeLabel } from '@/features/reminders/utils/reminderLabels'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'

function formatReminderDate(reminder: TeamReminder): string {
  if (!reminder.createdAt?.toDate) {
    return 'Reciente'
  }

  return reminder.createdAt.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type ReminderItemProps = {
  reminder: TeamReminder
  marking: boolean
  onMarkAsRead: (reminderId: string) => void
}

function ReminderItem({ reminder, marking, onMarkAsRead }: ReminderItemProps) {
  const isUnread = reminder.status === 'unread'

  return (
    <article
      className={cn(
        'rounded-xl border px-4 py-3',
        isUnread ? 'border-gold/25 bg-gold/8' : 'border-white/10 bg-white/5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-hero-text">{reminder.title}</h3>
            {isUnread ? (
              <Badge variant="gold" className="border-gold/30 bg-gold/15 !text-gold-light">
                Nuevo
              </Badge>
            ) : (
              <span className="text-xs text-hero-text/50">Leído</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/75">{reminder.message}</p>
          <p className="mt-2 text-xs text-hero-text/55">
            {getTeamReminderTypeLabel(reminder.type)} · {formatReminderDate(reminder)}
            {reminder.senderName ? ` · De ${reminder.senderName}` : ''}
          </p>
          {reminder.type === 'sales_report' && reminder.relatedContext?.ctaPath ? (
            <Link
              to={reminder.relatedContext.ctaPath}
              className="mt-3 inline-flex text-xs font-medium text-teal-accent hover:text-teal-accent/80"
            >
              Revisar ventas en Plan de Acción
            </Link>
          ) : null}
        </div>
      </div>

      {isUnread ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={marking}
            onClick={() => onMarkAsRead(reminder.id)}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            {marking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Marcar como leído
          </Button>
        </div>
      ) : null}
    </article>
  )
}

type TeamReminderCardProps = {
  embedded?: boolean
  reminders?: TeamReminder[]
  unreadCount?: number
  lastReminderTitle?: string | null
  loading?: boolean
  error?: string
  markingId?: string | null
  onMarkAsRead?: (reminderId: string) => void
}

export function TeamReminderCard({
  embedded = false,
  reminders: controlledReminders,
  unreadCount: controlledUnreadCount,
  lastReminderTitle,
  loading: controlledLoading,
  error: controlledError,
  markingId: controlledMarkingId,
  onMarkAsRead: controlledMarkAsRead,
}: TeamReminderCardProps) {
  const { appUser } = useAuth()
  const internalState = useMyReminders(controlledReminders ? null : appUser?.uid)

  const reminders = controlledReminders ?? internalState.reminders
  const unreadCount = controlledUnreadCount ?? internalState.unreadCount
  const loading = controlledLoading ?? internalState.loading
  const error = controlledError ?? internalState.error
  const markingId = controlledMarkingId ?? internalState.markingId
  const markAsRead = controlledMarkAsRead ?? internalState.markAsRead
  const latestReminder = reminders[0] ?? null

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl',
        embedded ? 'h-full p-5' : 'p-5',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold-light" aria-hidden="true" />
          <h2 className="text-base font-semibold text-hero-text">Recordatorios del grupo</h2>
        </div>
        {unreadCount > 0 ? (
          <Badge variant="gold" className="border-gold/30 bg-gold/15 !text-gold-light">
            {unreadCount} sin leer
          </Badge>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-hero-text/65">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando recordatorios...
        </p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-200">{error}</p>
      ) : reminders.length === 0 ? (
        <p className="mt-4 text-sm text-hero-text/65">No tienes recordatorios pendientes.</p>
      ) : (
        <>
          {embedded ? (
            <div className="mt-4 space-y-2 text-sm text-hero-text/80">
              {lastReminderTitle || latestReminder?.title ? (
                <p>
                  <span className="text-hero-text/60">Último recordatorio: </span>
                  {lastReminderTitle ?? latestReminder?.title}
                </p>
              ) : null}
            </div>
          ) : null}

          <ul className={cn('space-y-3', embedded ? 'mt-3' : 'mt-4')}>
            {reminders.slice(0, embedded ? 2 : 5).map((reminder) => (
              <li key={reminder.id}>
                <ReminderItem
                  reminder={reminder}
                  marking={markingId === reminder.id}
                  onMarkAsRead={markAsRead}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
