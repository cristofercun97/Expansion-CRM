/**
 * Pure booking confirmation email content (testable without provider).
 * Never includes Google Meet URLs in this phase.
 */

export type BookingConfirmationEmailInput = {
  firstName: string
  professionalName: string
  brandName: string | null
  dateLabel: string
  timeLabel: string
  durationMinutes: number
  timezone: string
}

export const BOOKING_CONFIRMATION_SUBJECT = 'Tu encuentro ha sido confirmado'

export function buildBookingConfirmationText(input: BookingConfirmationEmailInput): string {
  const firstName = input.firstName.trim() || 'hola'
  const lines = [
    `Hola ${firstName},`,
    '',
    'Tu encuentro ha sido reservado correctamente.',
    '',
    'CON QUIÉN TE REÚNES',
    input.professionalName.trim() || 'Profesional',
  ]
  if (input.brandName?.trim()) {
    lines.push('', 'MARCA', input.brandName.trim())
  }
  lines.push(
    '',
    'FECHA',
    input.dateLabel,
    '',
    'HORA',
    input.timeLabel,
    '',
    'DURACIÓN',
    `${input.durationMinutes} min`,
    '',
    'ZONA HORARIA',
    input.timezone,
    '',
    'Guarda esta fecha y hora. Te esperamos.',
    '',
    'Esta reserva fue realizada a través de EXPANSIÓN.',
  )
  return lines.join('\n')
}

export function buildBookingConfirmationHtml(input: BookingConfirmationEmailInput): string {
  const firstName = escapeHtml(input.firstName.trim() || 'hola')
  const professional = escapeHtml(input.professionalName.trim() || 'Profesional')
  const brand = input.brandName?.trim() ? escapeHtml(input.brandName.trim()) : ''
  const dateLabel = escapeHtml(input.dateLabel)
  const timeLabel = escapeHtml(input.timeLabel)
  const timezone = escapeHtml(input.timezone)
  const duration = escapeHtml(String(input.durationMinutes))

  const brandRow = brand
    ? `<tr><td style="padding:8px 0;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Marca</td></tr>
       <tr><td style="padding:0 0 14px;font-size:16px;font-weight:600;color:#0f2f2c;">${brand}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d9e3e0;">
        <tr>
          <td style="background:linear-gradient(135deg,#0b3d3a,#145a55);padding:20px 24px;">
            <div style="font-size:18px;font-weight:700;letter-spacing:0.12em;color:#f0d48a;">EXPANSIÓN</div>
            <div style="margin-top:6px;font-size:13px;color:#c9ddd9;">Confirmación de encuentro</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 8px;color:#163532;font-size:16px;line-height:1.5;">
            Hola ${firstName},
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 20px;color:#3c5552;font-size:15px;line-height:1.5;">
            Tu encuentro ha sido reservado correctamente.
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;">
            <table role="presentation" width="100%" style="background:#f7faf9;border-radius:12px;border:1px solid #e2ece9;padding:4px 16px;">
              <tr><td style="padding:14px 0 4px;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Con quién te reúnes</td></tr>
              <tr><td style="padding:0 0 14px;font-size:16px;font-weight:600;color:#0f2f2c;">${professional}</td></tr>
              ${brandRow}
              <tr><td style="padding:8px 0 4px;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Fecha</td></tr>
              <tr><td style="padding:0 0 14px;font-size:16px;font-weight:600;color:#0f2f2c;">${dateLabel}</td></tr>
              <tr><td style="padding:8px 0 4px;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Hora</td></tr>
              <tr><td style="padding:0 0 14px;font-size:16px;font-weight:600;color:#0f2f2c;">${timeLabel}</td></tr>
              <tr><td style="padding:8px 0 4px;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Duración</td></tr>
              <tr><td style="padding:0 0 14px;font-size:16px;font-weight:600;color:#0f2f2c;">${duration} min</td></tr>
              <tr><td style="padding:8px 0 4px;font-size:11px;letter-spacing:0.08em;color:#8a7a55;text-transform:uppercase;">Zona horaria</td></tr>
              <tr><td style="padding:0 0 16px;font-size:16px;font-weight:600;color:#0f2f2c;">${timezone}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;color:#163532;font-size:15px;">
            Guarda esta fecha y hora. Te esperamos.
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #e2ece9;color:#6b7f7c;font-size:12px;">
            Esta reserva fue realizada a través de EXPANSIÓN.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Localized long date for email (es). Falls back to date key. */
export function formatBookingEmailDate(dateKey: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey
  try {
    const [y, m, d] = dateKey.split('-').map(Number)
    const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone || 'UTC',
    }).format(utc)
  } catch {
    return dateKey
  }
}

export function assertConfirmationEmailSafe(html: string, text: string): void {
  const blob = `${html}\n${text}`.toLowerCase()
  if (blob.includes('coach')) {
    throw new Error('Confirmation email must not include Coach')
  }
  if (blob.includes('meet.google.com') || blob.includes('googlemeeturl')) {
    throw new Error('Confirmation email must not include Meet URL')
  }
}
