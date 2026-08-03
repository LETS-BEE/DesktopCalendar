import {
  BrowserWindow,
  screen,
  shell,
  type Display,
  type Rectangle,
} from 'electron'
import { createRequire } from 'node:module'
import path from 'node:path'
import { IPC_CHANNELS, type WindowSizeInfo } from '../../shared/ipc'
import {
  calendarFileExists,
  getSavedBounds,
  saveBounds,
} from '../persistence/app-data'
import { openTray } from '../trayfunc'
import { parseExternalWebUrl } from './navigation'

interface WindowManagerOptions {
  preloadPath: string
  rendererDist: string
  publicPath: string
  devServerUrl?: string
}

const require = createRequire(import.meta.url)

function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  wait: number,
) {
  let timeout: NodeJS.Timeout
  return (...args: TArgs) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(...args), wait)
  }
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private setupWindow: BrowserWindow | null = null
  private settingWindow: BrowserWindow | null = null
  private display: Display | null = null
  private readonly saveBoundsDebounced = debounce(saveBounds, 250)

  constructor(private readonly options: WindowManagerOptions) {
    screen.on('display-removed', () => {
      if (this.mainWindow) {
        const [x, y] = this.mainWindow.getPosition()
        this.mainWindow.setPosition(x, y)
      }
    })
  }

  getMainWindow() {
    return this.mainWindow
  }

  async createInitialWindow() {
    if (await calendarFileExists()) {
      this.createMainWindow()
    } else {
      this.createSetupWindow()
    }
  }

  completeSetup() {
    this.createMainWindow()
    this.setupWindow?.destroy()
    this.setupWindow = null
  }

  createMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show()
      return this.mainWindow
    }

    const window = new BrowserWindow({
      icon: path.join(this.options.publicPath, 'icon.png'),
      transparent: true,
      frame: false,
      skipTaskbar: true,
      webPreferences: this.secureWebPreferences(),
    })
    this.mainWindow = window
    this.lockNavigation(window)
    openTray(window)

    const bounds = this.fitSavedBoundsToDisplay(getSavedBounds())
    window.setBounds(bounds)
    window.webContents.setZoomFactor(this.display?.scaleFactor ?? 1)
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setIgnoreMouseEvents(false)

    window.webContents.on('did-finish-load', () => {
      window.setIgnoreMouseEvents(false)
    })
    window.on('blur', () => {
      window.setIgnoreMouseEvents(true, { forward: true })
    })
    window.on('close', (event) => event.preventDefault())
    window.on('closed', () => {
      if (this.mainWindow === window) {
        this.mainWindow = null
      }
    })
    window.on('moved', () => this.handleMainWindowMoved(window))

    const { DisableMinimize } = require('electron-disable-minimize') as {
      DisableMinimize(handle: Buffer): void
    }
    DisableMinimize(window.getNativeWindowHandle())

    this.loadRoute(window)
    return window
  }

  createSetupWindow() {
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      this.setupWindow.focus()
      return this.setupWindow
    }

    const window = new BrowserWindow({
      icon: path.join(this.options.publicPath, 'icon.png'),
      title: 'Desktop Calendar 시작',
      height: 700,
      webPreferences: this.secureWebPreferences(),
    })
    this.setupWindow = window
    this.lockNavigation(window)
    window.setMenu(null)
    window.on('closed', () => {
      if (this.setupWindow === window) {
        this.setupWindow = null
      }
    })
    this.loadRoute(window, 'setup')
    return window
  }

  openSettingWindow() {
    if (this.settingWindow && !this.settingWindow.isDestroyed()) {
      this.settingWindow.focus()
      return
    }
    if (!this.mainWindow) {
      return
    }

    const mainWindow = this.mainWindow
    const window = new BrowserWindow({
      icon: path.join(this.options.publicPath, 'icon.png'),
      frame: true,
      focusable: true,
      title: 'Desktop Calendar 설정',
      skipTaskbar: false,
      webPreferences: this.secureWebPreferences(),
    })
    this.settingWindow = window
    this.lockNavigation(window)
    window.setMenu(null)
    window.webContents.once('did-finish-load', () => {
      window.setIgnoreMouseEvents(false)
      window.focus()
    })
    window.on('closed', () => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.settingWindowClosed)
      }
      if (this.settingWindow === window) {
        this.settingWindow = null
      }
    })
    this.loadRoute(window, 'setting')
  }

  isManagedWebContentsId(id: number) {
    return [
      this.mainWindow,
      this.setupWindow,
      this.settingWindow,
    ].some((window) => window?.webContents.id === id)
  }

  setIgnoreMouseEvents(ignore: boolean) {
    this.mainWindow?.setIgnoreMouseEvents(
      ignore,
      ignore ? { forward: true } : undefined,
    )
  }

  setMainWindowSize(width: number, height: number) {
    const window = this.mainWindow
    if (!window) {
      return
    }

    const bounds = window.getBounds()
    const workArea = screen.getDisplayMatching(bounds).workArea
    if (width > workArea.width || height > workArea.height) {
      return
    }

    if (bounds.x + width > workArea.x + workArea.width) {
      bounds.x += workArea.x + workArea.width - (bounds.x + width)
    }
    if (bounds.y + height > workArea.y + workArea.height) {
      bounds.y += workArea.y + workArea.height - (bounds.y + height)
    }
    bounds.width = width
    bounds.height = height
    window.setBounds(bounds)
    saveBounds(bounds)
  }

  getMainWindowSize(): WindowSizeInfo {
    if (!this.mainWindow) {
      return {
        window: [1024, 576],
        displayArea: [1024, 576],
      }
    }

    const bounds = this.mainWindow.getBounds()
    const workArea = screen.getDisplayMatching(bounds).workArea
    return {
      window: [bounds.width, bounds.height],
      displayArea: [workArea.width, workArea.height],
    }
  }

  private secureWebPreferences() {
    return {
      preload: this.options.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    } as const
  }

  private lockNavigation(window: BrowserWindow) {
    window.webContents.setWindowOpenHandler(({ url }) => {
      this.openExternalWebUrl(url)
      return { action: 'deny' }
    })
    window.webContents.on('will-navigate', (event, url) => {
      if (!this.isApplicationUrl(url)) {
        event.preventDefault()
        this.openExternalWebUrl(url)
      }
    })
  }

  private openExternalWebUrl(value: string) {
    const url = parseExternalWebUrl(value)
    if (!url) {
      return
    }
    void shell.openExternal(url)
      .catch((error) => console.error('Unable to open external URL', error))
  }

  private isApplicationUrl(url: string) {
    try {
      const parsedUrl = new URL(url)
      if (this.options.devServerUrl) {
        return parsedUrl.origin === new URL(this.options.devServerUrl).origin
      }
      return parsedUrl.protocol === 'file:'
    } catch {
      return false
    }
  }

  private loadRoute(window: BrowserWindow, route?: 'setup' | 'setting') {
    if (this.options.devServerUrl) {
      window.webContents.openDevTools({ mode: 'undocked' })
      const hash = route ? `#/${route}` : ''
      void window.loadURL(`${this.options.devServerUrl}${hash}`)
      return
    }
    void window.loadFile(
      path.join(this.options.rendererDist, 'index.html'),
      route ? { hash: route } : undefined,
    )
  }

  private fitSavedBoundsToDisplay(savedBounds?: Rectangle) {
    const bounds = savedBounds
      ? { ...savedBounds }
      : { ...screen.getAllDisplays()[0].workArea }
    this.display = screen.getDisplayMatching(bounds)
    const workArea = this.display.workArea

    bounds.width = Math.min(bounds.width, workArea.width)
    bounds.height = Math.min(bounds.height, workArea.height)
    bounds.x = Math.min(
      Math.max(bounds.x, workArea.x),
      workArea.x + workArea.width - bounds.width,
    )
    bounds.y = Math.min(
      Math.max(bounds.y, workArea.y),
      workArea.y + workArea.height - bounds.height,
    )
    saveBounds(bounds)
    return bounds
  }

  private handleMainWindowMoved(window: BrowserWindow) {
    const bounds = window.getBounds()
    const nextDisplay = screen.getDisplayMatching(bounds)
    const workArea = nextDisplay.workArea
    const nextBounds = {
      ...bounds,
      x: Math.min(
        Math.max(bounds.x, workArea.x),
        workArea.x + workArea.width - bounds.width,
      ),
      y: Math.min(
        Math.max(bounds.y, workArea.y),
        workArea.y + workArea.height - bounds.height,
      ),
    }

    if (this.display?.id !== nextDisplay.id) {
      nextBounds.width = Math.min(
        Math.round(bounds.width * nextDisplay.scaleFactor),
        workArea.width,
      )
      nextBounds.height = Math.min(
        Math.round(bounds.height * nextDisplay.scaleFactor),
        workArea.height,
      )
      window.setBounds(nextBounds)
      window.webContents.setZoomFactor(nextDisplay.scaleFactor)
      this.display = nextDisplay
    } else {
      window.setPosition(nextBounds.x, nextBounds.y)
    }
    this.saveBoundsDebounced(nextBounds)
  }
}
