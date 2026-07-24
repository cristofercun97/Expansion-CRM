import { APP_NAME, APP_TAGLINE } from '@/config/app'
import { LANDING_SEO, SITE_URL, absoluteUrl } from '@/config/seo'
import { LANDING_FAQS } from '@/features/landing/data/landingFaqs'

export const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: APP_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      description: LANDING_SEO.description,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: APP_NAME,
      url: SITE_URL,
      description: LANDING_SEO.description,
      inLanguage: 'es-ES',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: LANDING_SEO.title,
      description: LANDING_SEO.description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'es-ES',
    },
    {
      '@type': 'SoftwareApplication',
      name: APP_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: LANDING_SEO.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Registro y acceso al flujo base',
      },
      url: absoluteUrl('/registro'),
    },
    {
      '@type': 'FAQPage',
      mainEntity: LANDING_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ],
  name: `${APP_NAME} — ${APP_TAGLINE}`,
} as const
