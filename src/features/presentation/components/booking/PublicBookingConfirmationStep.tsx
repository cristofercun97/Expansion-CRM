type Props = {
  professionalName: string
  dateLabel: string
  time: string
  durationMinutes: number
  participantName: string
  submitting: boolean
  error?: string
  onBack: () => void
  onConfirm: () => void
}

export function PublicBookingConfirmationStep({
  professionalName,
  dateLabel,
  time,
  durationMinutes,
  participantName,
  submitting,
  error,
  onBack,
  onConfirm,
}: Props) {
  return (
    <section data-testid="booking-step-4" aria-labelledby="booking-step4-title">
      <h2 id="booking-step4-title" className="pb-title">
        Confirma tu cita
      </h2>

      <div className="pb-summary" data-testid="booking-summary">
        <div className="pb-summary-row">
          <span className="pb-summary-k">Coach</span>
          <p className="pb-summary-v">{professionalName}</p>
        </div>
        <div className="pb-summary-row">
          <span className="pb-summary-k">Fecha</span>
          <p className="pb-summary-v">{dateLabel}</p>
        </div>
        <div className="pb-summary-row">
          <span className="pb-summary-k">Hora</span>
          <p className="pb-summary-v">{time}</p>
        </div>
        <div className="pb-summary-row">
          <span className="pb-summary-k">Duración</span>
          <p className="pb-summary-v">{durationMinutes} min</p>
        </div>
        <div className="pb-summary-row">
          <span className="pb-summary-k">Participante</span>
          <p className="pb-summary-v">{participantName}</p>
        </div>
      </div>

      {error ? (
        <p className="pb-banner" data-tone="error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}

      <div className="pb-actions">
        <button type="button" className="pb-btn pb-btn-secondary" onClick={onBack} disabled={submitting}>
          Atrás
        </button>
        <button
          type="button"
          className="pb-btn pb-btn-primary pb-btn-grow pb-btn-block"
          disabled={submitting}
          aria-busy={submitting}
          onClick={onConfirm}
        >
          {submitting ? 'Confirmando…' : 'Confirmar cita'}
        </button>
      </div>
    </section>
  )
}
