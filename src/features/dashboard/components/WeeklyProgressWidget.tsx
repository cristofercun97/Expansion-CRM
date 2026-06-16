type WeeklyProgressWidgetProps = {
  value: number
  goal: number
  message: string
}

export function WeeklyProgressWidget({ value, goal, message }: WeeklyProgressWidgetProps) {
  const radius = 70
  const circumference = Math.PI * radius
  const progress = Math.min(value / 100, 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-6 backdrop-blur-xl">
      <h2 className="text-base font-semibold text-hero-text">Tu avance esta semana</h2>

      <div className="relative mx-auto mt-4 flex h-36 w-full max-w-[220px] items-end justify-center">
        <svg
          viewBox="0 0 180 100"
          className="h-full w-full"
          role="img"
          aria-label={`Avance semanal: ${value}%`}
        >
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-teal-accent"
          />
        </svg>
        <div className="absolute bottom-2 text-center">
          <p className="text-3xl font-bold text-hero-text">{value}%</p>
        </div>
      </div>

      <p className="mt-2 text-center text-sm text-hero-text/65">Meta semanal: {goal}%</p>
      <p className="mt-3 rounded-xl bg-gold/15 px-3 py-2 text-center text-sm font-medium text-gold-light">
        {message}
      </p>
    </section>
  )
}
