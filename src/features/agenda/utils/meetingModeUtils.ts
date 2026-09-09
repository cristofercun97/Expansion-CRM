import type {
  Meeting,
  MeetingMode,
  MeetingProvider,
  VideoProvider,
} from '@/features/agenda/types/meeting.types'

export function isValidHttpsMeetingUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function toLegacyMeetingProvider(videoProvider: VideoProvider): MeetingProvider {
  return videoProvider === 'google_meet' ? 'google_meet' : 'none'
}

export function resolveMeetingModeFields(data: {
  meetingMode?: unknown
  videoProvider?: unknown
  meetingUrl?: unknown
  location?: unknown
  meetingProvider?: unknown
  googleMeetUrl?: unknown
}): {
  meetingMode: MeetingMode
  videoProvider: VideoProvider
  meetingUrl: string | null
  location: string | null
  meetingProvider: MeetingProvider
} {
  const googleMeetUrl =
    typeof data.googleMeetUrl === 'string' && data.googleMeetUrl.trim()
      ? data.googleMeetUrl.trim()
      : null
  const storedMeetingUrl =
    typeof data.meetingUrl === 'string' && data.meetingUrl.trim()
      ? data.meetingUrl.trim()
      : null
  const location =
    typeof data.location === 'string' && data.location.trim() ? data.location.trim() : null

  const hasExplicitMode =
    data.meetingMode === 'video' ||
    data.meetingMode === 'in_person' ||
    data.meetingMode === 'other'

  if (hasExplicitMode) {
    const meetingMode = data.meetingMode as MeetingMode
    let videoProvider: VideoProvider = 'none'
    if (data.videoProvider === 'manual' || data.videoProvider === 'google_meet' || data.videoProvider === 'none') {
      videoProvider = data.videoProvider
    } else if (meetingMode === 'video') {
      videoProvider = googleMeetUrl ? 'google_meet' : storedMeetingUrl ? 'manual' : 'none'
    }

    const meetingUrl =
      videoProvider === 'google_meet'
        ? storedMeetingUrl || googleMeetUrl
        : videoProvider === 'manual'
          ? storedMeetingUrl
          : null

    return {
      meetingMode,
      videoProvider,
      meetingUrl,
      location: meetingMode === 'in_person' ? location : location,
      meetingProvider: toLegacyMeetingProvider(videoProvider),
    }
  }

  // Legacy fallback: googleMeetUrl / meetingProvider without meetingMode
  if (googleMeetUrl || data.meetingProvider === 'google_meet') {
    return {
      meetingMode: 'video',
      videoProvider: 'google_meet',
      meetingUrl: storedMeetingUrl || googleMeetUrl,
      location,
      meetingProvider: 'google_meet',
    }
  }

  if (storedMeetingUrl) {
    return {
      meetingMode: 'video',
      videoProvider: 'manual',
      meetingUrl: storedMeetingUrl,
      location,
      meetingProvider: 'none',
    }
  }

  return {
    meetingMode: 'other',
    videoProvider: 'none',
    meetingUrl: null,
    location,
    meetingProvider: 'none',
  }
}

export function getMeetingJoinInfo(meeting: Meeting): {
  url: string
  label: string
  cta: string
} | null {
  if (meeting.meetingMode !== 'video' || meeting.status === 'cancelled') {
    return null
  }

  if (meeting.videoProvider === 'google_meet') {
    const url = meeting.meetingUrl || meeting.googleMeetUrl
    if (!url) {
      return null
    }
    return {
      url,
      label: 'Google Meet',
      cta: 'Entrar a Meet',
    }
  }

  if (meeting.videoProvider === 'manual' && meeting.meetingUrl) {
    return {
      url: meeting.meetingUrl,
      label: 'Videollamada',
      cta: 'Entrar a la reunión',
    }
  }

  return null
}

export function getMeetingModeLabel(meeting: Meeting): string {
  if (meeting.meetingMode === 'video') {
    if (meeting.videoProvider === 'google_meet') {
      return 'Google Meet'
    }
    if (meeting.videoProvider === 'manual') {
      return 'Videollamada'
    }
    return 'Videollamada'
  }
  if (meeting.meetingMode === 'in_person') {
    return 'Presencial'
  }
  return 'Otro'
}
