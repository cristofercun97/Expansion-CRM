import type { MaterialEngagementTrackingContext } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { AcademyMaterialCard } from '@/features/academy/components/AcademyMaterialCard'

type AcademySectionProps = {
  title: string
  description?: string
  materials: AcademyMaterial[]
  testsByMaterialId: Record<string, AcademyTest>
  readOnly?: boolean
  canViewAttempts?: boolean
  memberTeamId?: string | null
  materialEngagementTracking?: MaterialEngagementTrackingContext | null
  studiedMaterialIds?: ReadonlySet<string>
  deletingMaterialId?: string | null
  onEdit?: (material: AcademyMaterial) => void
  onDelete?: (material: AcademyMaterial) => void
  onManageTest?: (material: AcademyMaterial) => void
  onTakeTest?: (material: AcademyMaterial, test: AcademyTest) => void
  onViewAttempts?: (material: AcademyMaterial, test: AcademyTest) => void
  onMaterialStudied?: (materialId: string) => void
  emptyMessage?: string
}

export function AcademySection({
  title,
  description,
  materials,
  testsByMaterialId,
  readOnly = false,
  canViewAttempts = false,
  memberTeamId = null,
  materialEngagementTracking = null,
  studiedMaterialIds,
  deletingMaterialId = null,
  onEdit,
  onDelete,
  onManageTest,
  onTakeTest,
  onViewAttempts,
  onMaterialStudied,
  emptyMessage = 'Aún no hay materiales en esta sección.',
}: AcademySectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-hero-text">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-hero-text/70">{description}</p>
        ) : null}
      </div>

      {materials.length === 0 ? (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {materials.map((material) => {
            const test = testsByMaterialId[material.id] ?? null

            return (
              <AcademyMaterialCard
                key={material.id}
                material={material}
                test={test}
                hasTest={Boolean(test)}
                readOnly={readOnly}
                canViewAttempts={canViewAttempts}
                memberTeamId={memberTeamId}
                materialEngagementTracking={materialEngagementTracking}
                isMaterialStudied={studiedMaterialIds?.has(material.id) ?? false}
                isDeleting={deletingMaterialId === material.id}
                onEdit={onEdit ?? (() => undefined)}
                onDelete={onDelete ?? (() => undefined)}
                onManageTest={onManageTest ?? (() => undefined)}
                onTakeTest={onTakeTest}
                onViewAttempts={onViewAttempts}
                onMaterialStudied={onMaterialStudied}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
