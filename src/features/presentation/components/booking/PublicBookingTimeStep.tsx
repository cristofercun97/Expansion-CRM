type Props = {
  selectedDateLabel: string
  times: string[]
  selectedTime: string
  onSelectTime: (time: string) => void
  onBack: () => void
  onContinue: () => void
}

export function PublicBookingTimeStep({
  selectedDateLabel,
  times,
  selectedTime,
  onSelectTime,
  onBack,
  onContinue,
}: Props) {
  return (
    <section data-testid="booking-step-3" aria-labelledby="booking-step3-title">
      <h2 id="booking-step3-title" className="pb-title">
        Elige una hora
      </h2>
      <p className="pb-hint" style={{ textAlign: 'left', marginBottom: '0.85rem' }}>
        {selectedDateLabel}
      </p>

      {times.length === 0 ? (
        <p className="pb-empty">No hay horarios disponibles para este día.</p>
      ) : (
        <div className="pb-slots" role="listbox" aria-label="Horarios disponibles">
          {times.map((time) => {
            const selected = selectedTime === time
            return (
              <button
                key={time}
                type="button"
                className="pb-slot"
                role="option"
                data-selected={selected ? 'true' : 'false'}
                data-testid={`booking-slot-${time}`}
                aria-selected={selected}
                onClick={() => onSelectTime(time)}
              >
                {time}
              </button>
            )
          })}
        </div>
      )}

      <div className="pb-actions">
        <button type="button" className="pb-btn pb-btn-secondary" onClick={onBack}>
          Atrás
        </button>
        <button
          type="button"
          className="pb-btn pb-btn-primary pb-btn-grow pb-btn-block"
          disabled={!selectedTime}
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    </section>
  )
}
