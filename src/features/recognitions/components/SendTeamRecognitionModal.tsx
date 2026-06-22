import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { teamRecognitionService } from '@/features/recognitions/services/team-recognition.service'
import type {
  TeamRecognitionType,
  TeamRecognitionVisibility,
} from '@/features/recognitions/types/team-recognition.types'
import type { TeamMember } from '@/features/team/types/team.types'
import { teamService } from '@/features/team/services/team.service'
import {
  SEND_TEAM_RECOGNITION_MODAL,
  TEAM_RECOGNITION_TYPE_OPTIONS,
  TEAM_RECOGNITION_VISIBILITY_OPTIONS,
} from '@/features/recognitions/utils/teamRecognitionCopy'
import { cn } from '@/lib/utils'

type SendTeamRecognitionModalProps = {
  open: boolean
  teamId: string
  senderUid: string
  senderName: string
  onClose: () => void
  onSent: () => void
  onError: (message: string) => void
}

export function SendTeamRecognitionModal({
  open,
  teamId,
  senderUid,
  senderName,
  onClose,
  onSent,
  onError,
}: SendTeamRecognitionModalProps) {
  const defaultType = TEAM_RECOGNITION_TYPE_OPTIONS[0]
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [recipientUid, setRecipientUid] = useState('')
  const [type, setType] = useState<TeamRecognitionType>(defaultType.type)
  const [title, setTitle] = useState(defaultType.title)
  const [message, setMessage] = useState(defaultType.message)
  const [visibility, setVisibility] = useState<TeamRecognitionVisibility>('team')
  const [submitting, setSubmitting] = useState(false)

  const activeMembers = useMemo(
    () =>
      members.filter(
        (member) => member.status === 'active' && member.memberUid.trim().length > 0,
      ),
    [members],
  )

  const selectedMember = useMemo(
    () => activeMembers.find((member) => member.memberUid === recipientUid) ?? null,
    [activeMembers, recipientUid],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const defaultOption = TEAM_RECOGNITION_TYPE_OPTIONS[0]
    setType(defaultOption.type)
    setTitle(defaultOption.title)
    setMessage(defaultOption.message)
    setVisibility('team')
    setRecipientUid('')
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    async function loadMembers() {
      setLoadingMembers(true)

      try {
        const team = await teamService.getTeamById(teamId)

        if (!team) {
          throw new Error('No encontramos el equipo.')
        }

        const nextMembers = await teamService.getTeamMembersByTeamId(teamId, team.ownerUid)

        if (!cancelled) {
          setMembers(nextMembers)
          const firstMember = nextMembers.find((member) => member.status === 'active')
          setRecipientUid(firstMember?.memberUid ?? '')
        }
      } catch (loadError) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('[SendTeamRecognitionModal] Failed to load members', loadError)
          }

          onError('No pudimos cargar los miembros del equipo.')
        }
      } finally {
        if (!cancelled) {
          setLoadingMembers(false)
        }
      }
    }

    void loadMembers()

    return () => {
      cancelled = true
    }
  }, [onError, open, teamId])

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

  function handleTypeChange(nextType: TeamRecognitionType) {
    const option = TEAM_RECOGNITION_TYPE_OPTIONS.find((item) => item.type === nextType)

    if (!option) {
      return
    }

    setType(option.type)
    setTitle(option.title)
    setMessage(option.message)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!selectedMember) {
      onError('Selecciona un miembro para reconocer.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()

    if (!trimmedTitle || !trimmedMessage) {
      onError('Completa el título y el mensaje del reconocimiento.')
      return
    }

    setSubmitting(true)

    try {
      await teamRecognitionService.createTeamRecognition({
        teamId,
        senderUid,
        senderName,
        recipientUid: selectedMember.memberUid,
        recipientName: selectedMember.memberName ?? 'Miembro del equipo',
        recipientEmail: selectedMember.memberEmail ?? null,
        type,
        title: trimmedTitle,
        message: trimmedMessage,
        visibility,
      })

      onSent()
      onClose()
    } catch (submitError) {
      onError(
        submitError instanceof Error
          ? submitError.message
          : SEND_TEAM_RECOGNITION_MODAL.errorMessage,
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return null
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
        aria-labelledby="send-team-recognition-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="send-team-recognition-title" className="text-xl font-semibold text-hero-text">
              {SEND_TEAM_RECOGNITION_MODAL.title}
            </h2>
            <p className="mt-1 text-sm text-hero-text/70">{SEND_TEAM_RECOGNITION_MODAL.subtitle}</p>
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
          <p className="rounded-xl border border-teal-accent/20 bg-teal-accent/8 px-4 py-3 text-sm leading-relaxed text-hero-text/75">
            {SEND_TEAM_RECOGNITION_MODAL.microcopy}
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="recognition-member" className="mb-1.5 block text-sm font-medium text-hero-text">
                Miembro
              </label>
              {loadingMembers ? (
                <p className="flex items-center gap-2 text-sm text-hero-text/60">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Cargando miembros...
                </p>
              ) : (
                <select
                  id="recognition-member"
                  value={recipientUid}
                  onChange={(event) => setRecipientUid(event.target.value)}
                  disabled={submitting || activeMembers.length === 0}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-hero-text outline-none focus:border-gold/40"
                >
                  {activeMembers.length === 0 ? (
                    <option value="">No hay miembros activos</option>
                  ) : (
                    activeMembers.map((member) => (
                      <option key={member.memberUid} value={member.memberUid} className="bg-petrol-deep">
                        {member.memberName ?? member.memberEmail ?? member.memberUid}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-hero-text">Tipo de reconocimiento</p>
              <div className="flex flex-wrap gap-2">
                {TEAM_RECOGNITION_TYPE_OPTIONS.map((option) => {
                  const isSelected = type === option.type

                  return (
                    <button
                      key={option.type}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleTypeChange(option.type)}
                      aria-pressed={isSelected}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        isSelected
                          ? 'border-gold/40 bg-gold/15 text-gold-light'
                          : 'border-white/15 bg-white/5 text-hero-text/75 hover:border-white/25 hover:bg-white/8',
                        submitting && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="recognition-title" className="mb-1.5 block text-sm font-medium text-hero-text">
                Título
              </label>
              <input
                id="recognition-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={submitting}
                maxLength={120}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-hero-text outline-none placeholder:text-hero-text/35 focus:border-gold/40"
              />
            </div>

            <div>
              <label htmlFor="recognition-message" className="mb-1.5 block text-sm font-medium text-hero-text">
                Mensaje
              </label>
              <textarea
                id="recognition-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={submitting}
                maxLength={1000}
                rows={4}
                className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-hero-text outline-none placeholder:text-hero-text/35 focus:border-gold/40"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-hero-text">Visibilidad</p>
              <div className="space-y-2">
                {TEAM_RECOGNITION_VISIBILITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                      visibility === option.value
                        ? 'border-gold/30 bg-gold/8'
                        : 'border-white/15 bg-white/5 hover:border-white/25',
                      submitting && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <input
                      type="radio"
                      name="recognition-visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      disabled={submitting}
                      onChange={() => setVisibility(option.value)}
                      className="mt-1 accent-gold"
                    />
                    <span>
                      <span className="block text-sm font-medium text-hero-text">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-hero-text/60">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || loadingMembers || activeMembers.length === 0}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                SEND_TEAM_RECOGNITION_MODAL.submitLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
