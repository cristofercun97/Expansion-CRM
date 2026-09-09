import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMyNotifications } from '@/features/notifications/hooks/useMyNotifications'
import { cn } from '@/lib/utils'

type NotificationsBellProps = {
  uid: string
  className?: string
}

export function NotificationsBell({ uid, className }: NotificationsBellProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, loading } = useMyNotifications(uid)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className={cn('relative', className)} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-hero-text/80 transition-colors hover:bg-white/10 hover:text-hero-text"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-petrol-deep">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/12 bg-petrol-deep shadow-2xl">
          <div className="border-b border-white/10 px-3 py-2 text-sm font-medium text-hero-text">
            Notificaciones
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-hero-text/60">Cargando…</p>
            ) : null}
            {!loading && notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-hero-text/60">No tienes notificaciones.</p>
            ) : null}
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'block w-full border-b border-white/5 px-3 py-3 text-left transition-colors hover:bg-white/5',
                  !item.read && 'bg-gold/5',
                )}
                onClick={async () => {
                  if (!item.read) {
                    try {
                      await markRead(item.id)
                    } catch {
                      // ignore mark-read failure for navigation
                    }
                  }
                  setOpen(false)
                  navigate(item.actionUrl || '/dashboard/agenda')
                }}
              >
                <p className="text-sm font-medium text-hero-text">{item.title}</p>
                <p className="mt-0.5 text-xs text-hero-text/65">{item.message}</p>
                <p className="mt-1 text-[11px] text-gold-light">{item.actionLabel}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
