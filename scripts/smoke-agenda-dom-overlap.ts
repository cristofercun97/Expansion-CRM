/**
 * Generates a static HTML fixture + validates real browser getBoundingClientRect
 * via Playwright (ephemeral). Run: npx vite-node scripts/smoke-agenda-dom-overlap.ts
 */
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import {
  AGENDA_HOUR_PX,
  resolveAgendaVisibleHourRange,
} from '../src/features/agenda/utils/agendaCalendarUi'
import { layoutTimedEvents } from '../src/features/agenda/utils/agendaTimedEventLayout'

function at(hour: number, minute = 0): number {
  return new Date(2026, 3, 10, hour, minute, 0, 0).getTime()
}

async function main() {
  const events = [
    { id: 'e353', startMs: at(3, 53), endMs: at(4, 23) },
    { id: 'e357', startMs: at(3, 57), endMs: at(4, 27) },
    { id: 'e417', startMs: at(4, 17), endMs: at(4, 47) },
  ]

  const range = resolveAgendaVisibleHourRange(events)
  assert.equal(range.startHour, 3)

  const layouts = layoutTimedEvents(events, {
    gridStartHour: range.startHour,
    gridEndHour: range.endHour,
  })

  const height = (range.endHour - range.startHour) * AGENDA_HOUR_PX
  const blocks = layouts
    .map(
      (l) => `
    <button data-meeting-id="${l.id}" data-testid="agenda-event-${l.id}"
      data-top="${l.top}" data-column-index="${l.columnIndex}" data-column-count="${l.columnCount}"
      style="position:absolute;box-sizing:border-box;top:${l.top}px;height:${l.height}px;left:${l.leftPct}%;width:${l.widthPct}%;
             background:rgba(16,185,129,0.35);border:1px solid rgba(52,211,153,0.8);overflow:hidden;color:#fff;font:12px sans-serif;">
      ${l.id}
    </button>`,
    )
    .join('')

  const html = `<!doctype html>
<html><body style="margin:0;background:#0b1c1c">
<div id="container" data-testid="agenda-day-events" data-grid-start-hour="${range.startHour}"
  style="position:relative;width:640px;height:${height}px;margin:40px;background:#132222;overflow:hidden;">
  ${blocks}
</div>
</body></html>`

  const dir = resolve('tmp-agenda-dom-smoke')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, 'index.html')
  writeFileSync(file, html)

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  })
  const page = await browser.newPage()
  await page.goto(`file://${file}`)

  const report = await page.evaluate(() => {
    const container = document.getElementById('container')!
    const crect = container.getBoundingClientRect()
    const style = getComputedStyle(container)
    const events = [...container.querySelectorAll('[data-meeting-id]')].map((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el as HTMLElement)
      return {
        id: el.getAttribute('data-meeting-id'),
        rect: {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
        },
        computed: {
          position: cs.position,
          top: cs.top,
          left: cs.left,
          width: cs.width,
          height: cs.height,
          transform: cs.transform,
          overflow: cs.overflow,
          zIndex: cs.zIndex,
        },
        dataTop: Number((el as HTMLElement).dataset.top),
      }
    })
    return {
      container: {
        rect: {
          top: crect.top,
          left: crect.left,
          right: crect.right,
          width: crect.width,
          height: crect.height,
        },
        position: style.position,
        overflow: style.overflow,
        startHour: Number(container.getAttribute('data-grid-start-hour')),
      },
      events,
    }
  })

  await browser.close()

  assert.equal(report.container.startHour, 3)
  assert.equal(report.container.position, 'relative')
  assert.equal(report.events.length, 3)

  const byId = Object.fromEntries(report.events.map((e) => [e.id, e]))
  const a = byId.e353!
  const b = byId.e357!
  const c = byId.e417!

  // Not clamped to container top (08:00 artifact would put all near crect.top)
  assert.ok(a.rect.top > report.container.rect.top + 20, '03:53 must sit below 03:00 origin padding')
  assert.ok(c.rect.top > a.rect.top + 10, '04:17 below 03:53')

  // Horizontal split for overlapping pair
  const horizontalOk = a.rect.right <= b.rect.left + 1 || b.rect.right <= a.rect.left + 1
  assert.ok(horizontalOk, 'overlapping early events must not share the same x band')

  for (const ev of report.events) {
    assert.ok(ev.rect.left >= report.container.rect.left - 0.5)
    assert.ok(ev.rect.right <= report.container.rect.right + 0.5)
    assert.equal(ev.computed.position, 'absolute')
  }

  console.log('DOM AFTER (Playwright getBoundingClientRect):')
  console.log(JSON.stringify(report, null, 2))
  console.log('PASS DOM/browser smoke')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
