import type { BrowserWindow } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WindowManager } from '../electron/windows/window-manager'

const { app, saveBounds } = vi.hoisted(() => ({
  app: { on: vi.fn() },
  saveBounds: vi.fn(),
}))

vi.mock('electron', () => ({
  app,
  BrowserWindow: vi.fn(),
  screen: {
    on: vi.fn(),
    getDisplayMatching: () => ({ id: 1, scaleFactor: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
  },
  shell: {},
  Tray: vi.fn(),
  Menu: {},
  Notification: vi.fn(),
}))
vi.mock('../electron/persistence/app-data', () => ({
  calendarFileExists: vi.fn(),
  getSavedBounds: vi.fn(),
  saveBounds,
}))

const createWindows = () => {
  let bounds = { x: 0, y: 0, width: 1500, height: 950 }
  const window = {
    getBounds: () => ({ ...bounds }),
    setBounds: vi.fn((next: typeof bounds) => { bounds = { ...next } }),
  }
  const windows = new WindowManager({ preloadPath: '', rendererDist: '', publicPath: '' })
  Object.assign(windows, { mainWindow: window as unknown as BrowserWindow })
  return { windows, window }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => vi.useRealTimers())

describe('window size persistence', () => {
  it('resizes immediately while persisting only the final bounds after a drag', () => {
    const { windows, window } = createWindows()
    windows.setMainWindowSize(1200, 950)
    windows.setMainWindowSize(1300, 950)
    windows.setMainWindowSize(1400, 950)

    expect(window.setBounds).toHaveBeenCalledTimes(3)
    expect(saveBounds).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)

    expect(saveBounds).toHaveBeenCalledExactlyOnceWith({ x: 0, y: 0, width: 1400, height: 950 })
  })

  it('flushes pending bounds on quit without writing them a second time', () => {
    const { windows } = createWindows()
    windows.setMainWindowSize(1280, 900)
    const beforeQuit = app.on.mock.calls.find(([event]) => event === 'before-quit')![1]
    beforeQuit()
    vi.advanceTimersByTime(250)

    expect(saveBounds).toHaveBeenCalledExactlyOnceWith({ x: 0, y: 0, width: 1280, height: 900 })
  })

  it('does not resize or save when the requested dimensions are unchanged', () => {
    const { windows, window } = createWindows()
    windows.setMainWindowSize(1500, 950)
    vi.advanceTimersByTime(250)

    expect(window.setBounds).not.toHaveBeenCalled()
    expect(saveBounds).not.toHaveBeenCalled()
  })
})
