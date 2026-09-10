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

export function PublicBookingProfessionalCard({
  name,
  brandName,
  claim,
  photoUrl,
  durationMinutes,
  timezone,
}: Props) {
  const photo = photoUrl?.trim() || ''
  return (
    <aside className="pb-pro" data-testid="booking-professional-card" aria-label="Profesional">
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
      {claim?.trim() ? <p className="pb-pro-claim">{claim.trim()}</p> : null}
      <div className="pb-pro-meta">
        <span className="pb-chip">{durationMinutes} min</span>
        <span className="pb-chip">{timezone}</span>
      </div>
    </aside>
  )
}
