export const IPC_CHANNELS = {
  enableMouse: 'enableMouse',
  disableMouse: 'disableMouse',
  googleLoginAuth: 'googleLoginAuth',
  saveCalendarList: 'saveCalendarList',
  getCalendarColor: 'getCalendarColor',
  getCalendarEvents: 'getCalendarEvents',
  getBatchCalendarEvents: 'getBatchCalendarEvents',
  justGoogleAuth: 'justGoogleAuth',
  setAutoStartProgram: 'setAutoStartProgram',
  getAutoStartProgram: 'getAutoStartProgram',
  saveNoteMemo: 'saveNoteMemo',
  getNoteMemo: 'getNoteMemo',
  openExternalLink: 'openExternalLink',
  getCalendarList: 'getCalendarList',
  deleteCalEvent: 'deleteCalEvent',
  insertCalEvent: 'insertCalEvent',
  openSettingWindow: 'openSettingWindow',
  getAppVersion: 'getAppVersion',
  deleteToken: 'deleteToken',
  restartApp: 'restartApp',
  settingEnd: 'setting-end',
  sendMainSettingData: 'sendMainSettingData',
  setWindowSize: 'setWindowSize',
  getWindowSize: 'getWindowSize',
  requestReloadCalendar: 'requstReloadCalendar',
  authChanged: 'isAuthed',
  calendarListChanged: 'CalendarList',
  calendarListReset: 'resetCalendarList',
  settingDataChanged: 'getSettingData',
  settingWindowClosed: 'setWinClosed',
} as const

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]

export interface WindowSizePayload {
  width: number
  height: number
}

export interface WindowSizeInfo {
  window: [number, number]
  displayArea: [number, number]
}

export interface CalendarEventsQuery {
  calendarId: string
  start: string
  end: string
}

export interface BatchCalendarEventsQuery {
  calendarIds: string[]
  start: string
  end: string
}

export interface DeleteCalendarEventPayload {
  calendarId: string
  eventId: string
}

export interface InsertCalendarEventPayload {
  calendarId: string
  allDay: boolean
  start: string
  end: string
  title: string
  content: string
  colorId: number
}

export interface SettingDataPayload {
  key: string
  value: string
}

export interface CalendarListEntry extends Record<string, unknown> {
  id?: string
  checked?: boolean
  isprimary?: boolean
  primary?: boolean
}

export type CalendarList = CalendarListEntry[]
export type CalendarEventBatch = Record<string, unknown>
export type Unsubscribe = () => void

export interface DesktopCalendarApi {
  window: {
    enableMouse(): void
    disableMouse(): void
    setSize(payload: WindowSizePayload): void
    getSize(): Promise<WindowSizeInfo>
    onSettingWindowClosed(listener: () => void): Unsubscribe
  }
  google: {
    login(): void
    isAuthorized(): Promise<boolean>
    deleteToken(): void
    getCalendarList(): Promise<CalendarList | null>
    saveCalendarList(calendarList: CalendarList): void
    getCalendarColor(): Promise<unknown>
    getCalendarEvents(query: CalendarEventsQuery): Promise<unknown>
    getBatchCalendarEvents(query: BatchCalendarEventsQuery): Promise<CalendarEventBatch>
    deleteCalendarEvent(payload: DeleteCalendarEventPayload): Promise<unknown>
    insertCalendarEvent(payload: InsertCalendarEventPayload): Promise<unknown>
    onAuthChanged(listener: (isAuthorized: boolean) => void): Unsubscribe
    onCalendarListChanged(listener: (calendarList: CalendarList) => void): Unsubscribe
    onCalendarListReset(listener: (calendarList: CalendarList) => void): Unsubscribe
  }
  settings: {
    open(): void
    completeSetup(): void
    sendToMain(payload: SettingDataPayload): void
    onChanged(listener: (payload: SettingDataPayload) => void): Unsubscribe
  }
  app: {
    getVersion(): Promise<string>
    getAutoStart(): Promise<boolean>
    setAutoStart(enabled: boolean): void
    restart(): void
    openExternal(url: string): void
    requestCalendarReload(): void
    onCalendarReloadRequested(listener: () => void): Unsubscribe
  }
  memo: {
    get(): Promise<string>
    save(memo: string): void
  }
}
