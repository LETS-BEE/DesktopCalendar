import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCalendarRefreshScheduler } from '../src/features/calendar/calendarRefreshScheduler'

afterEach(() => {
  vi.useRealTimers()
})

describe('calendar refresh scheduler', () => {
  it('refreshes on the interval and while coming back online', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const scheduler = createCalendarRefreshScheduler(refresh)

    scheduler.start(2)
    vi.advanceTimersByTime(4_000)
    window.dispatchEvent(new Event('online'))

    expect(refresh).toHaveBeenCalledTimes(3)

    scheduler.stop()
    vi.advanceTimersByTime(4_000)
    window.dispatchEvent(new Event('online'))

    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('replaces the existing interval when the setting changes', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const scheduler = createCalendarRefreshScheduler(refresh)

    scheduler.start(10)
    scheduler.update(1)
    vi.advanceTimersByTime(2_000)

    expect(refresh).toHaveBeenCalledTimes(2)
    scheduler.stop()
  })
})
