import { Check, Copy, Loader2, Wallet } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import usdtTrc20Qr from '@/assets/usdt-trc20-qr.png'
import { Button, Input } from '@/components/ui'
import {
  GROUP_ACTIVATION_CRYPTO_CURRENCY,
  GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL,
  GROUP_ACTIVATION_PAYPAL_URL,
  GROUP_ACTIVATION_PROOF_ACCEPT,
  GROUP_ACTIVATION_USDT_ADDRESS,
} from '@/features/group-activation/constants/groupActivation.constants'
import { validateActivationProofFile } from '@/features/group-activation/services/activation-proof.service'
import type {
  GroupActivationPaymentMethod,
  RequestGroupActivationInput,
} from '@/features/group-activation/types/group-activation.types'
import { formatExpansionAnnualPriceLabel } from '@/features/referrals/constants/referralProgram.constants'
import { cn } from '@/lib/utils'

type ActivationRequestFormProps = {
  submitting: boolean
  submitLabel: string
  onSubmit: (input: RequestGroupActivationInput) => Promise<void>
  className?: string
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function PayPalGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72A.77.77 0 0 1 5.704 3h7.338c2.34 0 4.056.58 5.1 1.724 1.01 1.106 1.36 2.62 1.04 4.5-.04.23-.09.45-.14.66-.7 2.79-2.5 4.3-5.35 4.5h-2.4c-.42 0-.78.3-.86.71l-.9 5.74a.64.64 0 0 1-.63.54H7.076z" />
      <path
        d="M19.55 7.72c-.06.36-.14.74-.24 1.14-.87 3.48-3.14 5.26-6.62 5.26h-1.68c-.53 0-.98.38-1.07.9l-1.15 7.27a.5.5 0 0 0 .49.58h3.4c.42 0 .78-.3.86-.71l.35-2.22.02-.1a.87.87 0 0 1 .86-.71h.54c3.52 0 6.27-1.43 7.08-5.56.34-1.73.16-3.17-.84-4.2-.28-.28-.62-.51-1-.65z"
        opacity="0.7"
      />
    </svg>
  )
}

export function ActivationRequestForm({
  submitting,
  submitLabel,
  onSubmit,
  className,
}: ActivationRequestFormProps) {
  const formId = useId()
  const [paymentMethod, setPaymentMethod] = useState<GroupActivationPaymentMethod | null>(null)
  const [paypalReference, setPaypalReference] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofError, setProofError] = useState('')
  const [formError, setFormError] = useState('')
  const [addressCopied, setAddressCopied] = useState(false)

  function handleSelectMethod(method: GroupActivationPaymentMethod) {
    setPaymentMethod(method)
    setFormError('')
    setPaypalReference('')
    setTransactionHash('')
  }

  function handleProofChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null
    setProofFile(file)
    setProofError(file ? validateActivationProofFile(file) ?? '' : '')
    setFormError('')
  }

  async function handleCopyAddress() {
    try {
      await copyText(GROUP_ACTIVATION_USDT_ADDRESS)
      setAddressCopied(true)
      window.setTimeout(() => setAddressCopied(false), 2000)
    } catch {
      setFormError('No se pudo copiar la dirección. Cópiala manualmente.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!paymentMethod) {
      setFormError('Selecciona un método de pago.')
      return
    }

    if (!proofFile) {
      setProofError('Adjunta el comprobante de pago.')
      return
    }

    const validationError = validateActivationProofFile(proofFile)
    if (validationError) {
      setProofError(validationError)
      return
    }

    const paymentReference =
      paymentMethod === 'usdt_trc20' ? transactionHash.trim() : paypalReference.trim()

    if (paymentMethod === 'usdt_trc20' && paymentReference.length === 0) {
      setFormError('Introduce el hash (TXID) de la transferencia.')
      return
    }

    try {
      await onSubmit({
        paymentMethod,
        paymentReference,
        proofFile,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'
      setFormError(message)
      throw error
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event).catch(() => undefined)
      }}
      className={cn('space-y-5', className)}
      noValidate
    >
      <div>
        <p className="text-sm font-semibold text-hero-text">Selecciona tu método de pago</p>
        <p className="mt-1 text-sm text-hero-text/70">
          Importe: <span className="font-semibold text-gold-light">{formatExpansionAnnualPriceLabel()}</span>
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pago">
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === 'paypal'}
            disabled={submitting}
            onClick={() => handleSelectMethod('paypal')}
            className={cn(
              'flex min-h-[72px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
              paymentMethod === 'paypal'
                ? 'border-gold bg-gold/15 text-hero-text shadow-[0_0_0_1px_rgba(217,164,65,0.35)]'
                : 'border-white/15 bg-petrol-deep/60 text-hero-text/85 hover:border-white/25',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                paymentMethod === 'paypal'
                  ? 'border-gold/40 bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/80',
              )}
            >
              <PayPalGlyph className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">PayPal</span>
              <span className="mt-0.5 block text-xs text-hero-text/65">Pago seguro online</span>
            </span>
            {paymentMethod === 'paypal' ? (
              <Check className="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
            ) : null}
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === 'usdt_trc20'}
            disabled={submitting}
            onClick={() => handleSelectMethod('usdt_trc20')}
            className={cn(
              'flex min-h-[72px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
              paymentMethod === 'usdt_trc20'
                ? 'border-gold bg-gold/15 text-hero-text shadow-[0_0_0_1px_rgba(217,164,65,0.35)]'
                : 'border-white/15 bg-petrol-deep/60 text-hero-text/85 hover:border-white/25',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                paymentMethod === 'usdt_trc20'
                  ? 'border-gold/40 bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/80',
              )}
            >
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">USDT — TRC20</span>
              <span className="mt-0.5 block text-xs text-hero-text/65">Red TRON</span>
            </span>
            {paymentMethod === 'usdt_trc20' ? (
              <Check className="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
            ) : null}
          </button>
        </div>
      </div>

      {paymentMethod === 'paypal' ? (
        <div className="space-y-4 rounded-xl border border-white/12 bg-white/5 p-4">
          <div>
            <h4 className="text-sm font-semibold text-hero-text">Paga de forma segura con PayPal</h4>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/75">
              Completa el pago mediante PayPal y regresa a esta pantalla para enviar tu comprobante.
            </p>
            <p className="mt-2 text-sm font-medium text-gold-light">{formatExpansionAnnualPriceLabel()}</p>
          </div>

          <a
            href={GROUP_ACTIVATION_PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0070ba] px-4 text-sm font-semibold text-white',
              'transition-colors hover:bg-[#005ea6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
            )}
          >
            <PayPalGlyph className="h-4 w-4" />
            Pagar con PayPal
          </a>

          <p className="text-xs leading-relaxed text-hero-text/65">
            Después de realizar el pago, regresa a Expansión y adjunta el comprobante para solicitar
            la activación.
          </p>

          <Input
            id={`${formId}-paypal-ref`}
            label="Referencia de pago (opcional)"
            labelClassName="text-hero-text"
            value={paypalReference}
            onChange={(event) => setPaypalReference(event.target.value)}
            disabled={submitting}
            maxLength={200}
            placeholder="Número de transacción de PayPal"
            className="border-white/15 bg-white/10 text-hero-text placeholder:text-hero-text/45 focus:border-gold/50 focus:ring-gold/20"
          />
        </div>
      ) : null}

      {paymentMethod === 'usdt_trc20' ? (
        <div className="space-y-4 rounded-xl border border-gold/25 bg-gradient-to-br from-gold/10 via-white/5 to-teal-accent/5 p-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-petrol-deep/50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-hero-text/55">Moneda</p>
              <p className="mt-1 font-semibold text-hero-text">{GROUP_ACTIVATION_CRYPTO_CURRENCY}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-petrol-deep/50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-hero-text/55">Red</p>
              <p className="mt-1 font-semibold text-hero-text">{GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL}</p>
            </div>
          </div>

          <p className="text-sm font-medium text-gold-light">{formatExpansionAnnualPriceLabel()}</p>

          <div className="space-y-2">
            <label htmlFor={`${formId}-usdt-address`} className="text-sm font-medium text-hero-text">
              Dirección
            </label>
            <div className="overflow-x-auto rounded-lg border border-white/15 bg-petrol-deep/70 px-3 py-2.5">
              <input
                id={`${formId}-usdt-address`}
                type="text"
                readOnly
                value={GROUP_ACTIVATION_USDT_ADDRESS}
                className="w-full min-w-[280px] bg-transparent font-mono text-xs text-hero-text outline-none sm:text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => void handleCopyAddress()}
              className="min-h-11 w-full border-white/20 bg-white/5 text-hero-text hover:bg-white/10 sm:w-auto"
            >
              {addressCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-teal-accent" aria-hidden="true" />
                  Dirección copiada
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Copiar dirección
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[220px] rounded-xl border border-white/15 bg-white p-3">
              <img
                src={usdtTrc20Qr}
                alt={`Código QR de la dirección USDT ${GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL}`}
                className="h-auto w-full"
                width={220}
                height={220}
                decoding="async"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <p className="max-w-md text-center text-xs leading-relaxed text-hero-text/70">
              Escanea este código desde tu billetera y verifica que la red seleccionada sea{' '}
              {GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL}.
            </p>
          </div>

          <div
            role="alert"
            className="rounded-xl border border-gold/35 bg-gold/12 px-4 py-3 text-sm leading-relaxed text-hero-text"
          >
            <span className="font-semibold text-gold-light">IMPORTANTE:</span> Envía únicamente USDT
            mediante la red {GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL}. Los fondos enviados mediante otra
            moneda o red pueden perderse y no podrán recuperarse.
          </div>
        </div>
      ) : null}

      {paymentMethod ? (
        <div className="space-y-4">
          <div>
            <label htmlFor={`${formId}-proof`} className="text-sm font-medium text-hero-text">
              Comprobante de pago
            </label>
            <p className="mt-1 text-xs text-hero-text/60">JPG, JPEG, PNG o PDF · máximo 5 MB</p>
            <input
              id={`${formId}-proof`}
              type="file"
              accept={GROUP_ACTIVATION_PROOF_ACCEPT}
              disabled={submitting}
              onChange={(event) => handleProofChange(event.target.files)}
              className={cn(
                'mt-2 block w-full text-sm text-hero-text/80',
                'file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0',
                'file:bg-gold/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-light',
                'hover:file:bg-gold/30',
              )}
            />
            {proofFile ? (
              <p className="mt-2 text-xs text-hero-text/70">Archivo: {proofFile.name}</p>
            ) : null}
            {proofError ? <p className="mt-1 text-xs text-red-300">{proofError}</p> : null}
          </div>

          {paymentMethod === 'usdt_trc20' ? (
            <Input
              id={`${formId}-txid`}
              label="Hash de la transacción"
              labelClassName="text-hero-text"
              value={transactionHash}
              onChange={(event) => setTransactionHash(event.target.value)}
              disabled={submitting}
              required
              maxLength={200}
              placeholder="Introduce el TXID de la transferencia"
              className="border-white/15 bg-white/10 text-hero-text placeholder:text-hero-text/45 focus:border-gold/50 focus:ring-gold/20"
            />
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting || !paymentMethod}
        className="min-h-11 w-full bg-gold text-petrol-deep hover:bg-gold-light"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando solicitud...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
