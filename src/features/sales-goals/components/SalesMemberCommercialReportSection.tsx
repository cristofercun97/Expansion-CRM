import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { SalesMemberCommercialCard } from '@/features/sales-goals/components/SalesMemberCommercialCard'
import type { TeamSalesGoal, TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import { buildMemberCommercialSummaries } from '@/features/sales-goals/utils/salesReportAnalytics'
import { SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type SalesMemberCommercialReportSectionProps = {
  goal: TeamSalesGoal
  reports: TeamSalesReport[]
  className?: string
}

export function SalesMemberCommercialReportSection({
  goal,
  reports,
  className,
}: SalesMemberCommercialReportSectionProps) {
  const summaries = useMemo(
    () => buildMemberCommercialSummaries(reports, goal),
    [goal, reports],
  )

  return (
    <section
      id="team-sales-progress"
      className={cn('rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5', className)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
          <Users className="h-5 w-5 text-teal-accent" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-hero-text">
            {SALES_GOAL_COPY.commercialReportTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            {SALES_GOAL_COPY.commercialReportDescription}
          </p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-hero-text/70">
          {SALES_GOAL_COPY.commercialReportEmpty}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {summaries.map((summary) => (
            <li key={summary.memberUid}>
              <SalesMemberCommercialCard summary={summary} reports={reports} goal={goal} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
