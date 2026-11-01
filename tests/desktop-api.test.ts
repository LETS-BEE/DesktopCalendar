import { describe, expect, it, vi } from 'vitest'

import type { DesktopCalendarApi } from '../shared/ipc'
import { desktopApi } from '../src/services/desktopApi'

describe('desktop API', () => {
  it('normalizes range input values before sending a window-size payload', () => {
    const setSize = vi.fn()
    Object.defineProperty(window, 'desktopCalendar', {
      configurable: true,
      value: {
        window: { setSize },
      } as unknown as DesktopCalendarApi,
    })

    desktopApi.setProgramSize('1280', '960')

    expect(setSize).toHaveBeenCalledWith({ width: 1280, height: 960 })
  })

  it('does not send invalid window dimensions', () => {
    const setSize = vi.fn()
    Object.defineProperty(window, 'desktopCalendar', {
      configurable: true,
      value: {
        window: { setSize },
      } as unknown as DesktopCalendarApi,
    })

    desktopApi.setProgramSize('not-a-number', 960)

    expect(setSize).not.toHaveBeenCalled()
  })
})
