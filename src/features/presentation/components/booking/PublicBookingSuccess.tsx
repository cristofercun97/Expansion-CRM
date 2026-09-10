type Props = {
  professionalName: string
  dateLabel: string
  time: string
  durationMinutes: number
}

export function PublicBookingSuccess({
  professionalName,
  dateLabel,
  time,
  durationMinutes,
}: Props) {
  return (
    <section className="pb-success" data-testid="booking-success" aria-live="polite">
      <div className="pb-success-icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="pb-title">Cita confirmada</h2>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--color-text-soft)' }}>
        Tu encuentro ha sido reservado correctamente.
      </p>
      <div className="pb-summary" style={{ textAlign: 'left' }}>
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
          <span className="pb-summary-k">Profesional</span>
          <p className="pb-summary-v">{professionalName}</p>
        </div>
      </div>
    </section>
  )
}
