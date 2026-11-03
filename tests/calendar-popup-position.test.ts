import { describe, expect, it } from 'vitest'

import { getCalendarPopupPosition } from '../src/features/calendar/calendarPopupPosition'

describe('calendar popup placement', () => {
  it('keeps a popup for the rightmost event inside the application viewport', () => {
    const position = getCalendarPopupPosition(
      { left: 984, right: 1097, top: 237, bottom: 255 },
      { width: 300, height: 208 },
      { width: 1100, height: 950 },
      1100,
    )

    expect(position.left).toBeGreaterThanOrEqual(20)
    expect(position.left + 300).toBeLessThanOrEqual(1080)
    expect(position.top).toBe(255)
    expect(position.above).toBe(false)
  })

  it('places a popup above an event near the bottom edge', () => {
    const position = getCalendarPopupPosition(
      { left: 400, right: 500, top: 820, bottom: 840 },
      { width: 300, height: 250 },
      { width: 1100, height: 950 },
    )

    expect(position.above).toBe(true)
    expect(position.top + 250).toBeLessThanOrEqual(820)
  })

  it('clamps both axes when a large description fills a small viewport', () => {
    const position = getCalendarPopupPosition(
      { left: 5, right: 100, top: 20, bottom: 40 },
      { width: 240, height: 260 },
      { width: 280, height: 300 },
    )

    expect(position.left).toBe(20)
    expect(position.top).toBe(20)
  })
})
