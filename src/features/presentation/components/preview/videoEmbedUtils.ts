export function getYoutubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }

      const watchId = parsed.searchParams.get('v')
      if (watchId) {
        return `https://www.youtube.com/embed/${watchId}`
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`
      }
    }
  } catch {
    return null
  }

  return null
}

export function getTiktokEmbedUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const videoMatch = trimmed.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (videoMatch?.[1]) {
    return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`
  }

  const shortMatch = trimmed.match(/tiktok\.com\/t\/([A-Za-z0-9]+)/)
  if (shortMatch?.[1]) {
    return `https://www.tiktok.com/embed/v2/${shortMatch[1]}`
  }

  const vmMatch = trimmed.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/)
  if (vmMatch?.[1]) {
    return null
  }

  return null
}
