export type PresentationProspectStatus = 'new'

export type CreatePresentationProspectInput = {
  ownerUid: string
  leaderId: string
  landingSlug: string
  name?: string
  whatsapp?: string
  interest?: string
  message?: string
  whatsappGroupUrl?: string
}

export type PresentationProspectFormValues = {
  name: string
  whatsapp: string
  interest: string
  message: string
}

export type PresentationProspectFormErrors = Partial<
  Record<keyof PresentationProspectFormValues | 'form', string>
>
