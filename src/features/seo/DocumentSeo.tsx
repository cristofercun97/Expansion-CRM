import { useEffect, useMemo } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/config/seo'

type DocumentSeoProps = {
  title: string
  description: string
  path?: string
  keywords?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  jsonLd?: object
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(id: string, data: string) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = data
}

export function DocumentSeo({
  title,
  description,
  path = '/',
  keywords,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noIndex = false,
  jsonLd,
}: DocumentSeoProps) {
  const jsonLdSerialized = useMemo(
    () => (jsonLd ? JSON.stringify(jsonLd) : null),
    [jsonLd],
  )

  useEffect(() => {
    const url = absoluteUrl(path)
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow'

    document.title = title
    upsertMeta('name', 'description', description)
    if (keywords) upsertMeta('name', 'keywords', keywords)
    upsertMeta('name', 'robots', robots)
    upsertMeta('name', 'author', SITE_NAME)
    upsertMeta('name', 'theme-color', '#0B1C2C')

    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:locale', 'es_ES')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    upsertLink('canonical', url)

    if (jsonLdSerialized) {
      upsertJsonLd('expansion-seo-jsonld', jsonLdSerialized)
    }

    return () => {
      document.getElementById('expansion-seo-jsonld')?.remove()
    }
  }, [
    title,
    description,
    path,
    keywords,
    image,
    type,
    noIndex,
    jsonLdSerialized,
  ])

  return null
}
