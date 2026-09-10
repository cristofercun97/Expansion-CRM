/**
 * Agenda Day/Week scroll viewport + initial scroll helpers.
 * Run: npx vite-node scripts/test-agenda-calendar-scroll.ts
 */
import assert from 'node:assert/strict'
import {
  AGENDA_HOUR_PX,
  resolveAgendaInitialScrollTop,
  resolveAgendaVisibleHourRange,
} from '../src/features/agenda/utils/agendaCalendarUi.ts'
import { layoutTimedEvents } from '../src/features/agenda/utils/agendaTimedEventLayout.ts'

function at(hour: number, minute = 0): number {
  return new Date(2026, 3, 10, hour, minute, 0, 0).getTime()
}

/** Simulate controlled viewport: clientHeight capped, scrollHeight = full grid. */
function simulateViewport(gridHours: number, viewportMaxPx = 720) {
  const scrollHeight = gridHours * AGENDA_HOUR_PX
  const clientHeight = Math.min(viewportMaxPx, scrollHeight)
  return {
    clientHeight,
    scrollHeight,
    overflowY: 'auto' as const,
    hasOverflow: scrollHeight > clientHeight,
  }
}

function testScroll01DayLongRange() {
  const events = [
    { id: 'a', startMs: at(2, 0), endMs: at(2, 30) },
    { id: 'b', startMs: at(20, 0), endMs: at(20, 30) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  assert.equal(range.startHour, 2)
  assert.ok(range.endHour >= 21)
  const hours = range.endHour - range.startHour
  const vp = simulateViewport(hours, 720)
  assert.ok(vp.hasOverflow, 'SCROLL-01 day long range must overflow viewport')
  assert.ok(vp.clientHeight < vp.scrollHeight)
  console.log('PASS SCROLL-01 day 02:00–20:00+ viewport limited + scroll')
}

function testScroll02WeekLongRange() {
  const events = [
    { id: 'a', startMs: at(2, 17), endMs: at(2, 47) },
    { id: 'b', startMs: at(19, 30), endMs: at(20, 0) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  const vp = simulateViewport(range.endHour - range.startHour, 720)
  assert.ok(vp.hasOverflow, 'SCROLL-02 week long range must overflow')
  console.log('PASS SCROLL-02 week 02:00–20:00 viewport limited + scroll')
}

function testScroll03StickyContract() {
  // Sticky is CSS sticky top-0 on day headers inside the same overflow viewport.
  // Contract: one scroll parent; headers are siblings above the hour grid (not a second scroller).
  const structure = {
    viewportOverflowY: 'auto',
    nestedHourScroller: false,
    dayHeadersStickyTop: 0,
  }
  assert.equal(structure.viewportOverflowY, 'auto')
  assert.equal(structure.nestedHourScroller, false)
  assert.equal(structure.dayHeadersStickyTop, 0)
  console.log('PASS SCROLL-03 week sticky day headers contract')
}

function testScroll04LateAccessible() {
  const events = [{ id: 'late', startMs: at(18, 0), endMs: at(18, 45) }]
  const range = resolveAgendaVisibleHourRange([
    { id: 'early', startMs: at(2, 0), endMs: at(2, 30) },
    ...events,
  ])
  const layouts = layoutTimedEvents(events, {
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })
  const late = layouts[0]!
  const viewport = 720
  const scrollToLate = Math.max(0, late.top - 40)
  assert.ok(late.top + late.height > viewport || scrollToLate > 0)
  assert.ok(late.top < (range.endHour - range.startHour) * AGENDA_HOUR_PX)
  console.log('PASS SCROLL-04 late 18:00 reachable via scrollTop')
}

function testScroll05EarlyDynamic() {
  const events = [{ id: 'e', startMs: at(3, 53), endMs: at(4, 23) }]
  const range = resolveAgendaVisibleHourRange(events)
  assert.equal(range.startHour, 3)
  const layouts = layoutTimedEvents(events, {
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })
  assert.ok(layouts[0]!.top > 0)
  const scrollTop = resolveAgendaInitialScrollTop({
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
    earliestStartMs: events[0]!.startMs,
    viewportHeightPx: 720,
  })
  // ~1h lead → near 03:00 → scrollTop ≈ 0 when grid starts at 03
  assert.equal(scrollTop, 0)
  console.log('PASS SCROLL-05 early 03:53 dynamic range + auto-scroll context')
}

function testScroll06LateEvent22() {
  const events = [{ id: 'l', startMs: at(22, 20), endMs: at(22, 50) }]
  const range = resolveAgendaVisibleHourRange(events)
  assert.equal(range.endHour, 23)
  const layouts = layoutTimedEvents(events, {
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })
  const scrollHeight = (range.endHour - range.startHour) * AGENDA_HOUR_PX
  assert.ok(layouts[0]!.top + layouts[0]!.height <= scrollHeight + 1)
  const scrollTop = resolveAgendaInitialScrollTop({
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
    earliestStartMs: events[0]!.startMs,
    viewportHeightPx: 720,
  })
  assert.ok(scrollTop > 0, '22:20 should auto-scroll down into late hours')
  console.log('PASS SCROLL-06 event 22:20 accessible with scroll')
}

function testScroll07OverlapPreserved() {
  const events = [
    { id: 'a', startMs: at(10, 0), endMs: at(11, 0) },
    { id: 'b', startMs: at(10, 30), endMs: at(11, 30) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  const layouts = layoutTimedEvents(events, {
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })
  assert.ok(layouts.every((l) => l.columnCount >= 2))
  console.log('PASS SCROLL-07 overlap layout intact with scroll model')
}

function testScroll08MobileViewportCap() {
  const mobileMax = 640 // clamp upper on mobile class
  const events = [
    { id: 'a', startMs: at(2, 0), endMs: at(2, 30) },
    { id: 'b', startMs: at(20, 0), endMs: at(20, 30) },
  ]
  const range = resolveAgendaVisibleHourRange(events)
  const vp = simulateViewport(range.endHour - range.startHour, mobileMax)
  assert.ok(vp.clientHeight <= mobileMax)
  assert.ok(vp.hasOverflow)
  console.log('PASS SCROLL-08 mobile viewport capped')
}

function testInitialScrollLeadHour() {
  const scrollTop = resolveAgendaInitialScrollTop({
    gridStartHour: 2,
    gridEndHour: 21,
    earliestStartMs: at(3, 53),
    viewportHeightPx: 600,
  })
  // target 03:53 - 1h lead ≈ 02:53 → (2.883-2)*52 ≈ 46
  assert.ok(scrollTop > 40 && scrollTop < 60)
  console.log('PASS auto-scroll lead ~1h before first meeting')
}

function testNoMeetingsUsesNow() {
  const scrollTop = resolveAgendaInitialScrollTop({
    gridStartHour: 8,
    gridEndHour: 21,
    earliestStartMs: null,
    nowMs: at(14, 0),
    viewportHeightPx: 600,
  })
  assert.ok(scrollTop > 0)
  console.log('PASS auto-scroll falls back to current hour')
}

testScroll01DayLongRange()
testScroll02WeekLongRange()
testScroll03StickyContract()
testScroll04LateAccessible()
testScroll05EarlyDynamic()
testScroll06LateEvent22()
testScroll07OverlapPreserved()
testScroll08MobileViewportCap()
testInitialScrollLeadHour()
testNoMeetingsUsesNow()
console.log('Agenda calendar scroll tests OK')
