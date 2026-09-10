type Props = {
  professionalName: string
  dateLabel: string
  time: string
  durationMinutes: number
  presentationSlug?: string
  onFinish?: () => void
}

export function PublicBookingSuccess({
  professionalName,
  dateLabel,
  time,
  durationMinutes,
  presentationSlug,
  onFinish,
}: Props) {
  const presentationHref = presentationSlug?.trim()
    ? `/p/${presentationSlug.trim()}`
    : undefined

  return (
    <section className="pb-success" data-testid="booking-success" aria-live="polite">
      <div className="pb-success-icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="pb-title">Cita confirmada</h2>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--color-text-soft)' }}>
        Tu encuentro está reservado. Guarda esta fecha y hora.
      </p>
      <div className="pb-summary" style={{ textAlign: 'left' }}>
        <div className="pb-summary-row">
          <span className="pb-summary-k">Profesional</span>
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
      </div>
      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
        <button
          type="button"
          className="pb-btn pb-btn-primary"
          data-testid="booking-success-finish"
          onClick={() => {
            if (onFinish) onFinish()
            else if (typeof window !== 'undefined') window.location.assign('/')
          }}
        >
          Finalizar
        </button>
        {presentationHref ? (
          <a
            href={presentationHref}
            className="pb-btn pb-btn-secondary"
            data-testid="booking-success-return"
            style={{ textAlign: 'center' }}
          >
            Volver a la presentación
          </a>
        ) : null}
      </div>
    </section>
  )
}
