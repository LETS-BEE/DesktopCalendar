import {
  app,
  ipcMain,
  shell,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
} from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { IPC_CHANNELS } from '../../shared/ipc'
import {
  clearSettings,
  getMemo,
  removeCalendarFile,
  saveMemo,
} from '../persistence/app-data'
import {
  deleteCalendarEvent,
  fetchCalendarList,
  getBatchCalendarEvents,
  getCalendarColors,
  getCalendarEvents,
  getCalendarList,
  insertCalendarEvent,
  saveCalendarList,
} from '../services/google/calendar'
import {
  clearAuthorization,
  ensureAuthorization,
} from '../services/google/oauth'
import type { WindowManager } from '../windows/window-manager'
import {
  parseBatchCalendarEventsQuery,
  parseBoolean,
  parseCalendarEventsQuery,
  parseCalendarList,
  parseDeleteCalendarEvent,
  parseExternalUrl,
  parseInsertCalendarEvent,
  parseMemo,
  parseSettingData,
  parseWindowSize,
} from './validation'

interface RegisterIpcOptions {
  windows: WindowManager
  rendererDist: string
  devServerUrl?: string
}

type MainEvent = IpcMainEvent | IpcMainInvokeEvent

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function createSenderValidator(options: RegisterIpcOptions) {
  const devOrigin = options.devServerUrl
    ? new URL(options.devServerUrl).origin
    : null

  return (event: MainEvent) => {
    if (!options.windows.isManagedWebContentsId(event.sender.id)) {
      return false
    }
    if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) {
      return false
    }

    try {
      const senderUrl = new URL(event.senderFrame.url)
      if (devOrigin) {
        return senderUrl.origin === devOrigin
      }
      return senderUrl.protocol === 'file:'
        && isPathInside(options.rendererDist, fileURLToPath(senderUrl))
    } catch {
      return false
    }
  }
}

export function registerIpcHandlers(options: RegisterIpcOptions) {
  const isTrustedSender = createSenderValidator(options)

  const on = (
    channel: string,
    listener: (event: IpcMainEvent, ...args: unknown[]) => void | Promise<void>,
  ) => {
    ipcMain.on(channel, (event, ...args) => {
      if (!isTrustedSender(event)) {
        console.warn(`Rejected IPC message on ${channel}`)
        return
      }
      void Promise.resolve(listener(event, ...args))
        .catch((error) => console.error(`IPC ${channel} failed`, error))
    })
  }

  const handle = (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => {
    ipcMain.handle(channel, async (event, ...args) => {
      if (!isTrustedSender(event)) {
        throw new Error('IPC sender is not trusted')
      }
      return listener(event, ...args)
    })
  }

  on(IPC_CHANNELS.enableMouse, () => {
    options.windows.setIgnoreMouseEvents(false)
  })
  on(IPC_CHANNELS.disableMouse, () => {
    options.windows.setIgnoreMouseEvents(true)
  })
  on(IPC_CHANNELS.googleLoginAuth, async (event) => {
    try {
      await ensureAuthorization(true)
      const calendarList = await fetchCalendarList()
      event.reply(IPC_CHANNELS.calendarListChanged, calendarList)
      event.reply(IPC_CHANNELS.authChanged, true)
    } catch (error) {
      console.error('Google login failed', error)
      event.reply(IPC_CHANNELS.authChanged, false)
    }
  })
  on(IPC_CHANNELS.saveCalendarList, async (_event, data) => {
    await saveCalendarList(parseCalendarList(data))
  })
  handle(IPC_CHANNELS.getCalendarColor, () => getCalendarColors())
  handle(IPC_CHANNELS.getCalendarEvents, (_event, ...args) => {
    const query = parseCalendarEventsQuery(args[0], args[1], args[2])
    return getCalendarEvents(query.calendarId, query.start, query.end)
  })
  handle(IPC_CHANNELS.getBatchCalendarEvents, (_event, ...args) => {
    const query = parseBatchCalendarEventsQuery(args[0], args[1], args[2])
    return getBatchCalendarEvents(query.calendarIds, query.start, query.end)
  })
  handle(IPC_CHANNELS.justGoogleAuth, () => ensureAuthorization(false))
  on(IPC_CHANNELS.setAutoStartProgram, (_event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: parseBoolean(enabled, 'enabled'),
      name: 'Desktop Calendar',
    })
  })
  handle(IPC_CHANNELS.getAutoStartProgram, () => {
    const loginSettings = app.getLoginItemSettings()
    return process.platform === 'win32'
      ? loginSettings.executableWillLaunchAtLogin
      : loginSettings.openAtLogin
  })
  on(IPC_CHANNELS.saveNoteMemo, (_event, memo) => {
    saveMemo(parseMemo(memo))
  })
  handle(IPC_CHANNELS.getNoteMemo, () => getMemo())
  on(IPC_CHANNELS.openExternalLink, async (_event, url) => {
    await shell.openExternal(parseExternalUrl(url))
  })
  handle(IPC_CHANNELS.getCalendarList, () => getCalendarList())
  handle(IPC_CHANNELS.deleteCalEvent, (_event, ...args) => {
    const payload = parseDeleteCalendarEvent(args[0], args[1])
    return deleteCalendarEvent(payload.calendarId, payload.eventId)
  })
  handle(IPC_CHANNELS.insertCalEvent, (_event, ...args) => {
    const payload = parseInsertCalendarEvent(args[0], ...args.slice(1))
    return insertCalendarEvent(
      payload.calendarId,
      payload.allDay,
      payload.start,
      payload.end,
      payload.title,
      payload.content,
      payload.colorId,
    )
  })
  on(IPC_CHANNELS.openSettingWindow, () => {
    options.windows.openSettingWindow()
  })
  handle(IPC_CHANNELS.getAppVersion, () => app.getVersion())
  on(IPC_CHANNELS.deleteToken, async (event) => {
    await clearAuthorization()
    try {
      await ensureAuthorization(true)
      const calendarList = await fetchCalendarList()
      event.reply(IPC_CHANNELS.calendarListReset, calendarList)
    } catch (error) {
      console.error('Google reauthorization failed', error)
      event.reply(IPC_CHANNELS.authChanged, false)
    }
  })
  on(IPC_CHANNELS.restartApp, async () => {
    const results = await Promise.allSettled([
      removeCalendarFile(),
      clearAuthorization(),
    ])
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Unable to remove application data', result.reason)
      }
    }
    clearSettings()
    app.relaunch()
    app.exit(0)
  })
  on(IPC_CHANNELS.settingEnd, () => {
    options.windows.completeSetup()
  })
  on(IPC_CHANNELS.sendMainSettingData, (_event, ...args) => {
    const payload = parseSettingData(args[0], args[1])
    options.windows.getMainWindow()?.webContents.send(
      IPC_CHANNELS.settingDataChanged,
      payload.key,
      payload.value,
    )
  })
  on(IPC_CHANNELS.setWindowSize, (_event, ...args) => {
    const payload = parseWindowSize(args[0], args[1])
    options.windows.setMainWindowSize(payload.width, payload.height)
  })
  handle(IPC_CHANNELS.getWindowSize, () => {
    return options.windows.getMainWindowSize()
  })
  on(IPC_CHANNELS.requestReloadCalendar, () => {
    options.windows.getMainWindow()?.webContents.send(
      IPC_CHANNELS.requestReloadCalendar,
    )
  })
}
