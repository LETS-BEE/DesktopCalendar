import { createPinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Calendar from '../src/pages/main/components/calendar.vue'
import PopupEvents from '../src/pages/main/components/popupEvents.vue'
import { useDeskCalStore } from '../src/stores/desktopCalendar'

const { api, desktopApi } = vi.hoisted(() => ({
  api: {
    el: undefined as HTMLElement | undefined,
    getDate: vi.fn(() => new Date('2026-11-03T00:00:00Z')),
    view: {
      activeStart: new Date('2026-11-01T00:00:00Z'),
      activeEnd: new Date('2026-11-22T00:00:00Z'),
    },
    batchRendering: vi.fn((callback: () => void) => callback()),
    removeAllEvents: vi.fn(),
    addEvent: vi.fn(),
  },
  desktopApi: {
    getCalendarList: vi.fn(),
    getCalendarColors: vi.fn(),
    getBatchCalendarEvents: vi.fn(),
    onSettingWindowClosed: vi.fn(() => vi.fn()),
    onCalendarReloadRequested: vi.fn(() => vi.fn()),
    enableMouse: vi.fn(),
    disableMouse: vi.fn(),
  },
}))

vi.mock('../src/services/desktopApi', () => ({ desktopApi }))
vi.mock('uikit', () => ({
  default: { drop: () => ({ show: vi.fn(), hide: vi.fn() }), heightViewport: vi.fn() },
}))
vi.mock('@toast-ui/editor', () => ({
  default: class {
    setMarkdown = vi.fn()
    destroy = vi.fn()
  },
}))
vi.mock('@vuepic/vue-datepicker', () => ({ VueDatePicker: { template: '<input />' } }))
vi.mock('@fullcalendar/vue3', async () => {
  const { defineComponent, Fragment, h, onMounted, ref } = await import('vue')
  return {
    default: defineComponent({
      inheritAttrs: false,
      setup(_props, { expose }) {
        const element = ref<HTMLElement>()
        expose({ getApi: () => api })
        onMounted(() => { api.el = element.value })
        // FullCalendar 7 has a Fragment root, so its $el is a text node.
        return () => h(Fragment, [h('div', { id: 'calendar', ref: element }), h('span')])
      },
    }),
  }
})

const calendars = [{ id: 'work', summary: 'Work', checked: true, colorId: '1', primary: true }]
const event = {
  id: 'first-event',
  summary: 'Loaded on startup',
  start: { date: '2026-11-03' },
  end: { date: '2026-11-04' },
}
let wrapper: VueWrapper | undefined

const provideStore = () => ({ DeskCalStore: useDeskCalStore(createPinia()) })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  desktopApi.getCalendarColors.mockResolvedValue({
    calendar: { 1: { background: '#123456', foreground: '#ffffff' } },
    event: {},
  })
  desktopApi.getBatchCalendarEvents.mockResolvedValue({ work: { items: [event] } })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('calendar startup', () => {
  it('loads events once the asynchronously loaded calendar list reaches the mounted popup', async () => {
    let resolveList!: (value: typeof calendars) => void
    desktopApi.getCalendarList.mockReturnValue(new Promise((resolve) => { resolveList = resolve }))
    wrapper = mount(Calendar, { global: { provide: provideStore() } })
    await flushPromises()

    expect(desktopApi.getBatchCalendarEvents).not.toHaveBeenCalled()
    expect(api.removeAllEvents).not.toHaveBeenCalled()

    resolveList(calendars)
    await flushPromises()

    expect(desktopApi.getBatchCalendarEvents).toHaveBeenCalledExactlyOnceWith(
      ['work'], expect.any(String), expect.any(String),
    )
    expect(api.addEvent).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'first-event' }))
    expect(api.batchRendering).toHaveBeenCalledOnce()
  })

  it('also waits when the calendar list arrives before the API', async () => {
    wrapper = mount(PopupEvents, {
      props: { calEvent: {}, calendarids: calendars },
      global: { provide: provideStore() },
    })
    await flushPromises()
    expect(desktopApi.getCalendarColors).not.toHaveBeenCalled()

    await wrapper.setProps({ calendarApi: api })
    await flushPromises()

    expect(api.addEvent).toHaveBeenCalledOnce()
  })

  it('does not restore stale events after all calendars are deselected during a request', async () => {
    let resolveEvents!: (value: unknown) => void
    desktopApi.getBatchCalendarEvents.mockReturnValue(new Promise((resolve) => { resolveEvents = resolve }))
    wrapper = mount(PopupEvents, {
      props: { calEvent: {}, calendarids: calendars, calendarApi: api },
      global: { provide: provideStore() },
    })
    await flushPromises()

    await wrapper.setProps({ calendarids: [] })
    resolveEvents({ work: { items: [event] } })
    await flushPromises()

    expect(api.removeAllEvents).toHaveBeenCalledOnce()
    expect(api.addEvent).not.toHaveBeenCalled()
    expect(wrapper.emitted('reloadEnd')).toHaveLength(1)
  })
})
