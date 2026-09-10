import {
  BOOKING_STEPPER_LABELS,
  stepStatus,
  type BookingStep,
} from '@/features/presentation/utils/publicBookingUiUtils'

type Props = {
  current: BookingStep
}

export function PublicBookingStepper({ current }: Props) {
  return (
    <nav className="pb-stepper" aria-label="Pasos de la reserva">
      {BOOKING_STEPPER_LABELS.map((label, index) => {
        const step = (index + 1) as BookingStep
        const status = stepStatus(step, current)
        const indexLabel = String(step).padStart(2, '0')
        return (
          <div
            key={label}
            className="pb-step"
            data-status={status}
            data-testid={`booking-stepper-${step}`}
          >
            <span
              className="pb-step-dot"
              data-status={status}
              aria-current={status === 'active' ? 'step' : undefined}
            >
              {status === 'complete' ? '✓' : indexLabel}
            </span>
            <span className="pb-step-label">
              {indexLabel} — {label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
