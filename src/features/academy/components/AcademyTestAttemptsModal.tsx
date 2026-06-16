import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'

type AcademyTestAttemptsModalProps = {
  open: boolean
  material: AcademyMaterial | null
  test: AcademyTest | null
  teamId: string | null
  onClose: () => void
}

export function AcademyTestAttemptsModal({
  open,
  material,
  test,
  teamId,
  onClose,
}: AcademyTestAttemptsModalProps) {
  const [attempts, setAttempts] = useState<AcademyTestAttempt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !test || !teamId) {
      return
    }

    let cancelled = false

    setLoading(true)
    setError('')

    academyTestAttemptsService
      .getAttemptsByTest(test.id, teamId)
      .then((results) => {
        if (!cancelled) {
          setAttempts(results)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setAttempts([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar las respuestas del test.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      cancelled = true
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open, teamId, test])

  if (!open || !material || !test) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar respuestas"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-test-attempts-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-petrol-dark/10 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-petrol-dark/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="academy-test-attempts-title" className="text-xl font-semibold text-text-dark">
              Respuestas del test
            </h2>
            <p className="mt-1 truncate text-sm text-text-soft">{material.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-soft transition-colors hover:bg-petrol-dark/5 hover:text-text-dark"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-text-soft">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando respuestas...
            </p>
          ) : error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : attempts.length === 0 ? (
            <p className="text-sm text-text-soft">Aún no hay respuestas para este test.</p>
          ) : (
            <ul className="space-y-3">
              {attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="rounded-xl border border-petrol-dark/10 bg-petrol-dark/5 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-dark">{attempt.memberName}</p>
                      <p className="text-sm text-text-soft">{attempt.memberEmail}</p>
                    </div>
                    <div className="shrink-0 text-sm text-text-dark">
                      <p className="font-semibold">Calificación: {attempt.score}/100</p>
                      <p className="text-text-soft">
                        Correctas: {attempt.correctAnswers} / {attempt.totalQuestions}
                      </p>
                      <p className="text-text-soft">
                        {formatContactDateTime(attempt.submittedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-petrol-dark/10 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
