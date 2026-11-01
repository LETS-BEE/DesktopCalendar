import { defineStore } from 'pinia'

export interface RgbaColor {
    r: number
    g: number
    b: number
    a: number
}

export interface DesktopCalendarOptions {
    timeMoment: string
    timerStyle: {
        color: string
        weight: string | number
        size: string | number
    }
    calendar: {
        background: RgbaColor
        color: RgbaColor
        buttonType: string
    }
    calendarType: string
    calendarHeight: string | number
    refreshTime: string | number
}

interface DesktopCalendarState {
    options: DesktopCalendarOptions
}

const LS_STORE_NAME = 'DeskCalSettings'

const getDefaultSettings = (): DesktopCalendarOptions => ({
    timeMoment: 'LTS',
    timerStyle: {
        color: 'black',
        weight: '600',
        size: '6em'
    },
    calendar: {
        background: {
            r: 255,
            g: 255,
            b: 255,
            a: 0.3
        },
        color: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        },
        buttonType: 'primary'
    },
    calendarType: 'week',
    calendarHeight: '1.0',
    refreshTime: 600
})

const getSettings = (): DesktopCalendarOptions => {
    const settings = localStorage.getItem(LS_STORE_NAME)

    return settings ? JSON.parse(settings) : getDefaultSettings()
}

const saveSettings = (options: DesktopCalendarOptions) => {
    localStorage.setItem(LS_STORE_NAME, JSON.stringify(options))
}

export const useDeskCalStore = defineStore('DesktopCalendar-Property', {
    state: (): DesktopCalendarState => ({
        options: getSettings()
    }),
    getters: {
        getOptions: (state) => {
            return <Key extends keyof DesktopCalendarOptions>(key: Key): DesktopCalendarOptions[Key] =>
                state.options[key]
        },
        getAll: (state) => state.options
    },
    actions: {
        setOption<Key extends keyof DesktopCalendarOptions>(
            key: Key,
            value: DesktopCalendarOptions[Key]
        ) {
            this.options[key] = value
            saveSettings(this.options)
        },
        setOptions(payload: any) {
            this.options[payload.key as keyof DesktopCalendarOptions] = payload.value
            saveSettings(this.options)
        },
        setAll(payload: DesktopCalendarOptions) {
            this.options = payload
            saveSettings(this.options)
        }
    }
})

export type DesktopCalStore = ReturnType<typeof useDeskCalStore>
