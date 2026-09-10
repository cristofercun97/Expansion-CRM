/**
 * Agenda week overlap layout tests
 * Run: npx tsx scripts/test-agenda-overlap-layout.ts
 */
import assert from 'node:assert/strict'
import {
  intervalsOverlap,
  layoutFitsDayColumn,
  layoutOverlappingEvents,
} from '../src/features/agenda/utils/agendaOverlapLayout.ts'

const DAY = Date.UTC(2026, 3, 10)

function at(hour: number, minute = 0): number {
  // Local-wall-clock via Date components (layout uses getHours/getMinutes).
  return new Date(2026, 3, 10, hour, minute, 0, 0).getTime()
}

function testOverlap01SameTimeThreeColumns() {
  const items = layoutOverlappingEvents(
    [
      { id: 'a', startMs: at(10), endMs: at(11) },
      { id: 'b', startMs: at(10), endMs: at(11) },
      { id: 'c', startMs: at(10), endMs: at(11) },
    ],
    { strategy: 'columns' },
  )
  assert.equal(items.length, 3)
  assert.equal(items[0]!.columnCount, 3)
  assert.equal(items[1]!.columnCount, 3)
  assert.equal(items[2]!.columnCount, 3)
  const indexes = new Set(items.map((item) => item.columnIndex))
  assert.equal(indexes.size, 3)
  assert.ok(layoutFitsDayColumn(items))
  console.log('PASS OVERLAP-01 3 identical → 3 columns')
}

function testOverlap02PartialSameGroup() {
  const items = layoutOverlappingEvents(
    [
      { id: 'a', startMs: at(10), endMs: at(11) },
      { id: 'b', startMs: at(10, 30), endMs: at(11, 30) },
      { id: 'c', startMs: at(10, 45), endMs: at(11, 15) },
    ],
    { strategy: 'columns' },
  )
  const groupIds = new Set(items.map((item) => item.collisionGroupId))
  assert.equal(groupIds.size, 1, 'partial overlaps share one collision group')
  assert.ok(items.every((item) => item.columnCount >= 2))
  assert.ok(layoutFitsDayColumn(items))
  // a and b overlap → different columns
  const a = items.find((item) => item.id === 'a')!
  const b = items.find((item) => item.id === 'b')!
  const c = items.find((item) => item.id === 'c')!
  assert.notEqual(a.columnIndex, b.columnIndex)
  assert.ok(new Set([a.columnIndex, b.columnIndex, c.columnIndex]).size >= 2)
  console.log('PASS OVERLAP-02 partial → same collision group')
}

function testOverlap03AdjacentSeparate() {
  assert.equal(intervalsOverlap(at(10), at(11), at(11), at(12)), false)
  const items = layoutOverlappingEvents(
    [
      { id: 'a', startMs: at(10), endMs: at(11) },
      { id: 'b', startMs: at(11), endMs: at(12) },
    ],
    { strategy: 'columns' },
  )
  assert.equal(items[0]!.collisionGroupId !== items[1]!.collisionGroupId, true)
  assert.equal(items[0]!.columnCount, 1)
  assert.equal(items[1]!.columnCount, 1)
  console.log('PASS OVERLAP-03 adjacent → separate groups')
}

function testOverlap04LongPlusShortsNoOverlay() {
  const items = layoutOverlappingEvents(
    [
      { id: 'long', startMs: at(10), endMs: at(13) },
      { id: 's1', startMs: at(10, 15), endMs: at(10, 45) },
      { id: 's2', startMs: at(11, 15), endMs: at(11, 45) },
      { id: 's3', startMs: at(12, 15), endMs: at(12, 45) },
    ],
    { strategy: 'columns' },
  )
  const long = items.find((item) => item.id === 'long')!
  for (const short of items.filter((item) => item.id !== 'long')) {
    assert.notEqual(short.columnIndex, long.columnIndex)
    // Geometry boxes must not share the same left band
    const longRight = long.leftPct + long.widthPct
    const shortRight = short.leftPct + short.widthPct
    const horizontalOverlap =
      short.leftPct < longRight - 0.01 && long.leftPct < shortRight - 0.01
    assert.equal(horizontalOverlap, false)
  }
  assert.ok(layoutFitsDayColumn(items))
  console.log('PASS OVERLAP-04 long + shorts → no visual overlay')
}

function testOverlap05FiveEventsFit() {
  const events = Array.from({ length: 5 }, (_, index) => ({
    id: `e${index}`,
    startMs: at(10),
    endMs: at(11),
  }))
  const items = layoutOverlappingEvents(events, { strategy: 'columns' })
  assert.equal(items[0]!.columnCount, 5)
  assert.ok(layoutFitsDayColumn(items))
  assert.ok(items.every((item) => item.widthPct >= 8))
  console.log('PASS OVERLAP-05 5 events within day width')
}

function testOverlap06MobilePeekNoCriticalOverflow() {
  const events = Array.from({ length: 5 }, (_, index) => ({
    id: `m${index}`,
    startMs: at(10),
    endMs: at(11),
  }))
  const items = layoutOverlappingEvents(events, { strategy: 'peek' })
  assert.ok(layoutFitsDayColumn(items), 'peek layout must fit day column')
  assert.ok(items.every((item) => item.widthPct >= 36))
  assert.ok(items.every((item) => item.leftPct + item.widthPct <= 100.05))
  // unused but keeps day constant referenced for clarity
  assert.ok(DAY)
  console.log('PASS OVERLAP-06 mobile peek → no critical overflow')
}

testOverlap01SameTimeThreeColumns()
testOverlap02PartialSameGroup()
testOverlap03AdjacentSeparate()
testOverlap04LongPlusShortsNoOverlay()
testOverlap05FiveEventsFit()
testOverlap06MobilePeekNoCriticalOverflow()
console.log('Agenda overlap layout tests OK')
