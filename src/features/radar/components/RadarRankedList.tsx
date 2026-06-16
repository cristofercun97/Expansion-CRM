import type { RadarRankedItem } from '@/features/radar/utils/radarMetrics'
import { EMPTY_DATA_LABEL } from '@/features/radar/utils/radarMetrics'

type RadarRankedListProps = {
  title: string
  items: RadarRankedItem[]
  emptyLabel?: string
}

function getBarWidthPercent(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) {
    return 0
  }

  const percent = (count / maxCount) * 100
  return Math.max(percent, 8)
}

export function RadarRankedList({
  title,
  items,
  emptyLabel = EMPTY_DATA_LABEL,
}: RadarRankedListProps) {
  const maxCount = items.reduce((currentMax, item) => Math.max(currentMax, item.count), 0)
  const hasData = items.length > 0 && maxCount > 0

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-hero-text">{title}</h2>

      {!hasData ? (
        <p className="mt-4 text-sm text-hero-text/70">{emptyLabel}</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {items.map((item, index) => {
            const widthPercent = getBarWidthPercent(item.count, maxCount)

            return (
              <li key={`${item.label}-${index}`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-hero-text">{item.label}</p>
                  <span className="shrink-0 rounded-full bg-teal-accent/15 px-2.5 py-0.5 text-xs font-semibold text-teal-accent">
                    {item.count}
                  </span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-white/10"
                  role="presentation"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-accent/80 to-teal-accent transition-[width] duration-300 ease-out"
                    style={{ width: `${widthPercent}%` }}
                    aria-label={`${item.label}: ${item.count}`}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
