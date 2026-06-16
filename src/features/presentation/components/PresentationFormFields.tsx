import { Input, type InputProps } from '@/components/ui/Input'
import { Textarea, type TextareaProps } from '@/components/ui/Textarea'
import type { PresentationFieldHintKey } from '@/features/presentation/constants/presentationFieldLimits'
import {
  buildPresentationHelperText,
  clampPresentationText,
  normalizeInterestOptionsText,
  countInterestOptionLines,
  PRESENTATION_FIELD_LIMITS,
} from '@/features/presentation/utils/presentationFieldUtils'
import { cn } from '@/lib/utils'

function CharacterCounter({ current, max }: { current: number; max: number }) {
  return (
    <p className="text-right text-xs text-text-soft" aria-live="polite">
      {current} / {max}
    </p>
  )
}

type PresentationInputProps = Omit<InputProps, 'maxLength'> & {
  maxLength: number
  showCounter?: boolean
  hint?: PresentationFieldHintKey
}

export function PresentationInput({
  maxLength,
  showCounter = false,
  hint,
  helperText,
  value,
  onChange,
  ...props
}: PresentationInputProps) {
  const stringValue = typeof value === 'string' ? value : String(value ?? '')

  return (
    <div className="space-y-1">
      <Input
        {...props}
        value={value}
        maxLength={maxLength}
        helperText={buildPresentationHelperText(helperText, hint)}
        onChange={(event) => {
          event.target.value = clampPresentationText(event.target.value, maxLength)
          onChange?.(event)
        }}
      />
      {showCounter ? <CharacterCounter current={stringValue.length} max={maxLength} /> : null}
    </div>
  )
}

type PresentationTextareaProps = Omit<TextareaProps, 'maxLength'> & {
  maxLength: number
  showCounter?: boolean
  hint?: PresentationFieldHintKey
}

export function PresentationTextarea({
  maxLength,
  showCounter = false,
  hint,
  helperText,
  value,
  onChange,
  className,
  rows = 4,
  ...props
}: PresentationTextareaProps) {
  const stringValue = typeof value === 'string' ? value : String(value ?? '')

  return (
    <div className="space-y-1">
      <Textarea
        {...props}
        rows={rows}
        value={value}
        maxLength={maxLength}
        className={cn('resize-none', className)}
        helperText={buildPresentationHelperText(helperText, hint)}
        onChange={(event) => {
          event.target.value = clampPresentationText(event.target.value, maxLength)
          onChange?.(event)
        }}
      />
      {showCounter ? <CharacterCounter current={stringValue.length} max={maxLength} /> : null}
    </div>
  )
}

type PresentationInterestOptionsTextareaProps = Omit<TextareaProps, 'maxLength' | 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
}

export function PresentationInterestOptionsTextarea({
  value,
  onChange,
  helperText,
  className,
  rows = 5,
  ...props
}: PresentationInterestOptionsTextareaProps) {
  const lineCount = countInterestOptionLines(value)

  return (
    <div className="space-y-1">
      <Textarea
        {...props}
        rows={rows}
        value={value}
        className={cn('resize-none', className)}
        helperText={buildPresentationHelperText(
          helperText ?? `Máximo ${PRESENTATION_FIELD_LIMITS.interestOptionLines} opciones.`,
          'oneIdeaPerLine',
        )}
        onChange={(event) => {
          onChange(normalizeInterestOptionsText(event.target.value))
        }}
      />
      <p className="text-right text-xs text-text-soft" aria-live="polite">
        {lineCount} / {PRESENTATION_FIELD_LIMITS.interestOptionLines} opciones
      </p>
    </div>
  )
}

export function PresentationUrlInput(props: Omit<PresentationInputProps, 'maxLength'>) {
  return <PresentationInput {...props} maxLength={PRESENTATION_FIELD_LIMITS.url} />
}

export function PresentationTitleInput(props: Omit<PresentationInputProps, 'maxLength'>) {
  return (
    <PresentationInput
      {...props}
      maxLength={PRESENTATION_FIELD_LIMITS.title}
      showCounter={props.showCounter ?? true}
      hint={props.hint ?? 'brief'}
    />
  )
}

export function PresentationDescriptionTextarea(props: Omit<PresentationTextareaProps, 'maxLength'>) {
  return (
    <PresentationTextarea
      {...props}
      maxLength={PRESENTATION_FIELD_LIMITS.description}
      showCounter={props.showCounter ?? true}
      hint={props.hint ?? 'readable'}
    />
  )
}

export function PresentationCtaInput(props: Omit<PresentationInputProps, 'maxLength'>) {
  return (
    <PresentationInput
      {...props}
      maxLength={PRESENTATION_FIELD_LIMITS.ctaText}
      hint={props.hint ?? 'brief'}
    />
  )
}
