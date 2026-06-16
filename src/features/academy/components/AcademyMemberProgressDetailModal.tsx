import { CheckCircle2, Circle, Mail, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import type {
  AcademyMemberModuleProgressItem,
  AcademyMemberProgressRow,
} from '@/features/academy/types/academy-progress.types'
import {
  buildAcademyFollowUpMailto,
  getMemberStudyStatusBadgeClassName,
  getMemberStudyStatusLabel,
} from '@/features/academy/utils/academyProgressUtils'
import { formatContactDate, formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

type AcademyMemberProgressDetailModalProps = {
  open: boolean
  member: AcademyMemberProgressRow | null
  attempts: AcademyTestAttempt[]
  moduleProgress: AcademyMemberModuleProgressItem[]
  materialsById: Record<string, AcademyMaterial>
  testsById: Record<string, AcademyTest>
  onClose: () => void
}

export function AcademyMemberProgressDetailModal({
  open,
  member,
  attempts,
  moduleProgress,
  materialsById,
  testsById,
  onClose,
}: AcademyMemberProgressDetailModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  if (!open || !member) {
    return null
  }

  const contactMailto = buildAcademyFollowUpMailto(member.memberEmail)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-member-progress-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="academy-member-progress-detail-title" className="text-xl font-semibold text-hero-text">
              Detalle de {member.memberName}
            </h2>
            <p className="mt-1 truncate text-sm text-hero-text/70">{member.memberEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Estado de estudio</dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                      getMemberStudyStatusBadgeClassName(member.studyStatus),
                    )}
                  >
                    {getMemberStudyStatusLabel(member.studyStatus)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Avance de estudio</dt>
                <dd className="mt-1 font-semibold text-hero-text">{member.studyProgressLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Tests realizados</dt>
                <dd className="mt-1 font-semibold text-hero-text">{member.testsCompleted}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Promedio</dt>
                <dd className="mt-1 font-semibold text-hero-text">
                  {member.averageScore !== null ? `${member.averageScore}/100` : '—'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Última actividad</dt>
                <dd className="mt-1 font-medium text-hero-text">
                  {member.lastActivityAt
                    ? formatContactDateTime(member.lastActivityAt)
                    : 'Sin actividad'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hero-text/70">
              Avance por módulos
            </h3>

            {moduleProgress.length === 0 ? (
              <p className="mt-3 text-sm text-hero-text/70">
                Este equipo aún no tiene materiales publicados.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {moduleProgress.map((item) => (
                  <li
                    key={item.materialId}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      {item.reviewed ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 h-4 w-4 shrink-0 text-hero-text/40"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-hero-text">{item.title}</p>
                        <p className="text-sm text-hero-text/70">
                          {item.reviewed ? (
                            <>
                              Revisado
                              {item.openCount > 1 ? ` ${item.openCount} veces` : ''}
                              {item.lastOpenedAt
                                ? ` — ${formatContactDate(item.lastOpenedAt)}`
                                : ''}
                            </>
                          ) : (
                            'Pendiente'
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-hero-text/70">
              Tests y calificaciones
            </h3>

            {attempts.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-hero-text/75">
                Este miembro aún no ha realizado ningún test. Puedes contactarlo para darle seguimiento.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {attempts.map((attempt) => {
                  const material = materialsById[attempt.materialId]
                  const test = testsById[attempt.testId]
                  const materialTitle = material?.title ?? 'Material'
                  const testTitle = test?.title ?? 'Test'

                  return (
                    <li
                      key={attempt.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-hero-text">{materialTitle}</p>
                          <p className="text-sm text-hero-text/70">{testTitle}</p>
                        </div>
                        <div className="shrink-0 text-sm text-hero-text">
                          <p className="font-semibold">Calificación: {attempt.score}/100</p>
                          <p className="text-hero-text/70">
                            Correctas: {attempt.correctAnswers} / {attempt.totalQuestions}
                          </p>
                          <p className="text-hero-text/70">
                            {formatContactDateTime(attempt.submittedAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/10 px-6 py-4">
          {contactMailto ? (
            <a href={contactMailto}>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contactar
              </Button>
            </a>
          ) : (
            <Button type="button" variant="outline" disabled className="border-white/20 bg-white/5">
              Sin email
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
