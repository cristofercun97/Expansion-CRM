import type { ActionTask } from '@/features/action-plan/types/action-plan.types'
import {
  getActionTaskAreaLabel,
  getActionTaskResponsibleLabel,
} from '@/features/action-plan/utils/actionTaskRoadmapUtils'

type ActionTaskMetaBadgesProps = {
  task: ActionTask
}

export function ActionTaskMetaBadges({ task }: ActionTaskMetaBadgesProps) {
  const areaLabel = getActionTaskAreaLabel(task)
  const responsibleLabel = getActionTaskResponsibleLabel(task)

  if (!areaLabel && !responsibleLabel) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {areaLabel ? (
        <span className="rounded-full border border-teal-accent/25 bg-teal-accent/10 px-2.5 py-0.5 text-xs font-medium text-teal-accent">
          Área: {areaLabel}
        </span>
      ) : null}
      {responsibleLabel ? (
        <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs font-medium text-hero-text/75">
          Responsable: {responsibleLabel}
        </span>
      ) : null}
    </div>
  )
}
