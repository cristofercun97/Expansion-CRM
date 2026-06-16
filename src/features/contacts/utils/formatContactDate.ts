import type { Timestamp } from 'firebase/firestore'

export function formatContactDate(timestamp: Timestamp | null): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatContactDateTime(timestamp: Timestamp | null): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  return timestamp.toDate().toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
