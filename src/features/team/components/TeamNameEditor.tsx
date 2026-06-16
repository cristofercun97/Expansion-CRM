import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import type { Team } from '@/features/team/types/team.types'
import {
  TEAM_NAME_MAX_LENGTH,
  validateTeamName,
} from '@/features/team/utils/teamInviteUtils'
import { cn } from '@/lib/utils'

type TeamNameEditorProps = {
  team: Team
  onSave: (name: string) => Promise<Team>
  className?: string
}

export function TeamNameEditor({ team, onSave, className }: TeamNameEditorProps) {
  const { showToast } = useToast()
  const [name, setName] = useState(team.name)
  const [fieldError, setFieldError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(team.name)
    setFieldError('')
  }, [team.name])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateTeamName(name)

    if (validationError) {
      setFieldError(validationError)
      return
    }

    if (name.trim() === team.name.trim()) {
      return
    }

    setSaving(true)
    setFieldError('')

    try {
      await onSave(name)
      showToast('Nombre del grupo actualizado.', 'success')
    } catch (saveError) {
      showToast(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el nombre del grupo. Intenta nuevamente.',
        'info',
      )
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = name.trim() !== team.name.trim()

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <Pencil className="h-4 w-4 text-teal-accent" aria-hidden="true" />
        <h3 className="text-base font-semibold text-hero-text">Nombre del grupo</h3>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <Input
          label="Nombre visible"
          labelClassName="text-hero-text/75"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (fieldError) {
              setFieldError('')
            }
          }}
          maxLength={TEAM_NAME_MAX_LENGTH}
          disabled={saving}
          error={fieldError}
          helperText={`Entre 3 y ${TEAM_NAME_MAX_LENGTH} caracteres.`}
          className="border-white/15 bg-petrol-deep/50 text-hero-text placeholder:text-hero-text/40"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={saving || !hasChanges || Boolean(validateTeamName(name))}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              'Guardar nombre'
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
