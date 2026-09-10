/**
 * Agenda visible hour range + overlap + DOM geometry validation
 * Run: npx tsx scripts/test-agenda-overlap-layout.ts
 */
import assert from 'node:assert/strict'
import {
  AGENDA_HOUR_PX,
  resolveAgendaVisibleHourRange,
} from '../src/features/agenda/utils/agendaCalendarUi.ts'
import {
  intervalsOverlap,
  layoutFitsDayColumn,
  layoutOverlappingEvents,
} from '../src/features/agenda/utils/agendaOverlapLayout.ts'
import {
  assertNoVisualOverlay,
  layoutTimedEvents,
  simulateEventBoundingBoxes,
} from '../src/features/agenda/utils/agendaTimedEventLayout.ts'

function at(hour: number, minute = 0): number {
  return new Date(2026, 3, 10, hour, minute, 0, 0).getTime()
}

function layoutForView(
  view: 'day' | 'week',
  events: Array<{ id: string; startMs: number; endMs: number }>,
  range = resolveAgendaVisibleHourRange(events),
) {
  return layoutTimedEvents(events, {
    compact: view === 'week',
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })
}

function assertNoHorizontalOverlay(
  items: ReturnType<typeof layoutOverlappingEvents>,
) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i]!
      const b = items[j]!
      if (!intervalsOverlap(a.startMs, a.endMs, b.startMs, b.endMs)) continue
      const aRight = a.leftPct + a.widthPct
      const bRight = b.leftPct + b.widthPct
      const horizontalOverlap = a.leftPct < bRight - 0.05 && b.leftPct < aRight - 0.05
      assert.equal(horizontalOverlap, false, `overlay ${a.id} vs ${b.id}`)
    }
  }
}

/** Prove the production bug: fixed 08:00 grid clamps early events to top=0. */
function documentBeforeRootCause() {
  const events = [
    { id: 'e353', startMs: at(3, 53), endMs: at(4, 23) },
    { id: 'e357', startMs: at(3, 57), endMs: at(4, 27) },
    { id: 'e417', startMs: at(4, 17), endMs: at(4, 47) },
  ]
  const broken = layoutOverlappingEvents(events, {
    strategy: 'columns',
    gridStartHour: 8,
    gridEndHour: 21,
  })
  const tops = broken.map((item) => item.top)
  assert.ok(
    tops.every((top) => top === 0),
    'BEFORE: early meetings must all clamp to top=0 on fixed 08:00 grid',
  )
  console.log(
    'DOM BEFORE (repro): calendar start=08:00; meetings 03:53/03:57/04:17 → computed top=0 for all; bounding collision at y=0',
  )
}

function testRange01Default() {
  const range = resolveAgendaVisibleHourRange([])
  assert.equal(range.startHour, 8)
  assert.equal(range.endHour, 21)
  assert.equal(range.hourLabels[0], 8)
  assert.equal(range.hourLabels.at(-1), 20)
  console.log('PASS RANGE-01 default 08:00–21:00')
}

function testRange02EarlyEvent() {
  const range = resolveAgendaVisibleHourRange([
    { startMs: at(3, 53), endMs: at(4, 23) },
  ])
  assert.equal(range.startHour, 3)
  assert.ok(range.endHour >= 21)
  console.log('PASS RANGE-02 event 03:53 → calendarStart=03:00')
}

function testRange03LateEvent() {
  const range = resolveAgendaVisibleHourRange([
    { startMs: at(21, 50), endMs: at(22, 20) },
  ])
  assert.equal(range.startHour, 8)
  assert.equal(range.endHour, 23)
  console.log('PASS RANGE-03 ends 22:20 → calendarEnd=23:00')
}

function testRange04WeekSharedRange() {
  const weekEvents = [
    { startMs: at(3, 53), endMs: at(4, 23) },
    { startMs: at(10, 0), endMs: at(11, 0) },
  ]
  const range = resolveAgendaVisibleHourRange(weekEvents)
  assert.equal(range.startHour, 3)
  // All columns would receive the same range object in Week view.
  const dayA = layoutForView('week', [weekEvents[0]!], range)
  const dayB = layoutForView('week', [weekEvents[1]!], range)
  assert.ok(dayA[0]!.top > 0)
  assert.ok(dayB[0]!.top > dayA[0]!.top)
  console.log('PASS RANGE-04 week shared range for early+normal')
}

function testRange05NoArtificialTopZero() {
  const events = [
    { id: 'e353', startMs: at(3, 53), endMs: at(4, 23) },
    { id: 'e357', startMs: at(3, 57), endMs: at(4, 27) },
    { id: 'e417', startMs: at(4, 17), endMs: at(4, 47) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  assert.equal(range.startHour, 3)
  const items = layoutForView('day', events, range)
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))
  const top353 = byId.e353!.top
  const top357 = byId.e357!.top
  const top417 = byId.e417!.top
  assert.ok(top353 > 0, '03:53 must not sit at grid origin unless startHour=03:53')
  // 03:53 is 53 minutes after 03:00 → top = 53 * (52/60)
  const expected353 = 53 * (AGENDA_HOUR_PX / 60)
  assert.ok(Math.abs(top353 - expected353) < 0.5)
  assert.ok(top357 > top353)
  assert.ok(top417 > top357)
  assert.notEqual(top353, 0)
  console.log('PASS RANGE-05 early events keep real tops (not artificial 0)')
}

function testOverlap01() {
  const events = [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(10), endMs: at(11) },
    { id: 'c', startMs: at(10), endMs: at(11) },
  ]
  for (const view of ['day', 'week'] as const) {
    const items = layoutForView(view, events)
    assert.equal(items[0]!.columnCount, 3)
    assertNoHorizontalOverlay(items)
  }
  console.log('PASS OVERLAP-01 same-time')
}

function testOverlap02() {
  const items = layoutForView('day', [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(10, 30), endMs: at(11, 30) },
    { id: 'c', startMs: at(10, 45), endMs: at(11, 15) },
  ])
  assert.equal(new Set(items.map((i) => i.collisionGroupId)).size, 1)
  assertNoHorizontalOverlay(items)
  console.log('PASS OVERLAP-02 partial')
}

function testOverlap03() {
  assert.equal(intervalsOverlap(at(10), at(11), at(11), at(12)), false)
  const items = layoutForView('week', [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(11), endMs: at(12) },
  ])
  assert.notEqual(items[0]!.collisionGroupId, items[1]!.collisionGroupId)
  console.log('PASS OVERLAP-03 adjacent')
}

function testDomGeometryAfterFix() {
  const events = [
    { id: 'e353', startMs: at(3, 53), endMs: at(4, 23) },
    { id: 'e357', startMs: at(3, 57), endMs: at(4, 27) },
    { id: 'e417', startMs: at(4, 17), endMs: at(4, 47) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  const items = layoutForView('day', events, range)
  const boxes = simulateEventBoundingBoxes(items, {
    containerWidthPx: 640,
    containerLeftPx: 100,
    containerTopPx: 200,
  })
  const containerRight = 100 + 640
  for (const box of boxes) {
    assert.ok(box.left >= 100 - 0.5)
    assert.ok(box.right <= containerRight + 0.5)
  }
  assertNoVisualOverlay(boxes)
  // Distinct vertical origins (03:53 vs 04:17)
  const t353 = boxes.find((b) => b.id === 'e353')!
  const t417 = boxes.find((b) => b.id === 'e417')!
  assert.ok(t417.top > t353.top + 10)
  // Overlapping pair must split horizontally
  const a = boxes.find((b) => b.id === 'e353')!
  const b = boxes.find((b) => b.id === 'e357')!
  assert.ok(a.right <= b.left + 1 || b.right <= a.left + 1)
  console.log(
    'DOM AFTER: startHour=03; tops diverge; boxes inside container; overlapping pair side-by-side',
  )
  console.log('PASS DOM geometry (simulated getBoundingClientRect)')
}

function testHighDensityFits() {
  const events = Array.from({ length: 5 }, (_, i) => ({
    id: `h${i}`,
    startMs: at(10),
    endMs: at(11),
  }))
  const items = layoutForView('day', events)
  assert.ok(layoutFitsDayColumn(items))
  assertNoVisualOverlay(simulateEventBoundingBoxes(items, { containerWidthPx: 640 }))
  console.log('PASS HIGH DENSITY no overflow')
}

documentBeforeRootCause()
testRange01Default()
testRange02EarlyEvent()
testRange03LateEvent()
testRange04WeekSharedRange()
testRange05NoArtificialTopZero()
testOverlap01()
testOverlap02()
testOverlap03()
testDomGeometryAfterFix()
testHighDensityFits()
console.log('Agenda range/overlap/DOM geometry tests OK')
