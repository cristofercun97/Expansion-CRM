import { APP_NAME, APP_TAGLINE } from '@/config/app'

/** Canonical production host (Firebase Hosting). */
export const SITE_URL = 'https://expansion-proyect.web.app'

export const SITE_NAME = APP_NAME

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export const LANDING_SEO = {
  title: `${APP_NAME} — ${APP_TAGLINE} para líderes y equipos`,
  description:
    'Expansión es el sistema de crecimiento para líderes: capta prospectos, organiza leads, forma tu equipo y duplica tu red sin el caos de WhatsApp.',
  keywords: [
    'Expansión',
    'sistema de crecimiento',
    'CRM para líderes',
    'captación de prospectos',
    'seguimiento de leads',
    'formación de equipos',
    'red de referidos',
    'landing personalizada',
  ].join(', '),
  canonicalPath: '/',
  ogType: 'website' as const,
}

export function absoluteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized === '/' ? '/' : normalized}`
}
