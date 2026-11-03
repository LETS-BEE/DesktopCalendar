import { createPinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SetCalendar from '../src/pages/settings/components/setCalendar.vue'
import { useDeskCalStore } from '../src/stores/desktopCalendar'

const { desktopApi } = vi.hoisted(() => ({
  desktopApi: {
    getCalendarList: vi.fn(),
    getProgramSize: vi.fn(),
    setProgramSize: vi.fn(),
    saveCalendarList: vi.fn(),
    requestReloadCalendar: vi.fn(),
    sendMainSettingData: vi.fn(),
    onCalendarListReset: vi.fn(() => vi.fn()),
  },
}))

vi.mock('../src/services/desktopApi', () => ({ desktopApi }))
vi.mock('@ckpack/vue-color', () => ({ Sketch: { template: '<div />' } }))

const calendars = [{ id: 'work', summary: 'Work', checked: true }]
const frames = new Map<number, FrameRequestCallback>()
let nextFrame = 0
let wrapper: VueWrapper | undefined

const mountSettings = () => {
  wrapper = mount(SetCalendar, {
    global: { provide: { DeskCalStore: useDeskCalStore(createPinia()) } },
  })
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  frames.clear()
  nextFrame = 0
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  desktopApi.getCalendarList.mockResolvedValue(calendars)
  desktopApi.getProgramSize.mockResolvedValue({ window: [1500, 950], displayArea: [1920, 1080] })
  desktopApi.saveCalendarList.mockResolvedValue(undefined)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

describe('calendar settings', () => {
  it('initializes size controls while the calendar list is still loading', async () => {
    desktopApi.getCalendarList.mockReturnValue(new Promise(() => {}))
    const settings = mountSettings()
    await flushPromises()

    const width = settings.get('input[type=range][min="1024"]')
    expect(width.attributes('disabled')).toBeUndefined()
    expect(width.attributes('max')).toBe('1920')
    expect((width.element as HTMLInputElement).value).toBe('1500')
    expect(desktopApi.setProgramSize).not.toHaveBeenCalled()
  })

  it('applies only the latest slider values within one animation frame', async () => {
    const settings = mountSettings()
    await flushPromises()
    const width = settings.get('input[type=range][min="1024"]')

    ;(width.element as HTMLInputElement).value = '1200'
    await width.trigger('input')
    ;(width.element as HTMLInputElement).value = '1300'
    await width.trigger('input')

    expect(frames.size).toBe(1)
    expect(desktopApi.setProgramSize).not.toHaveBeenCalled()
    const [id, callback] = [...frames][0]
    frames.delete(id)
    callback(0)

    expect(desktopApi.setProgramSize).toHaveBeenCalledExactlyOnceWith(1300, 950)
  })

  it('flushes the final size when settings close before the next animation frame', async () => {
    const settings = mountSettings()
    await flushPromises()
    const width = settings.get('input[type=range][min="1024"]')
    ;(width.element as HTMLInputElement).value = '1280'
    await width.trigger('input')

    settings.unmount()
    wrapper = undefined

    expect(desktopApi.setProgramSize).toHaveBeenCalledExactlyOnceWith(1280, 950)
    expect(frames.size).toBe(0)
  })

  it('waits for the selected calendars to be persisted before requesting a reload', async () => {
    let completeSave!: () => void
    desktopApi.saveCalendarList.mockReturnValue(new Promise<void>((resolve) => { completeSave = resolve }))
    const settings = mountSettings()
    await flushPromises()
    const apply = settings.findAll('button').find((button) => button.text() === '적용')!
    await apply.trigger('click')

    expect(desktopApi.saveCalendarList).toHaveBeenCalledOnce()
    expect(desktopApi.requestReloadCalendar).not.toHaveBeenCalled()

    completeSave()
    await flushPromises()

    expect(desktopApi.requestReloadCalendar).toHaveBeenCalledOnce()
  })
})
