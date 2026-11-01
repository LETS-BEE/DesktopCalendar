import dayjs from 'dayjs'

export type Cleanup = () => void

export interface CalendarListEntry {
    id: string
    summary: string
    accessRole?: string
    colorId?: string
    checked?: boolean
    primary?: boolean
    isprimary?: boolean
    [key: string]: unknown
}

export interface GoogleCalendarColors {
    calendar: Record<string, CalendarColor>
    event: Record<string, CalendarColor>
}

export interface CalendarColor {
    background: string
    foreground: string
}

export interface ProgramSize {
    window: number[]
    displayArea: number[]
}

export const desktopApi = {
    enableMouse() {
        window.desktopCalendar.window.enableMouse()
    },

    disableMouse() {
        window.desktopCalendar.window.disableMouse()
    },

    loginGoogle(callbacks: {
        onAuthChanged: (isAuthed: boolean) => void
        onCalendarList: (calendarList: CalendarListEntry[]) => void
    }): Cleanup {
        const cleanups: Cleanup[] = [
            window.desktopCalendar.google.onAuthChanged(callbacks.onAuthChanged),
            window.desktopCalendar.google.onCalendarListChanged((calendarList) =>
                callbacks.onCalendarList(calendarList as CalendarListEntry[])
            )
        ]
        window.desktopCalendar.google.login()

        return () => cleanups.forEach((cleanup) => cleanup())
    },

    saveCalendarList(calendarList: CalendarListEntry[]) {
        window.desktopCalendar.google.saveCalendarList(calendarList)
    },

    async getCalendarList(): Promise<CalendarListEntry[]> {
        return (await window.desktopCalendar.google.getCalendarList() ?? []) as CalendarListEntry[]
    },

    async getCalendarColors(): Promise<GoogleCalendarColors | null> {
        try {
            const isAuthed = await window.desktopCalendar.google.isAuthorized()
            if (!isAuthed) {
                return null
            }

            return (await window.desktopCalendar.google.getCalendarColor()) as GoogleCalendarColors
        } catch (error) {
            console.error(error)
            return null
        }
    },

    setAutoStartProgram(openAtLogin: boolean) {
        window.desktopCalendar.app.setAutoStart(openAtLogin)
    },

    getAutoStartProgram(): Promise<boolean> {
        return window.desktopCalendar.app.getAutoStart()
    },

    finishSettings() {
        window.desktopCalendar.settings.completeSetup()
    },

    getNoteMemo(): Promise<string> {
        return window.desktopCalendar.memo.get()
    },

    saveNoteMemo(noteMemo: string) {
        window.desktopCalendar.memo.save(noteMemo)
    },

    openExternalLink(link: string) {
        window.desktopCalendar.app.openExternal(link)
    },

    getCalendarEvents(id: string, start: string, end: string): Promise<any> {
        return window.desktopCalendar.google.getCalendarEvents({
            calendarId: id,
            start: dayjs(start).toISOString(),
            end: dayjs(end).toISOString()
        })
    },

    getBatchCalendarEvents(
        ids: string[],
        start: string,
        end: string
    ): Promise<Record<string, any>> {
        return window.desktopCalendar.google.getBatchCalendarEvents({
            calendarIds: ids,
            start: dayjs(start).toISOString(),
            end: dayjs(end).toISOString()
        }) as Promise<Record<string, any>>
    },

    deleteCalendarEvent(email: string, id: string): Promise<any> {
        return window.desktopCalendar.google.deleteCalendarEvent({
            calendarId: email,
            eventId: id
        })
    },

    insertCalendarEvent(
        calendarId: string,
        isAllDay: boolean,
        start: string,
        end: string,
        title: string,
        content: string,
        colorId: number
    ): Promise<any> {
        return window.desktopCalendar.google.insertCalendarEvent({
            calendarId,
            allDay: isAllDay,
            start,
            end,
            title,
            content,
            colorId
        })
    },

    openSettingWindow() {
        window.desktopCalendar.settings.open()
    },

    getAppVersion(): Promise<string> {
        return window.desktopCalendar.app.getVersion()
    },

    sendMainSettingData(key: string, value: unknown) {
        window.desktopCalendar.settings.sendToMain({
            key,
            value: JSON.stringify(value)
        })
    },

    requestReloadCalendar() {
        window.desktopCalendar.app.requestCalendarReload()
    },

    setProgramSize(width: number | string, height: number | string) {
        const normalizedWidth = Number(width)
        const normalizedHeight = Number(height)

        if (
            Number.isFinite(normalizedWidth)
            && Number.isFinite(normalizedHeight)
            && normalizedWidth > 0
            && normalizedHeight > 0
        ) {
            window.desktopCalendar.window.setSize({
                width: normalizedWidth,
                height: normalizedHeight
            })
        }
    },

    async getProgramSize(): Promise<ProgramSize> {
        return window.desktopCalendar.window.getSize()
    },

    deleteToken() {
        window.desktopCalendar.google.deleteToken()
    },

    restartApp() {
        window.desktopCalendar.app.restart()
    },

    onCalendarListReset(listener: (calendarList: CalendarListEntry[]) => void): Cleanup {
        return window.desktopCalendar.google.onCalendarListReset((calendarList) =>
            listener(calendarList as CalendarListEntry[])
        )
    },

    onSettingWindowClosed(listener: () => void): Cleanup {
        return window.desktopCalendar.window.onSettingWindowClosed(listener)
    },

    onCalendarReloadRequested(listener: () => void): Cleanup {
        return window.desktopCalendar.app.onCalendarReloadRequested(listener)
    },

    onSettingData(
        listener: (key: string, value: string) => void
    ): Cleanup {
        return window.desktopCalendar.settings.onChanged(({ key, value }) =>
            listener(key, value)
        )
    }
}
