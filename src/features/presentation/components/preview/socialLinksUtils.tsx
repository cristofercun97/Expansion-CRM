import {
  Camera,
  Globe,
  MessageCircle,
  Music2,
  Play,
  Share2,
  type LucideIcon,
} from 'lucide-react'
import type {
  PresentationSocialLinks,
} from '@/features/presentation/types/presentation.types'
import { hasText } from '@/features/presentation/components/preview/previewUtils'

export type SocialLinkKey = keyof PresentationSocialLinks

type SocialLinkConfig = {
  key: SocialLinkKey
  label: string
  Icon: LucideIcon
}

export const SOCIAL_LINK_CONFIG: SocialLinkConfig[] = [
  { key: 'instagram', label: 'Instagram', Icon: Camera },
  { key: 'facebook', label: 'Facebook', Icon: Share2 },
  { key: 'tiktok', label: 'TikTok', Icon: Music2 },
  { key: 'youtube', label: 'YouTube', Icon: Play },
  { key: 'website', label: 'Sitio web', Icon: Globe },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
]

export function getActiveSocialLinks(links: PresentationSocialLinks | undefined) {
  if (!links) {
    return []
  }

  return SOCIAL_LINK_CONFIG.filter(({ key }) => hasText(links[key])).map((config) => ({
    ...config,
    url: links[config.key].trim(),
  }))
}

export const PRESENTATION_SOCIAL_EDITOR_FIELDS: { key: SocialLinkKey; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' },
  { key: 'website', label: 'Sitio web URL', placeholder: 'https://...' },
  { key: 'whatsapp', label: 'WhatsApp URL', placeholder: 'https://wa.me/...' },
]
