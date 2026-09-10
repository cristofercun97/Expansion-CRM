import {
  BOOKING_STEP_LABELS,
  stepStatus,
  type BookingStep,
} from '@/features/presentation/utils/publicBookingUiUtils'

type Props = {
  current: BookingStep
}

export function PublicBookingStepper({ current }: Props) {
  return (
    <nav className="pb-stepper" aria-label="Pasos de la reserva">
      {BOOKING_STEP_LABELS.map((label, index) => {
        const step = (index + 1) as BookingStep
        const status = stepStatus(step, current)
        return (
          <div key={label} className="pb-step" data-status={status} data-testid={`booking-stepper-${step}`}>
            <span className="pb-step-dot" data-status={status} aria-current={status === 'active' ? 'step' : undefined}>
              {status === 'complete' ? '✓' : step}
            </span>
            <span className="pb-step-label">{label}</span>
          </div>
        )
      })}
    </nav>
  )
}
