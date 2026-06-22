import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { groupActivationService } from '@/features/group-activation/services/group-activation.service'
import type { GroupActivationRequest } from '@/features/group-activation/types/group-activation.types'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { formatExpansionAnnualPriceLabel } from '@/features/referrals/constants/referralProgram.constants'

const glassCardClassName =
  'rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl'

function formatRequestStatus(status: GroupActivationRequest['status']): string {
  if (status === 'pending') {
    return 'Pendiente'
  }

  if (status === 'approved') {
    return 'Aprobada'
  }

  return 'Rechazada'
}

export function AdminActivationRequestsPanel() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const [requests, setRequests] = useState<GroupActivationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const pendingRequests = await groupActivationService.listPendingActivationRequests()
      setRequests(pendingRequests)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No pudimos cargar las solicitudes de activación.'
      setLoadError(message)
      setRequests([])
      showToast(message, 'info')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  async function handleApprove(requestId: string) {
    if (!currentUser) {
      return
    }

    setProcessingId(requestId)

    try {
      await groupActivationService.approveActivationRequest(requestId, currentUser.uid)
      showToast(
        'Activación aprobada. Recompensas de recomendación generadas si existía cadena válida.',
        'success',
      )
      await loadRequests()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos aprobar la solicitud.'
      const permissionHint =
        message.includes('permission') || message.includes('Permission')
          ? ' Revisa que las reglas de Firestore estén desplegadas (firebase deploy --only firestore:rules).'
          : ''
      showToast(`${message}${permissionHint}`, 'info')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(requestId: string) {
    if (!currentUser) {
      return
    }

    setProcessingId(requestId)

    try {
      await groupActivationService.rejectActivationRequest(requestId, currentUser.uid)
      showToast('Solicitud rechazada.', 'success')
      await loadRequests()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos rechazar la solicitud.'
      showToast(message, 'info')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className={glassCardClassName}>
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-sm leading-relaxed text-hero-text/70">
          Revisa y gestiona las solicitudes pendientes de Activación de grupo (
          {formatExpansionAnnualPriceLabel()}).
        </p>
      </div>

      <div className="space-y-4 px-6 py-6">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando solicitudes...
          </p>
        ) : loadError ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {loadError}
          </p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-hero-text/70">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((request) => {
              const isProcessing = processingId === request.id

              return (
                <li
                  key={request.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2 text-sm">
                      <p className="font-semibold text-hero-text">{request.requesterName}</p>
                      <p className="text-hero-text/70">{request.requesterEmail}</p>
                      <p className="text-hero-text/70">
                        Importe: {request.amount} {request.currency}
                      </p>
                      <p className="text-hero-text/70">
                        Solicitada: {formatContactDateTime(request.requestedAt)}
                      </p>
                      <p className="text-hero-text/70">
                        Grupo actual: {request.currentHomeTeamId || 'Sin grupo asignado'}
                      </p>
                      <p className="text-hero-text/70">
                        Estado: {formatRequestStatus(request.status)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => void handleApprove(request.id)}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Procesando...
                          </>
                        ) : (
                          'Aprobar'
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        onClick={() => void handleReject(request.id)}
                        className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
