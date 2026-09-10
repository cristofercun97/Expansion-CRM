type Props = {
  name: string
  brandName?: string
  claim?: string
  photoUrl?: string
  durationMinutes: number
  timezone: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

const DEFAULT_CLAIM =
  'Un espacio para aclarar tus dudas y definir tu próximo paso.'

export function PublicBookingProfessionalCard({
  name,
  brandName,
  claim,
  photoUrl,
  durationMinutes,
  timezone,
}: Props) {
  const photo = photoUrl?.trim() || ''
  const claimText = claim?.trim() || DEFAULT_CLAIM

  return (
    <aside className="pb-pro" data-testid="booking-professional-card" aria-label="Profesional">
      <p className="pb-pro-kicker">Encuentro gratuito</p>
      <div className="pb-pro-compact">
        {photo ? (
          <img className="pb-avatar" src={photo} alt="" />
        ) : (
          <div className="pb-avatar pb-avatar-fallback" aria-hidden="true">
            {initials(name || 'P')}
          </div>
        )}
        <div>
          <h1 className="pb-pro-name">{name || 'Profesional'}</h1>
          {brandName?.trim() ? <p className="pb-pro-brand">{brandName.trim()}</p> : null}
        </div>
      </div>
      <p className="pb-pro-claim">{claimText}</p>
      <div className="pb-pro-meta">
        <span className="pb-chip">{durationMinutes} min</span>
        <span className="pb-chip">{timezone}</span>
      </div>
      <p className="pb-pro-note">Los encuentros dependen de la disponibilidad real de agenda.</p>
    </aside>
  )
}
