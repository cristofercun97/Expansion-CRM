import { PublicBookingSelect } from '@/features/presentation/components/booking/PublicBookingSelect'
import type { PublicBookingLeadInput } from '@/features/presentation/services/publicBooking.service'
import {
  WHATSAPP_DIAL_CODES,
  type FieldErrors,
} from '@/features/presentation/utils/publicBookingUiUtils'

type Props = {
  lead: PublicBookingLeadInput
  dialCode: string
  localWhatsApp: string
  fieldErrors: FieldErrors
  onLeadChange: (patch: Partial<PublicBookingLeadInput>) => void
  onDialCodeChange: (code: string) => void
  onLocalWhatsAppChange: (value: string) => void
  onContinue: () => void
}

export function PublicBookingDetailsStep({
  lead,
  dialCode,
  localWhatsApp,
  fieldErrors,
  onLeadChange,
  onDialCodeChange,
  onLocalWhatsAppChange,
  onContinue,
}: Props) {
  const messageLen = lead.message.length
  const dialOptions = WHATSAPP_DIAL_CODES.map((item) => ({
    value: item.code,
    label: item.label,
  }))

  return (
    <section data-testid="booking-step-1" aria-labelledby="booking-step1-title">
      <h2 id="booking-step1-title" className="pb-title">
        Cuéntanos sobre ti
      </h2>

      <div className="pb-grid-2">
        <div className="pb-field">
          <label className="pb-label" htmlFor="pb-firstName">
            Nombre *
          </label>
          <input
            id="pb-firstName"
            className="pb-input"
            autoComplete="given-name"
            value={lead.firstName}
            aria-invalid={Boolean(fieldErrors.firstName)}
            onChange={(e) => onLeadChange({ firstName: e.target.value })}
          />
          {fieldErrors.firstName ? <p className="pb-error">{fieldErrors.firstName}</p> : null}
        </div>

        <div className="pb-field">
          <label className="pb-label" htmlFor="pb-lastName">
            Apellido
          </label>
          <input
            id="pb-lastName"
            className="pb-input"
            autoComplete="family-name"
            value={lead.lastName}
            onChange={(e) => onLeadChange({ lastName: e.target.value })}
          />
        </div>

        <div className="pb-field pb-span-2">
          <label className="pb-label" htmlFor="pb-email">
            Email *
          </label>
          <input
            id="pb-email"
            className="pb-input"
            type="email"
            autoComplete="email"
            value={lead.email}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(e) => onLeadChange({ email: e.target.value })}
          />
          {fieldErrors.email ? <p className="pb-error">{fieldErrors.email}</p> : null}
        </div>

        <div className="pb-field">
          <label className="pb-label" htmlFor="pb-country">
            País *
          </label>
          <input
            id="pb-country"
            className="pb-input"
            autoComplete="country-name"
            value={lead.country}
            aria-invalid={Boolean(fieldErrors.country)}
            onChange={(e) => onLeadChange({ country: e.target.value })}
          />
          {fieldErrors.country ? <p className="pb-error">{fieldErrors.country}</p> : null}
        </div>

        <div className="pb-field">
          <label className="pb-label" htmlFor="pb-city">
            Ciudad *
          </label>
          <input
            id="pb-city"
            className="pb-input"
            autoComplete="address-level2"
            value={lead.city}
            aria-invalid={Boolean(fieldErrors.city)}
            onChange={(e) => onLeadChange({ city: e.target.value })}
          />
          {fieldErrors.city ? <p className="pb-error">{fieldErrors.city}</p> : null}
        </div>

        <div className="pb-field pb-span-2">
          <label className="pb-label" htmlFor="pb-whatsapp">
            WhatsApp
          </label>
          <div className="pb-wa">
            <PublicBookingSelect
              aria-label="Prefijo telefónico"
              value={dialCode}
              options={dialOptions}
              onChange={onDialCodeChange}
            />
            <input
              id="pb-whatsapp"
              className="pb-input"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Número"
              value={localWhatsApp}
              onChange={(e) => onLocalWhatsAppChange(e.target.value)}
            />
          </div>
        </div>

        <div className="pb-field pb-span-2">
          <label className="pb-label" htmlFor="pb-message">
            Mensaje *
          </label>
          <textarea
            id="pb-message"
            className="pb-textarea"
            maxLength={500}
            value={lead.message}
            aria-invalid={Boolean(fieldErrors.message)}
            onChange={(e) => onLeadChange({ message: e.target.value })}
          />
          <p className="pb-hint" aria-live="polite">
            {messageLen} / 500 caracteres
          </p>
          {fieldErrors.message ? <p className="pb-error">{fieldErrors.message}</p> : null}
        </div>

        <div className="pb-field pb-span-2">
          <label className="pb-check">
            <input
              type="checkbox"
              checked={lead.privacyAccepted}
              aria-invalid={Boolean(fieldErrors.privacyAccepted)}
              onChange={(e) => onLeadChange({ privacyAccepted: e.target.checked })}
            />
            <span>Acepto el tratamiento de mis datos para gestionar esta reserva. *</span>
          </label>
          {fieldErrors.privacyAccepted ? (
            <p className="pb-error">{fieldErrors.privacyAccepted}</p>
          ) : null}
        </div>
      </div>

      <div className="pb-actions">
        <button type="button" className="pb-btn pb-btn-primary pb-btn-block" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </section>
  )
}
