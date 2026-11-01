import {
  contextBridge,
  ipcRenderer,
  type IpcRendererEvent,
} from 'electron'
import {
  IPC_CHANNELS,
  type CalendarEventBatch,
  type CalendarList,
  type DesktopCalendarApi,
  type WindowSizeInfo,
} from '../shared/ipc'

function subscribe(
  channel: string,
  listener: (...args: any[]) => void,
) {
  const wrapped = (_event: IpcRendererEvent, ...args: any[]) => listener(...args)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

const desktopCalendar: DesktopCalendarApi = {
  window: {
    enableMouse: () => ipcRenderer.send(IPC_CHANNELS.enableMouse),
    disableMouse: () => ipcRenderer.send(IPC_CHANNELS.disableMouse),
    setSize: (payload) => ipcRenderer.send(IPC_CHANNELS.setWindowSize, payload),
    getSize: async () => {
      const response = await ipcRenderer.invoke(IPC_CHANNELS.getWindowSize) as string | WindowSizeInfo
      return typeof response === 'string'
        ? JSON.parse(response) as WindowSizeInfo
        : response
    },
    onSettingWindowClosed: (listener) =>
      subscribe(IPC_CHANNELS.settingWindowClosed, listener),
  },
  google: {
    login: () => ipcRenderer.send(IPC_CHANNELS.googleLoginAuth),
    isAuthorized: () => ipcRenderer.invoke(IPC_CHANNELS.justGoogleAuth) as Promise<boolean>,
    deleteToken: () => ipcRenderer.send(IPC_CHANNELS.deleteToken),
    getCalendarList: () =>
      ipcRenderer.invoke(IPC_CHANNELS.getCalendarList) as Promise<CalendarList | null>,
    saveCalendarList: (calendarList) =>
      ipcRenderer.send(IPC_CHANNELS.saveCalendarList, calendarList),
    getCalendarColor: () => ipcRenderer.invoke(IPC_CHANNELS.getCalendarColor),
    getCalendarEvents: (query) =>
      ipcRenderer.invoke(IPC_CHANNELS.getCalendarEvents, query),
    getBatchCalendarEvents: (query) =>
      ipcRenderer.invoke(IPC_CHANNELS.getBatchCalendarEvents, query) as Promise<CalendarEventBatch>,
    deleteCalendarEvent: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.deleteCalEvent, payload),
    insertCalendarEvent: (payload) =>
      ipcRenderer.invoke(IPC_CHANNELS.insertCalEvent, payload),
    onAuthChanged: (listener) =>
      subscribe(IPC_CHANNELS.authChanged, listener),
    onCalendarListChanged: (listener) =>
      subscribe(IPC_CHANNELS.calendarListChanged, listener),
    onCalendarListReset: (listener) =>
      subscribe(IPC_CHANNELS.calendarListReset, listener),
  },
  settings: {
    open: () => ipcRenderer.send(IPC_CHANNELS.openSettingWindow),
    completeSetup: () => ipcRenderer.send(IPC_CHANNELS.settingEnd),
    sendToMain: (payload) =>
      ipcRenderer.send(IPC_CHANNELS.sendMainSettingData, payload),
    onChanged: (listener) =>
      subscribe(
        IPC_CHANNELS.settingDataChanged,
        (key: string, value: string) => listener({ key, value }),
      ),
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.getAppVersion) as Promise<string>,
    getAutoStart: () =>
      ipcRenderer.invoke(IPC_CHANNELS.getAutoStartProgram) as Promise<boolean>,
    setAutoStart: (enabled) =>
      ipcRenderer.send(IPC_CHANNELS.setAutoStartProgram, enabled),
    restart: () => ipcRenderer.send(IPC_CHANNELS.restartApp),
    openExternal: (url) =>
      ipcRenderer.send(IPC_CHANNELS.openExternalLink, url),
    requestCalendarReload: () =>
      ipcRenderer.send(IPC_CHANNELS.requestReloadCalendar),
    onCalendarReloadRequested: (listener) =>
      subscribe(IPC_CHANNELS.requestReloadCalendar, listener),
  },
  memo: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.getNoteMemo) as Promise<string>,
    save: (memo) => ipcRenderer.send(IPC_CHANNELS.saveNoteMemo, memo),
  },
}

contextBridge.exposeInMainWorld('desktopCalendar', desktopCalendar)
