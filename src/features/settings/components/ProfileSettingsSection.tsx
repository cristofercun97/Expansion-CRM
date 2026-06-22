import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { COUNTRY_OPTIONS, findCountryByCode } from '@/features/settings/constants/countries'
import { SettingsField, SettingsInput, SettingsSelect } from '@/features/settings/components/SettingsField'
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard'
import type { UserProfileDetails } from '@/features/settings/types/user-settings.types'
import {
  calculateAgeFromBirthDate,
  GENDER_OPTIONS,
} from '@/features/settings/utils/userSettings.utils'

type ProfileSettingsSectionProps = {
  profile: UserProfileDetails
  errors: Record<string, string>
  avatarUploading: boolean
  onProfileChange: (profile: UserProfileDetails) => void
  onAvatarSelect: (file: File) => Promise<void>
}

export function ProfileSettingsSection({
  profile,
  errors,
  avatarUploading,
  onProfileChange,
  onAvatarSelect,
}: ProfileSettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState('')
  const computedAge = profile.birthDate ? calculateAgeFromBirthDate(profile.birthDate) : null
  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  function updateProfile(patch: Partial<UserProfileDetails>) {
    onProfileChange({ ...profile, ...patch })
  }

  function handleBirthDateChange(value: string) {
    const age = calculateAgeFromBirthDate(value)
    updateProfile({
      birthDate: value,
      age: age ?? 0,
    })
  }

  function handleCountryChange(code: string) {
    const country = findCountryByCode(code)
    updateProfile({
      countryCode: code,
      countryName: country?.name ?? '',
    })
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setAvatarError('')

    try {
      await onAvatarSelect(file)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'No pudimos subir la imagen.')
    }
  }

  return (
    <SettingsSectionCard
      title="Editar perfil"
      description="Tu información personal para reconocimientos y comunicación del equipo."
    >
      <div className="space-y-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Foto de perfil"
                className="h-20 w-20 rounded-2xl border border-gold/25 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/25 bg-gold/15 text-xl font-semibold text-gold-light">
                {initials || 'EX'}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-petrol-deep text-gold-light shadow-lg"
              aria-label="Cambiar foto de perfil"
            >
              {avatarUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-hero-text">Foto de perfil</p>
            <p className="text-xs text-hero-text/60">JPG, PNG, WEBP o GIF. Máximo 5 MB.</p>
            {avatarError ? <p className="text-xs text-red-300">{avatarError}</p> : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <SettingsField label="Nombre y apellidos" error={errors.fullName}>
          <SettingsInput
            value={profile.fullName}
            onChange={(event) => updateProfile({ fullName: event.target.value })}
            placeholder="Tu nombre completo"
          />
        </SettingsField>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Fecha de nacimiento" error={errors.birthDate}>
            <SettingsInput
              type="date"
              value={profile.birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => handleBirthDateChange(event.target.value)}
            />
          </SettingsField>

          <SettingsField label="Edad" helperText="Calculada automáticamente.">
            <SettingsInput value={computedAge !== null ? String(computedAge) : '—'} readOnly disabled />
          </SettingsField>
        </div>

        <SettingsField label="Sexo">
          <SettingsSelect
            value={profile.gender}
            onChange={(event) =>
              updateProfile({
                gender: event.target.value as UserProfileDetails['gender'],
              })
            }
          >
            <option value="">Selecciona una opción</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SettingsSelect>
        </SettingsField>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Ciudad">
            <SettingsInput
              value={profile.city}
              onChange={(event) => updateProfile({ city: event.target.value })}
              placeholder="Tu ciudad"
            />
          </SettingsField>

          <SettingsField label="País">
            <SettingsSelect
              value={profile.countryCode}
              onChange={(event) => handleCountryChange(event.target.value)}
            >
              <option value="">Selecciona un país</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={country.code}>
                  {`${country.flag} ${country.name}`}
                </option>
              ))}
            </SettingsSelect>
          </SettingsField>
        </div>

        <SettingsField label="Número de contacto" error={errors.phone}>
          <SettingsInput
            type="tel"
            value={profile.phone}
            onChange={(event) => updateProfile({ phone: event.target.value })}
            placeholder="+34 600 000 000"
          />
        </SettingsField>
      </div>
    </SettingsSectionCard>
  )
}
