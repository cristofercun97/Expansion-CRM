import { ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { AcademyMaterialMedia } from '@/features/academy/components/AcademyMaterialMedia'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import type { MaterialEngagementTrackingContext } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { getAcademyMaterialTypeLabel } from '@/features/academy/utils/academyMaterialLabels'
import { logAcademyEngagementDebug } from '@/features/academy/utils/academyMaterialEngagementDebug'
import { canTakeAcademyTest, resolveEngagementTeamId } from '@/features/academy/utils/academyTeamAccess'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatContactDate } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'
import { getFirebaseAuth } from '@/lib/firebase'

type AcademyMaterialCardProps = {
  material: AcademyMaterial
  test?: AcademyTest | null
  hasTest: boolean
  readOnly?: boolean
  canViewAttempts?: boolean
  memberTeamId?: string | null
  materialEngagementTracking?: MaterialEngagementTrackingContext | null
  isMaterialStudied?: boolean
  isDeleting?: boolean
  onEdit: (material: AcademyMaterial) => void
  onDelete: (material: AcademyMaterial) => void
  onManageTest: (material: AcademyMaterial) => void
  onTakeTest?: (material: AcademyMaterial, test: AcademyTest) => void
  onViewAttempts?: (material: AcademyMaterial, test: AcademyTest) => void
  onMaterialStudied?: (materialId: string) => void
}

export function AcademyMaterialCard({
  material,
  test = null,
  hasTest,
  readOnly = false,
  canViewAttempts = false,
  memberTeamId = null,
  materialEngagementTracking = null,
  isMaterialStudied = false,
  isDeleting = false,
  onEdit,
  onDelete,
  onManageTest,
  onTakeTest,
  onViewAttempts,
  onMaterialStudied,
}: AcademyMaterialCardProps) {
  const { showToast } = useToast()
  const { appUser } = useAuth()
  const description = material.description.trim()
  const showTakeTest = canTakeAcademyTest(material, test ?? undefined, readOnly, memberTeamId)
  const materialTeamId = material.teamId?.trim() || null

  function handleOpenResource() {
    window.open(material.url, '_blank', 'noopener,noreferrer')

    if (!materialEngagementTracking?.memberUid) {
      return
    }

    const authUser = getFirebaseAuth().currentUser
    const teamId = resolveEngagementTeamId(material)

    const debugContext = {
      authUid: authUser?.uid ?? null,
      authEmail: authUser?.email ?? null,
      emailVerified: authUser?.emailVerified ?? false,
      appUserUid: appUser?.uid ?? null,
      homeTeamId: appUser?.homeTeamId ?? null,
      ownedTeamId: appUser?.ownedTeamId ?? null,
      materialId: material.id,
      materialTeamId,
      resolvedEngagementTeamId: teamId,
      memberUid: materialEngagementTracking.memberUid,
    }

    logAcademyEngagementDebug(debugContext)

    if (!teamId) {
      if (import.meta.env.DEV) {
        console.warn(
          '[Academia Engagement Debug] Sin material.teamId — tracking omitido, recurso abierto igualmente',
          { materialId: material.id, materialTeamId },
        )
      }
      return
    }

    const isFirstStudy = !isMaterialStudied

    void academyMaterialEngagementsService
      .trackMaterialOpen({
        teamId,
        materialId: material.id,
        memberUid: materialEngagementTracking.memberUid,
        memberName: materialEngagementTracking.memberName,
        memberEmail: materialEngagementTracking.memberEmail,
      })
      .then((result) => {
        if (!result.tracked) {
          showToast(
            'Abrimos el recurso, pero no pudimos registrar tu avance. Verifica tu conexión e intenta de nuevo.',
            'info',
          )
          return
        }

        onMaterialStudied?.(material.id)

        if (isFirstStudy) {
          showToast(`¡Felicidades! Has estudiado ${material.title} 🎉`, 'success')
        }
      })
      .catch(() => {
        showToast(
          'Abrimos el recurso, pero no pudimos registrar tu avance. Verifica tu conexión e intenta de nuevo.',
          'info',
        )
      })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="relative">
        <AcademyMaterialMedia material={material} />
        {isMaterialStudied ? (
          <span className="absolute right-3 top-3 z-10 rounded-full border border-green-400/40 bg-green-500/25 px-2.5 py-1 text-xs font-semibold text-green-300 shadow-[0_4px_12px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            Completado ✓
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-hero-text">{material.title}</h3>
            {description ? (
              <p className="mt-1 line-clamp-2 text-sm text-hero-text/70">{description}</p>
            ) : (
              <p className="mt-1 text-sm italic text-hero-text/45">Sin descripción</p>
            )}
          </div>

          <Badge
            variant={material.isActive ? 'teal' : 'muted'}
            className={cn(
              'shrink-0',
              material.isActive
                ? 'border border-teal-accent/30 bg-teal-accent/15 text-teal-accent'
                : 'border border-white/10 bg-white/5 text-hero-text/55',
            )}
          >
            {material.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-hero-text/65">
            <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-medium text-hero-text/80">
              {getAcademyMaterialTypeLabel(material.type)}
            </span>
            <span>{formatContactDate(material.createdAt)}</span>
            {hasTest ? (
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold-light">
                Test listo
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10 hover:text-[#81C3BC]"
                  onClick={() => onEdit(material)}
                  disabled={isDeleting}
                >
                  Editar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    hasTest
                      ? 'border-white/20 bg-white/5 text-hero-text hover:bg-white/10'
                      : 'border-white/20 bg-white/5 text-[#81C3BC] hover:bg-white/10 hover:text-[#81C3BC]'
                  }
                  onClick={() => onManageTest(material)}
                  disabled={isDeleting}
                >
                  {hasTest ? 'Editar test' : 'Crear test'}
                </Button>

                <button
                  type="button"
                  aria-label={`Eliminar ${material.title}`}
                  disabled={isDeleting}
                  onClick={() => onDelete(material)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-400/25 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : null}

            {showTakeTest && test && onTakeTest ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
                onClick={() => onTakeTest(material, test)}
                disabled={isDeleting}
              >
                Realizar test
              </Button>
            ) : null}

            {canViewAttempts && test && onViewAttempts ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
                onClick={() => onViewAttempts(material, test)}
                disabled={isDeleting}
              >
                Ver respuestas
              </Button>
            ) : null}

            <button
              type="button"
              onClick={handleOpenResource}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-petrol-deep px-3 text-sm font-medium text-hero-text transition-all duration-200 hover:bg-petrol-dark"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir recurso
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
