/**
 * Agenda day/week overlap layout tests
 * Run: npx tsx scripts/test-agenda-overlap-layout.ts
 */
import assert from 'node:assert/strict'
import {
  intervalsOverlap,
  layoutFitsDayColumn,
  layoutOverlappingEvents,
} from '../src/features/agenda/utils/agendaOverlapLayout.ts'

function at(hour: number, minute = 0): number {
  return new Date(2026, 3, 10, hour, minute, 0, 0).getTime()
}

/** Same entry used conceptually by Day + Week via layoutTimedEvents → columns. */
function layoutForView(view: 'day' | 'week', events: Array<{ id: string; startMs: number; endMs: number }>) {
  return layoutOverlappingEvents(events, {
    strategy: 'columns',
    gutterPct: view === 'day' ? 1.2 : 0.8,
    edgeInsetPct: view === 'day' ? 1.5 : 1,
  })
}

function assertNoHorizontalOverlay(items: ReturnType<typeof layoutOverlappingEvents>) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i]!
      const b = items[j]!
      if (!intervalsOverlap(a.startMs, a.endMs, b.startMs, b.endMs)) continue
      const aRight = a.leftPct + a.widthPct
      const bRight = b.leftPct + b.widthPct
      const horizontalOverlap = a.leftPct < bRight - 0.05 && b.leftPct < aRight - 0.05
      assert.equal(
        horizontalOverlap,
        false,
        `overlay ${a.id}@${a.columnIndex} vs ${b.id}@${b.columnIndex}`,
      )
    }
  }
}

function testOverlap01SameTimeThreeColumns() {
  for (const view of ['day', 'week'] as const) {
    const items = layoutForView(view, [
      { id: 'a', startMs: at(10), endMs: at(11) },
      { id: 'b', startMs: at(10), endMs: at(11) },
      { id: 'c', startMs: at(10), endMs: at(11) },
    ])
    assert.equal(items.length, 3)
    assert.ok(items.every((item) => item.columnCount === 3))
    assert.equal(new Set(items.map((item) => item.columnIndex)).size, 3)
    assertNoHorizontalOverlay(items)
    assert.ok(layoutFitsDayColumn(items))
  }
  console.log('PASS OVERLAP-01 3 identical → 3 columns (day+week)')
}

function testOverlap02PartialSameGroup() {
  const items = layoutForView('day', [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(10, 30), endMs: at(11, 30) },
    { id: 'c', startMs: at(10, 45), endMs: at(11, 15) },
  ])
  assert.equal(new Set(items.map((item) => item.collisionGroupId)).size, 1)
  assertNoHorizontalOverlay(items)
  console.log('PASS OVERLAP-02 partial → same collision group')
}

function testOverlap03AdjacentSeparate() {
  assert.equal(intervalsOverlap(at(10), at(11), at(11), at(12)), false)
  const items = layoutForView('week', [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(11), endMs: at(12) },
  ])
  assert.notEqual(items[0]!.collisionGroupId, items[1]!.collisionGroupId)
  assert.equal(items[0]!.columnCount, 1)
  assert.equal(items[1]!.columnCount, 1)
  console.log('PASS OVERLAP-03 adjacent → separate groups')
}

function testOverlap04LongPlusShorts() {
  const items = layoutForView('day', [
    { id: 'long', startMs: at(10), endMs: at(13) },
    { id: 's1', startMs: at(10, 15), endMs: at(10, 45) },
    { id: 's2', startMs: at(11, 15), endMs: at(11, 45) },
    { id: 's3', startMs: at(12, 15), endMs: at(12, 45) },
  ])
  assertNoHorizontalOverlay(items)
  assert.ok(layoutFitsDayColumn(items))
  console.log('PASS OVERLAP-04 long + shorts → no overlay')
}

function testOverlap05HighDensity() {
  const events = Array.from({ length: 5 }, (_, index) => ({
    id: `e${index}`,
    startMs: at(10),
    endMs: at(11),
  }))
  for (const view of ['day', 'week'] as const) {
    const items = layoutForView(view, events)
    assert.equal(items[0]!.columnCount, 5)
    assertNoHorizontalOverlay(items)
    assert.ok(layoutFitsDayColumn(items))
  }
  console.log('PASS OVERLAP-05 5 events within width (day+week)')
}

function testOverlap06MobileColumnsNoStack() {
  const events = Array.from({ length: 4 }, (_, index) => ({
    id: `m${index}`,
    startMs: at(10),
    endMs: at(11),
  }))
  // Compact path must still use columns (not peek) so cards do not stack.
  const items = layoutOverlappingEvents(events, {
    strategy: 'columns',
    gutterPct: 0.8,
    edgeInsetPct: 1,
  })
  assertNoHorizontalOverlay(items)
  assert.ok(layoutFitsDayColumn(items))
  assert.ok(items.every((item) => item.widthPct > 0))
  console.log('PASS OVERLAP-06 mobile columns → no critical overlap/overflow')
}

function testOverlap07DayWeekSameCriterion() {
  const events = [
    { id: 'a', startMs: at(10), endMs: at(11) },
    { id: 'b', startMs: at(10, 30), endMs: at(11, 30) },
  ]
  const day = layoutForView('day', events)
  const week = layoutForView('week', events)
  assert.equal(day[0]!.columnIndex, week[0]!.columnIndex)
  assert.equal(day[1]!.columnIndex, week[1]!.columnIndex)
  assert.equal(day[0]!.columnCount, week[0]!.columnCount)
  assert.equal(day[0]!.collisionGroupId, week[0]!.collisionGroupId)
  console.log('PASS OVERLAP-07 day+week same collision criterion')
}

testOverlap01SameTimeThreeColumns()
testOverlap02PartialSameGroup()
testOverlap03AdjacentSeparate()
testOverlap04LongPlusShorts()
testOverlap05HighDensity()
testOverlap06MobileColumnsNoStack()
testOverlap07DayWeekSameCriterion()
console.log('Agenda overlap layout tests OK')
