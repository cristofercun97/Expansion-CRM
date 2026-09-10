const SOURCE_LABELS: Record<string, string> = {
  presentation_landing: 'Landing de presentación',
  presentation_booking: 'Reserva desde presentación',
  manual_contact: 'Contacto manual',
}

export function getContactSourceLabel(source: string): string {
  const trimmed = source.trim()

  if (!trimmed) {
    return '—'
  }

  return SOURCE_LABELS[trimmed] ?? trimmed
}
