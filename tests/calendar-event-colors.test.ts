import { describe, expect, it } from 'vitest'

import { toFullCalendarEvent } from '../src/features/calendar/calendarEvents'

const event = {
  id: 'colored-event',
  summary: 'Calendar event',
  start: { date: '2026-11-19' },
  end: { date: '2026-11-20' },
}

describe('calendar event text colors', () => {
  it.each([
    ['red', '#dc2127', '#ffffff'],
    ['pink', '#ff887c', '#1d1d1d'],
    ['orange', '#ffb878', '#1d1d1d'],
    ['yellow', '#fbd75b', '#1d1d1d'],
  ])('keeps %s events readable without changing their background', (_name, background, expectedText) => {
    const mapped = toFullCalendarEvent(
      { ...event, colorId: 'selected' },
      { background: '#123456', foreground: '#ffffff' },
      { selected: { background, foreground: '#1d1d1d' } },
    )

    expect(mapped.color).toBe(background)
    expect(mapped.contrastColor).toBe(expectedText)
  })

  it('corrects insufficient contrast for the inherited calendar color too', () => {
    const mapped = toFullCalendarEvent(
      event,
      { background: '#123456', foreground: '#1d1d1d' },
      {},
    )

    expect(mapped.color).toBe('#123456')
    expect(mapped.contrastColor).toBe('#ffffff')
  })

  it('uses dark text when a light background is paired with white text', () => {
    const mapped = toFullCalendarEvent(
      event,
      { background: '#fbd75b', foreground: '#ffffff' },
      {},
    )

    expect(mapped.contrastColor).toBe('#000000')
  })

  it('preserves a readable custom foreground supplied by Google', () => {
    const mapped = toFullCalendarEvent(
      event,
      { background: '#123456', foreground: '#f0e68c' },
      {},
    )

    expect(mapped.contrastColor).toBe('#f0e68c')
  })
})
