export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('/')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v')
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }

      if (parsed.pathname.startsWith('/embed/')) {
        const videoId = parsed.pathname.split('/')[2]
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/')[2]
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
    }

    return null
  } catch {
    return null
  }
}

export function isYouTubeUrl(url: string): boolean {
  return getYouTubeEmbedUrl(url) !== null
}
