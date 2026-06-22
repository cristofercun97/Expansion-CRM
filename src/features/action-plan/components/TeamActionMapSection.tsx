import { Loader2, Map, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { TeamActionMapEditorModal } from '@/features/action-plan/components/TeamActionMapEditorModal'
import { TeamActionMapReviewSection } from '@/features/action-plan/components/TeamActionMapReviewSection'
import { TeamActionMapVisualSummary } from '@/features/action-plan/components/TeamActionMapVisualSummary'
import { useTeamActionMap } from '@/features/action-plan/hooks/useTeamActionMap'
import { useTeamActionMapReviews } from '@/features/action-plan/hooks/useTeamActionMapReviews'
import { teamActionMapService } from '@/features/action-plan/services/team-action-map.service'
import type { ActionTask } from '@/features/action-plan/types/action-plan.types'
import type { UpsertTeamActionMapInput } from '@/features/action-plan/types/team-action-map.types'
import { cn } from '@/lib/utils'

type TeamActionMapSectionProps = {
  teamId: string
  ownerUid: string
  canEdit: boolean
  sectionLabel?: string
  className?: string
  linkedTasks?: ActionTask[]
}

export function TeamActionMapSection({
  teamId,
  ownerUid,
  canEdit,
  sectionLabel,
  className,
  linkedTasks = [],
}: TeamActionMapSectionProps) {
  const { showToast } = useToast()
  const { map, loading, error, reload } = useTeamActionMap(teamId)
  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
    reload: reloadReviews,
  } = useTeamActionMapReviews(map ? teamId : null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const latestReview = reviews[0] ?? null

  function scrollToReviewSection() {
    document.getElementById('team-action-map-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSave(input: UpsertTeamActionMapInput) {
    setIsSaving(true)

    try {
      if (map) {
        await teamActionMapService.updateTeamActionMap(teamId, input)
        showToast('Mapa actualizado.', 'success')
      } else {
        await teamActionMapService.createTeamActionMap(ownerUid, teamId, input)
        showToast('Mapa creado.', 'success')
      }

      reload()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section
        className={cn(
          'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6',
          className,
        )}
        aria-label={sectionLabel ?? 'Mapa del grupo'}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
              <Map className="h-5 w-5 text-gold-light" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-hero-text">Mapa de ruta</h2>
              <p className="mt-1 text-sm text-hero-text/70">
                {sectionLabel ??
                  'Estructura estratégica del grupo. Un mapa activo por equipo.'}
              </p>
            </div>
          </div>

          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              className="border-gold/25 bg-gold/10 text-gold-light hover:bg-gold/15"
            >
              {map ? (
                <>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar mapa
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Crear mapa
                </>
              )}
            </Button>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando mapa del grupo...
          </p>
        ) : error ? (
          <p className="mt-5 text-sm text-red-200">{error}</p>
        ) : !map ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-sm text-hero-text/70">
            {canEdit
              ? 'Aún no has creado el mapa de ruta de tu grupo. Empieza definiendo el objetivo principal, el periodo y las áreas clave.'
              : 'Tu líder aún no ha publicado el mapa de ruta del grupo.'}
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <TeamActionMapVisualSummary
              map={map}
              linkedTasks={linkedTasks}
              lastReview={latestReview}
              onViewReview={latestReview ? scrollToReviewSection : undefined}
            />

            <TeamActionMapReviewSection
              teamId={teamId}
              ownerUid={ownerUid}
              canEdit={canEdit}
              reviews={reviews}
              loading={reviewsLoading}
              error={reviewsError}
              reload={reloadReviews}
            />
          </div>
        )}
      </section>

      {canEdit ? (
        <TeamActionMapEditorModal
          open={isEditorOpen}
          isSubmitting={isSaving}
          existingMap={map}
          onClose={() => {
            if (!isSaving) {
              setIsEditorOpen(false)
            }
          }}
          onSubmit={handleSave}
        />
      ) : null}
    </>
  )
}
