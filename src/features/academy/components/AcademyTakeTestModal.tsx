import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttemptResult } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest, AcademyTestCorrectOptionIndex } from '@/features/academy/types/academy-test.types'
import { ACADEMY_TEST_OPTION_LABELS } from '@/features/academy/utils/academyTestForm'
import { cn } from '@/lib/utils'

type AcademyTakeTestModalProps = {
  open: boolean
  material: AcademyMaterial | null
  test: AcademyTest | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (selectedAnswers: AcademyTestCorrectOptionIndex[]) => Promise<AcademyTestAttemptResult>
}

export function AcademyTakeTestModal({
  open,
  material,
  test,
  isSubmitting,
  onClose,
  onSubmit,
}: AcademyTakeTestModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Array<AcademyTestCorrectOptionIndex | null>>(
    [null, null, null, null, null],
  )
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<AcademyTestAttemptResult | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedAnswers([null, null, null, null, null])
    setSubmitError('')
    setResult(null)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting && !result) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSubmitting, onClose, open, result])

  if (!open || !material || !test) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedAnswers.some((answer) => answer === null)) {
      setSubmitError('Responde las 5 preguntas antes de enviar.')
      return
    }

    setSubmitError('')

    try {
      const attemptResult = await onSubmit(
        selectedAnswers as AcademyTestCorrectOptionIndex[],
      )
      setResult(attemptResult)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos enviar tu test. Intenta nuevamente.',
      )
    }
  }

  function handleRetry() {
    setSelectedAnswers([null, null, null, null, null])
    setSubmitError('')
    setResult(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar test"
        disabled={isSubmitting}
        onClick={() => {
          if (!result) {
            onClose()
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-take-test-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-petrol-dark/10 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-petrol-dark/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="academy-take-test-title" className="text-xl font-semibold text-text-dark">
              {result ? 'Test concluido' : 'Realizar test'}
            </h2>
            <p className="mt-1 truncate text-sm text-text-soft">{material.title}</p>
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

        {result ? (
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-teal">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="mt-4 text-lg font-semibold text-text-dark">
                Test concluido con éxito
              </p>
              <p className="mt-2 text-sm text-text-soft">Tu calificación</p>
              <p className="mt-1 text-4xl font-semibold text-petrol-deep">{result.score}/100</p>
              <p className="mt-3 text-sm text-text-dark">
                Respuestas correctas: {result.correctAnswers} de {result.totalQuestions}
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button type="button" onClick={handleRetry}>
                Volver a intentar
              </Button>
            </div>
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {submitError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {submitError}
                </p>
              ) : null}

              {test.questions.map((question, questionIndex) => (
                <fieldset
                  key={questionIndex}
                  className="rounded-xl border border-petrol-dark/10 bg-petrol-dark/5 p-4"
                >
                  <legend className="px-1 text-sm font-semibold text-text-dark">
                    Pregunta {questionIndex + 1}
                  </legend>
                  <p className="mt-2 text-sm leading-relaxed text-text-dark">
                    {question.questionText}
                  </p>
                  <div className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const optionValue = optionIndex as AcademyTestCorrectOptionIndex
                      const isSelected = selectedAnswers[questionIndex] === optionValue

                      return (
                        <label
                          key={optionIndex}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                            isSelected
                              ? 'border-teal bg-teal/10 text-text-dark'
                              : 'border-petrol-dark/10 bg-white text-text-dark hover:border-teal/40',
                          )}
                        >
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            value={optionIndex}
                            checked={isSelected}
                            disabled={isSubmitting}
                            className="mt-0.5"
                            onChange={() => {
                              setSelectedAnswers((current) => {
                                const next = [...current]
                                next[questionIndex] = optionValue
                                return next
                              })
                            }}
                          />
                          <span>
                            <span className="font-semibold">
                              {ACADEMY_TEST_OPTION_LABELS[optionIndex]}.
                            </span>{' '}
                            {option}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-petrol-dark/10 px-6 py-4">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  'Enviar test'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
