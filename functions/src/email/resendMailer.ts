/**
 * Minimal Resend HTTP mailer. No SDK dependency.
 * Requires Secret Manager: RESEND_API_KEY (+ optional EMAIL_FROM).
 */

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  from: string
  apiKey: string
}

export type SendEmailResult =
  | {ok: true; providerMessageId: string | null}
  | {ok: false; errorCode: string; retryable: boolean}

export async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  if (!input.apiKey.trim()) {
    return {ok: false, errorCode: 'missing_api_key', retryable: false}
  }
  if (!input.from.trim()) {
    return {ok: false, errorCode: 'missing_from', retryable: false}
  }
  if (!input.to.trim() || !input.to.includes('@')) {
    return {ok: false, errorCode: 'invalid_recipient', retryable: false}
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to.trim()],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as {id?: string}
      return {ok: true, providerMessageId: typeof body.id === 'string' ? body.id : null}
    }

    const status = response.status
    const retryable = status === 429 || status >= 500
    return {
      ok: false,
      errorCode: `resend_http_${status}`,
      retryable,
    }
  } catch {
    return {ok: false, errorCode: 'resend_network_error', retryable: true}
  }
}
