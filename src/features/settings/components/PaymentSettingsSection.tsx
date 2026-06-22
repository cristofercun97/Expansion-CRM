import { SettingsField, SettingsInput, SettingsSelect } from '@/features/settings/components/SettingsField'
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard'
import type { UserPaymentSettings } from '@/features/settings/types/user-settings.types'
import { CRYPTO_NETWORK_OPTIONS } from '@/features/settings/utils/userSettings.utils'

type PaymentSettingsSectionProps = {
  paymentSettings: UserPaymentSettings
  errors: Record<string, string>
  onPaymentSettingsChange: (paymentSettings: UserPaymentSettings) => void
}

export function PaymentSettingsSection({
  paymentSettings,
  errors,
  onPaymentSettingsChange,
}: PaymentSettingsSectionProps) {
  function updatePaymentSettings(patch: Partial<UserPaymentSettings>) {
    onPaymentSettingsChange({ ...paymentSettings, ...patch })
  }

  return (
    <SettingsSectionCard
      title="Gestión de pago"
      description="Estos datos serán usados únicamente para gestionar pagos y reconocimientos dentro de Expansión."
    >
      <div className="space-y-5">
        <SettingsField label="Método preferido">
          <SettingsSelect
            value={paymentSettings.preferredMethod}
            onChange={(event) =>
              updatePaymentSettings({
                preferredMethod: event.target.value as UserPaymentSettings['preferredMethod'],
              })
            }
          >
            <option value="">Selecciona un método</option>
            <option value="bank">Cuenta bancaria</option>
            <option value="crypto">Cripto USDT</option>
          </SettingsSelect>
        </SettingsField>

        {paymentSettings.preferredMethod === 'bank' ? (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <SettingsField label="Tipo de cuenta">
              <SettingsSelect
                value={paymentSettings.bank?.accountType ?? 'savings'}
                onChange={(event) =>
                  updatePaymentSettings({
                    bank: {
                      accountType:
                        event.target.value === 'checking' ? 'checking' : 'savings',
                      bankName: paymentSettings.bank?.bankName ?? '',
                      accountNumber: paymentSettings.bank?.accountNumber ?? '',
                      documentId: paymentSettings.bank?.documentId ?? '',
                    },
                  })
                }
              >
                <option value="savings">Ahorros</option>
                <option value="checking">Corriente</option>
              </SettingsSelect>
            </SettingsField>

            <SettingsField label="Nombre del banco" error={errors.bankName}>
              <SettingsInput
                value={paymentSettings.bank?.bankName ?? ''}
                onChange={(event) =>
                  updatePaymentSettings({
                    bank: {
                      accountType: paymentSettings.bank?.accountType ?? 'savings',
                      bankName: event.target.value,
                      accountNumber: paymentSettings.bank?.accountNumber ?? '',
                      documentId: paymentSettings.bank?.documentId ?? '',
                    },
                  })
                }
              />
            </SettingsField>

            <SettingsField label="Número de cuenta" error={errors.accountNumber}>
              <SettingsInput
                value={paymentSettings.bank?.accountNumber ?? ''}
                onChange={(event) =>
                  updatePaymentSettings({
                    bank: {
                      accountType: paymentSettings.bank?.accountType ?? 'savings',
                      bankName: paymentSettings.bank?.bankName ?? '',
                      accountNumber: event.target.value,
                      documentId: paymentSettings.bank?.documentId ?? '',
                    },
                  })
                }
              />
            </SettingsField>

            <SettingsField label="Documento de identidad" error={errors.documentId}>
              <SettingsInput
                value={paymentSettings.bank?.documentId ?? ''}
                onChange={(event) =>
                  updatePaymentSettings({
                    bank: {
                      accountType: paymentSettings.bank?.accountType ?? 'savings',
                      bankName: paymentSettings.bank?.bankName ?? '',
                      accountNumber: paymentSettings.bank?.accountNumber ?? '',
                      documentId: event.target.value,
                    },
                  })
                }
              />
            </SettingsField>
          </div>
        ) : null}

        {paymentSettings.preferredMethod === 'crypto' ? (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <SettingsField label="Activo">
              <SettingsInput value="Tether (USDT)" readOnly disabled />
            </SettingsField>

            <SettingsField label="Red" error={errors.network}>
              <SettingsSelect
                value={paymentSettings.crypto?.network ?? ''}
                onChange={(event) =>
                  updatePaymentSettings({
                    crypto: {
                      asset: 'USDT',
                      network: event.target.value,
                      walletAddress: paymentSettings.crypto?.walletAddress ?? '',
                    },
                  })
                }
              >
                <option value="">Selecciona una red</option>
                {CRYPTO_NETWORK_OPTIONS.map((network) => (
                  <option key={network} value={network}>
                    {network}
                  </option>
                ))}
              </SettingsSelect>
            </SettingsField>

            <SettingsField label="Wallet" error={errors.walletAddress}>
              <SettingsInput
                value={paymentSettings.crypto?.walletAddress ?? ''}
                onChange={(event) =>
                  updatePaymentSettings({
                    crypto: {
                      asset: 'USDT',
                      network: paymentSettings.crypto?.network ?? '',
                      walletAddress: event.target.value,
                    },
                  })
                }
                placeholder="Dirección de tu wallet"
              />
            </SettingsField>
          </div>
        ) : null}

        <p className="rounded-xl border border-teal-accent/20 bg-teal-accent/8 px-4 py-3 text-xs leading-relaxed text-hero-text/70">
          No guardamos datos de tarjeta ni CVV. Solo información necesaria para transferencias o pagos en
          cripto dentro de Expansión.
        </p>
      </div>
    </SettingsSectionCard>
  )
}
