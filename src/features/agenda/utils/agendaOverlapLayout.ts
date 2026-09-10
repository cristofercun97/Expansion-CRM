/**
 * Pure overlapping-event layout for Agenda week/day grids.
 * Adjacent intervals [start, end) do NOT overlap when a.end === b.start.
 */

export type OverlapEventInput = {
  id: string
  startMs: number
  endMs: number
}

export type OverlapLayoutItem = {
  id: string
  startMs: number
  endMs: number
  columnIndex: number
  columnCount: number
  collisionGroupId: number
  top: number
  height: number
  /** Percentage of day-column width (0–100). */
  leftPct: number
  /** Percentage of day-column width (0–100). */
  widthPct: number
  /** Alias of leftPct for callers expecting `left`. */
  left: number
  /** Alias of widthPct for callers expecting `width`. */
  width: number
  zIndex: number
}

export type OverlapLayoutStrategy = 'columns' | 'peek'

export type LayoutOverlappingEventsOptions = {
  strategy?: OverlapLayoutStrategy
  /** Horizontal gutter as % of day column (columns strategy). */
  gutterPct?: number
  /** Inset from day-column edges (%). */
  edgeInsetPct?: number
  gridStartHour?: number
  gridEndHour?: number
  hourPx?: number
  minHeightPx?: number
}

const DEFAULTS = {
  strategy: 'columns' as OverlapLayoutStrategy,
  gutterPct: 1.2,
  edgeInsetPct: 1.5,
  gridStartHour: 8,
  gridEndHour: 21,
  hourPx: 52,
  minHeightPx: 28,
}

/** Half-open interval overlap: touches at the boundary are NOT overlaps. */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

function minutesFromGridStart(ms: number, gridStartHour: number): number {
  const date = new Date(ms)
  return date.getHours() * 60 + date.getMinutes() - gridStartHour * 60
}

function blockMetrics(
  startMs: number,
  endMs: number,
  options: Required<
    Pick<
      typeof DEFAULTS,
      'gridStartHour' | 'gridEndHour' | 'hourPx' | 'minHeightPx'
    >
  >,
): { top: number; height: number } {
  const spanMin = (options.gridEndHour - options.gridStartHour) * 60
  const startMin = Math.max(0, minutesFromGridStart(startMs, options.gridStartHour))
  const endMin = Math.min(spanMin, minutesFromGridStart(endMs, options.gridStartHour))
  const duration = Math.max(options.minHeightPx / (options.hourPx / 60), endMin - startMin)
  const pxPerMin = options.hourPx / 60
  return {
    top: startMin * pxPerMin,
    height: duration * pxPerMin,
  }
}

function assignColumns(cluster: OverlapEventInput[]): Map<string, number> {
  const sorted = [...cluster].sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs
    if (a.endMs !== b.endMs) return b.endMs - a.endMs
    return a.id.localeCompare(b.id)
  })

  const columnEnds: number[] = []
  const columnById = new Map<string, number>()

  for (const event of sorted) {
    let placed = false
    for (let index = 0; index < columnEnds.length; index += 1) {
      if (columnEnds[index]! <= event.startMs) {
        columnEnds[index] = event.endMs
        columnById.set(event.id, index)
        placed = true
        break
      }
    }
    if (!placed) {
      columnById.set(event.id, columnEnds.length)
      columnEnds.push(event.endMs)
    }
  }

  return columnById
}

function buildCollisionGroups(events: OverlapEventInput[]): OverlapEventInput[][] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs
    return a.id.localeCompare(b.id)
  })

  const groups: OverlapEventInput[][] = []
  let current: OverlapEventInput[] = []
  let currentEnd = -Infinity

  for (const event of sorted) {
    const safeEnd = Math.max(event.endMs, event.startMs + 1)
    const normalized = { ...event, endMs: safeEnd }

    if (current.length === 0) {
      current = [normalized]
      currentEnd = safeEnd
      continue
    }

    // Belongs to group if overlaps any event that extends the active cluster window.
    if (normalized.startMs < currentEnd) {
      current.push(normalized)
      currentEnd = Math.max(currentEnd, safeEnd)
    } else {
      groups.push(current)
      current = [normalized]
      currentEnd = safeEnd
    }
  }

  if (current.length > 0) groups.push(current)
  return groups
}

function geometryForItem(options: {
  columnIndex: number
  columnCount: number
  strategy: OverlapLayoutStrategy
  gutterPct: number
  edgeInsetPct: number
}): { leftPct: number; widthPct: number; zIndex: number } {
  const { columnIndex, columnCount, strategy, gutterPct, edgeInsetPct } = options
  const count = Math.max(1, columnCount)
  const index = Math.min(Math.max(0, columnIndex), count - 1)

  if (strategy === 'peek') {
    // Legacy peek kept for tests; prefer columns — peek intentionally stacks.
    const step = Math.min(10, 28 / count)
    const leftPct = edgeInsetPct + index * step
    const widthPct = Math.max(36, 100 - leftPct - edgeInsetPct)
    return {
      leftPct,
      widthPct,
      zIndex: 20 + index,
    }
  }

  // Non-overlapping horizontal columns (canonical Day + Week layout).
  const usable = Math.max(0, 100 - edgeInsetPct * 2)
  const slot = usable / count
  const gutter = count > 1 ? Math.min(gutterPct, slot * 0.35) : 0
  const widthPct = Math.max(6, slot - gutter)
  const leftPct = edgeInsetPct + index * slot + gutter / 2
  const maxWidth = Math.max(6, 100 - leftPct - edgeInsetPct)

  return {
    leftPct,
    widthPct: Math.min(widthPct, maxWidth),
    zIndex: 10 + index,
  }
}

/**
 * Layout overlapping events into columns (desktop) or peek stacks (mobile/dense).
 * Returns stable geometry independent of React rendering.
 */
export function layoutOverlappingEvents(
  events: OverlapEventInput[],
  options: LayoutOverlappingEventsOptions = {},
): OverlapLayoutItem[] {
  const strategy = options.strategy ?? DEFAULTS.strategy
  const gutterPct = options.gutterPct ?? DEFAULTS.gutterPct
  const edgeInsetPct = options.edgeInsetPct ?? DEFAULTS.edgeInsetPct
  const gridStartHour = options.gridStartHour ?? DEFAULTS.gridStartHour
  const gridEndHour = options.gridEndHour ?? DEFAULTS.gridEndHour
  const hourPx = options.hourPx ?? DEFAULTS.hourPx
  const minHeightPx = options.minHeightPx ?? DEFAULTS.minHeightPx

  const groups = buildCollisionGroups(events)
  const result: OverlapLayoutItem[] = []

  groups.forEach((group, groupId) => {
    const columns = assignColumns(group)
    const columnCount = Math.max(1, ...[...columns.values()].map((value) => value + 1), 1)

    for (const event of group) {
      const columnIndex = columns.get(event.id) ?? 0
      const { top, height } = blockMetrics(event.startMs, event.endMs, {
        gridStartHour,
        gridEndHour,
        hourPx,
        minHeightPx,
      })
      const geo = geometryForItem({
        columnIndex,
        columnCount,
        strategy,
        gutterPct,
        edgeInsetPct,
      })

      result.push({
        id: event.id,
        startMs: event.startMs,
        endMs: event.endMs,
        columnIndex,
        columnCount,
        collisionGroupId: groupId,
        top,
        height,
        leftPct: geo.leftPct,
        widthPct: geo.widthPct,
        left: geo.leftPct,
        width: geo.widthPct,
        zIndex: geo.zIndex,
      })
    }
  })

  return result
}

/** True when layout stays within the day column (no critical overflow). */
export function layoutFitsDayColumn(items: OverlapLayoutItem[], epsilon = 0.05): boolean {
  return items.every(
    (item) =>
      item.leftPct >= -epsilon &&
      item.widthPct > 0 &&
      item.leftPct + item.widthPct <= 100 + epsilon,
  )
}
