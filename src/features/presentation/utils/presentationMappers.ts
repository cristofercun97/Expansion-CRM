import type { DocumentData } from 'firebase/firestore'
import { defaultPresentationFormState } from '@/features/presentation/constants/presentationDefaults'
import type {
  PresentationContentItem,
  PresentationContentType,
  PresentationFirestorePayload,
  PresentationFormState,
  PresentationMethodStep,
  PresentationRecord,
  PresentationService,
  PresentationTextColor,
  PresentationTextSection,
  PresentationUpsertInput,
} from '@/features/presentation/types/presentation.types'

function str(value: unknown, fallback = ''): string {
  return value != null ? String(value) : fallback
}

function mapTextSection(source: DocumentData | undefined, fallback: PresentationTextSection): PresentationTextSection {
  return {
    title: str(source?.title, fallback.title),
    description: str(source?.description, fallback.description),
  }
}

function mapMethodStep(source: DocumentData | undefined): PresentationMethodStep {
  return {
    title: str(source?.title),
    description: str(source?.description),
  }
}

function mapMethod(data: DocumentData): PresentationFormState['method'] {
  const source = data.method ?? {}
  const defaultSteps = defaultPresentationFormState.method.steps
  const stepsSource = Array.isArray(source.steps) ? source.steps : []

  return {
    title: str(source.title),
    steps: [
      mapMethodStep(stepsSource[0] ?? defaultSteps[0]),
      mapMethodStep(stepsSource[1] ?? defaultSteps[1]),
      mapMethodStep(stepsSource[2] ?? defaultSteps[2]),
    ],
  }
}

function mapService(source: DocumentData | undefined, fallback: PresentationService): PresentationService {
  return {
    title: str(source?.title, fallback.title),
    description: str(source?.description, fallback.description),
    ctaText: str(source?.ctaText, fallback.ctaText),
  }
}

function mapServices(data: DocumentData): PresentationFormState['services'] {
  const source = Array.isArray(data.services) ? data.services : []
  const defaults = defaultPresentationFormState.services

  return [
    mapService(source[0], defaults[0]),
    mapService(source[1], defaults[1]),
    mapService(source[2], defaults[2]),
  ]
}

function mapContentType(value: unknown): PresentationContentType {
  const normalized = str(value, 'video')
  const allowed: PresentationContentType[] = ['video', 'artículo', 'entrevista', 'post']
  return allowed.includes(normalized as PresentationContentType)
    ? (normalized as PresentationContentType)
    : 'video'
}

function mapContentItem(
  source: DocumentData | undefined,
  fallback: PresentationContentItem,
): PresentationContentItem {
  return {
    title: str(source?.title, fallback.title),
    type: mapContentType(source?.type ?? fallback.type),
    url: str(source?.url, fallback.url),
  }
}

function mapContents(data: DocumentData): PresentationFormState['contents'] {
  const source = Array.isArray(data.contents) ? data.contents : []
  const defaults = defaultPresentationFormState.contents

  return [
    mapContentItem(source[0], defaults[0]),
    mapContentItem(source[1], defaults[1]),
    mapContentItem(source[2], defaults[2]),
  ]
}

function mapTextColor(value: unknown, fallback: PresentationTextColor): PresentationTextColor {
  const normalized = str(value)
  if (normalized === 'white' || normalized === 'black' || normalized === 'gray') {
    return normalized
  }
  return fallback
}

function mapVisualIdentity(data: DocumentData): PresentationFormState['visualIdentity'] {
  const source = data.visualIdentity ?? {}
  const defaults = defaultPresentationFormState.visualIdentity

  return {
    logoUrl: str(source.logoUrl),
    photoUrl: str(source.photoUrl),
    brandName: str(source.brandName),
    backgroundColor: str(source.backgroundColor ?? source.primaryColor, defaults.backgroundColor),
    backgroundMode: source.backgroundMode === 'gradient' ? 'gradient' : 'solid',
    gradientEndColor: str(source.gradientEndColor ?? source.secondaryColor, defaults.gradientEndColor),
    headerBackgroundColor: str(source.headerBackgroundColor, defaults.headerBackgroundColor),
    headerButtonColor: str(source.headerButtonColor ?? source.accentColor, defaults.headerButtonColor),
    headerButtonTextColor: mapTextColor(source.headerButtonTextColor, defaults.headerButtonTextColor),
    headingTextColor: mapTextColor(source.headingTextColor, defaults.headingTextColor),
    bodyTextColor: mapTextColor(source.bodyTextColor, defaults.bodyTextColor),
  }
}

function mapMainMessage(data: DocumentData): PresentationFormState['mainMessage'] {
  const source = data.mainMessage ?? {}
  const defaults = defaultPresentationFormState.mainMessage

  return {
    valuePhrase: str(source.valueTitle ?? data.heroTitle, defaults.valuePhrase),
    subtitle: str(source.subtitle ?? data.heroSubtitle, defaults.subtitle),
    ctaText: str(source.ctaText ?? data.ctaText, defaults.ctaText),
  }
}

function mapSocialLinks(data: DocumentData): PresentationFormState['socialLinks'] {
  const source = data.socialLinks ?? {}
  const defaults = defaultPresentationFormState.socialLinks

  return {
    instagram: str(source.instagram, defaults.instagram),
    facebook: str(source.facebook, defaults.facebook),
    tiktok: str(source.tiktok, defaults.tiktok),
    youtube: str(source.youtube, defaults.youtube),
    website: str(source.website, defaults.website),
    whatsapp: str(source.whatsapp, defaults.whatsapp),
  }
}

function mapFormConfig(data: DocumentData): PresentationFormState['formConfig'] {
  const legacyPreview = data.formPreview ?? {}
  const source = data.formConfig ?? legacyPreview
  const defaults = defaultPresentationFormState.formConfig
  const interestOptions = Array.isArray(source.interestOptions)
    ? source.interestOptions.map((option: unknown) => str(option)).filter(Boolean)
    : defaults.interestOptionsText.split('\n')

  return {
    nameEnabled: source.nameEnabled ?? legacyPreview.nameEnabled ?? defaults.nameEnabled,
    whatsappEnabled: source.whatsappEnabled ?? legacyPreview.whatsappEnabled ?? defaults.whatsappEnabled,
    interestEnabled: source.interestEnabled ?? legacyPreview.interestEnabled ?? defaults.interestEnabled,
    messageEnabled: source.messageEnabled ?? legacyPreview.messageEnabled ?? defaults.messageEnabled,
    formTitle: str(source.formTitle, defaults.formTitle),
    formDescription: str(source.formDescription, defaults.formDescription),
    whatsappGroupUrl: str(source.whatsappGroupUrl, defaults.whatsappGroupUrl),
    floatingWhatsAppUrl: str(source.floatingWhatsAppUrl, defaults.floatingWhatsAppUrl),
    interestOptionsText: interestOptions.length > 0 ? interestOptions.join('\n') : defaults.interestOptionsText,
  }
}

function parseInterestOptions(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function mapDocumentToPresentationRecord(
  ownerUid: string,
  data: DocumentData,
): PresentationRecord {
  const defaults = defaultPresentationFormState

  return {
    ownerUid: str(data.ownerUid ?? data.leaderId, ownerUid),
    slug: str(data.slug),
    isPublished: Boolean(data.isPublished),
    form: {
      visualIdentity: mapVisualIdentity(data),
      mainMessage: mapMainMessage(data),
      problem: mapTextSection(data.problem, defaults.problem),
      promise: mapTextSection(data.promise, defaults.promise),
      leadMagnet: {
        title: str(data.leadMagnet?.title),
        description: str(data.leadMagnet?.description),
        ctaText: str(data.leadMagnet?.ctaText, defaults.leadMagnet.ctaText),
        resourceUrl: str(data.leadMagnet?.resourceUrl),
      },
      story: mapTextSection(data.story, defaults.story),
      method: mapMethod(data),
      socialProof: {
        testimonialName: str(data.socialProof?.testimonialName),
        testimonialText: str(data.socialProof?.testimonialText),
        proofUrl: str(data.socialProof?.proofUrl),
      },
      videos: {
        youtubeShortUrl: str(data.videos?.youtubeShortUrl),
        tiktokUrl: str(data.videos?.tiktokUrl),
      },
      services: mapServices(data),
      contents: mapContents(data),
      finalCta: {
        title: str(data.finalCta?.title),
        description: str(data.finalCta?.description),
        ctaText: str(data.finalCta?.ctaText, defaults.finalCta.ctaText),
      },
      formConfig: mapFormConfig(data),
      socialLinks: mapSocialLinks(data),
    },
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export function mapFormToFirestorePayload(
  uid: string,
  input: PresentationUpsertInput,
): PresentationFirestorePayload {
  const { form } = input
  const formPreview = {
    nameEnabled: form.formConfig.nameEnabled,
    whatsappEnabled: form.formConfig.whatsappEnabled,
    interestEnabled: form.formConfig.interestEnabled,
    messageEnabled: form.formConfig.messageEnabled,
  }

  return {
    ownerUid: uid,
    leaderId: uid,
    slug: input.slug,
    isPublished: input.isPublished,
    visualIdentity: form.visualIdentity,
    mainMessage: {
      valueTitle: form.mainMessage.valuePhrase,
      subtitle: form.mainMessage.subtitle,
      ctaText: form.mainMessage.ctaText,
    },
    problem: form.problem,
    promise: form.promise,
    leadMagnet: form.leadMagnet,
    story: form.story,
    method: form.method,
    socialProof: form.socialProof,
    videos: form.videos,
    services: [...form.services],
    contents: [...form.contents],
    finalCta: form.finalCta,
    formConfig: {
      formTitle: form.formConfig.formTitle,
      formDescription: form.formConfig.formDescription,
      whatsappGroupUrl: form.formConfig.whatsappGroupUrl,
      floatingWhatsAppUrl: form.formConfig.floatingWhatsAppUrl,
      interestOptions: parseInterestOptions(form.formConfig.interestOptionsText),
      ...formPreview,
    },
    formPreview,
    socialLinks: form.socialLinks,
  }
}

export function mapRecordToForm(record: PresentationRecord): PresentationFormState {
  return record.form
}
