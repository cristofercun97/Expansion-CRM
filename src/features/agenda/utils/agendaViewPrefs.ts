const VIEW_KEY = 'expansion.agenda.viewMode'

export type StoredAgendaView = 'day' | 'week' | 'month' | 'list'

export function loadAgendaViewPreference(fallback: StoredAgendaView = 'list'): StoredAgendaView {
  try {
    const value = window.localStorage.getItem(VIEW_KEY)
    if (value === 'day' || value === 'week' || value === 'month' || value === 'list') {
      return value
    }
  } catch {
    // ignore
  }
  return fallback
}

export function saveAgendaViewPreference(view: StoredAgendaView): void {
  try {
    window.localStorage.setItem(VIEW_KEY, view)
  } catch {
    // ignore
  }
}
