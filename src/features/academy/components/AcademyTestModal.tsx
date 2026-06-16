import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTest, UpsertAcademyTestInput } from '@/features/academy/types/academy-test.types'
import {
  ACADEMY_TEST_OPTION_LABELS,
  buildAcademyTestFormFromQuestions,
  createDefaultAcademyTestForm,
  hasAcademyTestFormErrors,
  toUpsertAcademyTestQuestions,
  validateAcademyTestForm,
  type AcademyTestFormErrors,
  type AcademyTestFormValues,
} from '@/features/academy/utils/academyTestForm'

type AcademyTestModalProps = {
  open: boolean
  material: AcademyMaterial | null
  existingTest: AcademyTest | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: UpsertAcademyTestInput) => Promise<void>
}

const selectClassName =
  'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

export function AcademyTestModal({
  open,
  material,
  existingTest,
  isSubmitting,
  onClose,
  onSubmit,
}: AcademyTestModalProps) {
  const [values, setValues] = useState<AcademyTestFormValues>(createDefaultAcademyTestForm())
  const [fieldErrors, setFieldErrors] = useState<AcademyTestFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open || !material) {
      return
    }

    if (existingTest) {
      setValues(
        buildAcademyTestFormFromQuestions(
          existingTest.title,
          existingTest.isActive,
          existingTest.questions,
        ),
      )
    } else {
      setValues({
        ...createDefaultAcademyTestForm(),
        title: `Test: ${material.title}`,
      })
    }

    setFieldErrors({})
    setSubmitError('')

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [existingTest, isSubmitting, material, onClose, open])

  if (!open || !material) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateAcademyTestForm(values)

    if (hasAcademyTestFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit({
        title: values.title.trim(),
        questions: toUpsertAcademyTestQuestions(values),
        isActive: values.isActive,
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar el test. Intenta nuevamente.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar formulario"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-test-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-petrol-dark/10 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-petrol-dark/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id="academy-test-title" className="text-xl font-semibold text-text-dark">
              {existingTest ? 'Editar test' : 'Crear test'}
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

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {submitError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}

            <Input
              label="Título del test"
              name="title"
              value={values.title}
              required
              minLength={3}
              disabled={isSubmitting}
              error={fieldErrors.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-petrol-dark/10 bg-petrol-dark/5 px-3 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={values.isActive}
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="h-4 w-4 rounded border-petrol-dark/20 text-teal focus:ring-teal/30"
              />
              <span className="text-sm text-text-dark">Test activo</span>
            </label>

            {values.questions.map((question, questionIndex) => {
              const questionErrors = fieldErrors.questions?.[questionIndex]

              return (
                <section
                  key={questionIndex}
                  className="rounded-xl border border-petrol-dark/10 bg-petrol-dark/5 p-4"
                >
                  <h3 className="text-sm font-semibold text-text-dark">
                    Pregunta {questionIndex + 1}
                  </h3>

                  <div className="mt-3 space-y-3">
                    <Textarea
                      label="Texto de la pregunta"
                      name={`question-${questionIndex}`}
                      rows={2}
                      value={question.questionText}
                      disabled={isSubmitting}
                      error={questionErrors?.questionText}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          questions: current.questions.map((item, index) =>
                            index === questionIndex
                              ? { ...item, questionText: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />

                    {ACADEMY_TEST_OPTION_LABELS.map((label, optionIndex) => (
                      <Input
                        key={optionIndex}
                        label={`Opción ${label}`}
                        name={`question-${questionIndex}-option-${optionIndex}`}
                        value={question.options[optionIndex]}
                        disabled={isSubmitting}
                        error={questionErrors?.options?.[optionIndex]}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            questions: current.questions.map((item, index) => {
                              if (index !== questionIndex) {
                                return item
                              }

                              const nextOptions = [...item.options] as [
                                string,
                                string,
                                string,
                                string,
                              ]
                              nextOptions[optionIndex] = event.target.value

                              return { ...item, options: nextOptions }
                            }),
                          }))
                        }
                      />
                    ))}

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`correct-option-${questionIndex}`}
                        className="text-sm font-medium text-text-dark"
                      >
                        Respuesta correcta
                      </label>
                      <select
                        id={`correct-option-${questionIndex}`}
                        name={`correct-option-${questionIndex}`}
                        value={
                          question.correctOptionIndex === null
                            ? ''
                            : String(question.correctOptionIndex)
                        }
                        disabled={isSubmitting}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            questions: current.questions.map((item, index) =>
                              index === questionIndex
                                ? {
                                    ...item,
                                    correctOptionIndex:
                                      event.target.value === ''
                                        ? null
                                        : (Number(event.target.value) as 0 | 1 | 2 | 3),
                                  }
                                : item,
                            ),
                          }))
                        }
                        className={selectClassName}
                      >
                        <option value="" disabled>
                          Selecciona la respuesta correcta
                        </option>
                        {ACADEMY_TEST_OPTION_LABELS.map((label, optionIndex) => (
                          <option key={label} value={optionIndex}>
                            Opción {label}
                          </option>
                        ))}
                      </select>
                      {questionErrors?.correctOptionIndex ? (
                        <p className="text-sm text-red-600">{questionErrors.correctOptionIndex}</p>
                      ) : null}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 border-t border-petrol-dark/10 px-6 py-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Guardar test'
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
