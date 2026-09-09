import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { googleCalendarFunctionsService } from '@/features/agenda/services/google-calendar-functions.service'
import type { GoogleCalendarConnectionStatus } from '@/features/agenda/types/meeting.types'
import { cn } from '@/lib/utils'

type GoogleCalendarStatusCardProps = {
  className?: string
  onStatusChange?: (status: GoogleCalendarConnectionStatus) => void
}

export function GoogleCalendarStatusCard({
  className,
  onStatusChange,
}: GoogleCalendarStatusCardProps) {
  const { showToast } = useToast()
  const [status, setStatus] = useState<GoogleCalendarConnectionStatus>({
    connected: false,
    email: null,
    configured: false,
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const next = await googleCalendarFunctionsService.getConnectionStatus()
      if (!cancelled) {
        setStatus(next)
        onStatusChange?.(next)
        setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [onStatusChange])

  async function handleConnect() {
    setBusy(true)
    try {
      const url = await googleCalendarFunctionsService.getConnectUrl()
      window.location.assign(url)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No pudimos iniciar la conexión con Google.',
        'info',
      )
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm(
      '¿Desconectar Google Calendar? Las reuniones ya creadas se conservarán, pero no se sincronizarán nuevas hasta que vuelvas a conectar.',
    )
    if (!confirmed) {
      return
    }

    setBusy(true)
    try {
      await googleCalendarFunctionsService.disconnect()
      const next = { connected: false, email: null, configured: status.configured }
      setStatus(next)
      onStatusChange?.(next)
      showToast('Google Calendar desconectado.', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No pudimos desconectar Google Calendar.',
        'info',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-hero-text">Google Calendar</p>
          {loading ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-hero-text/65">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Comprobando conexión...
            </p>
          ) : status.connected ? (
            <p className="mt-1 text-sm text-teal-accent">
              ● Conectado{status.email ? ` · ${status.email}` : ''}
            </p>
          ) : (
            <p className="mt-1 text-sm text-hero-text/65">
              ○ No conectado
              {!status.configured
                ? ' · La integración aún requiere configuración en Google Cloud'
                : ''}
            </p>
          )}
        </div>

        {status.connected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void handleDisconnect()}
            className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
          >
            Desconectar
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={busy || !status.configured}
            onClick={() => void handleConnect()}
            className="bg-gold text-petrol-deep hover:bg-gold-light"
          >
            Conectar Google Calendar
          </Button>
        )}
      </div>
    </div>
  )
}
