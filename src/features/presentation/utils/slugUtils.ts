export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateSlug(slug: string): string | null {
  if (!slug) {
    return 'El enlace es obligatorio para publicar.'
  }

  if (slug.length < 3) {
    return 'El enlace debe tener al menos 3 caracteres.'
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'El enlace solo puede contener minúsculas, números y guiones.'
  }

  return null
}

export function getPublicPresentationPath(slug: string): string {
  return `/p/${slug}`
}

export function getPublicPresentationUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return getPublicPresentationPath(slug)
  }

  return `${window.location.origin}${getPublicPresentationPath(slug)}`
}
