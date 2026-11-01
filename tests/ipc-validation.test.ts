import { describe, expect, it } from 'vitest'

import {
  parseExternalUrl,
  parseInsertCalendarEvent,
  parseWindowSize,
} from '../electron/ipc/validation'

describe('IPC payload validation', () => {
  it('normalizes a typed window-size payload', () => {
    expect(parseWindowSize({ width: 800.4, height: 600.6 })).toEqual({
      width: 800,
      height: 601,
    })
  })

  it('rejects invalid window dimensions', () => {
    expect(() => parseWindowSize({ width: 0, height: 600 })).toThrow(RangeError)
    expect(() => parseWindowSize({ width: Number.NaN, height: 600 }))
      .toThrow(TypeError)
  })

  it('allows only approved Google HTTPS links', () => {
    expect(parseExternalUrl('https://calendar.google.com/calendar/u/0/r'))
      .toBe('https://calendar.google.com/calendar/u/0/r')
    expect(() => parseExternalUrl('http://calendar.google.com/'))
      .toThrow(TypeError)
    expect(() => parseExternalUrl('https://calendar.google.com.evil.test/'))
      .toThrow(TypeError)
  })

  it('accepts the typed calendar-event contract', () => {
    const payload = {
      calendarId: 'primary',
      allDay: false,
      start: '2026-07-26T01:00:00.000Z',
      end: '2026-07-26T02:00:00.000Z',
      title: 'Review',
      content: '',
      colorId: 3,
    }

    expect(parseInsertCalendarEvent(payload)).toEqual(payload)
  })
})
