import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerIpcHandlers } from './process'
import { destroyTray } from './trayfunc'
import { WindowManager } from './windows/window-manager'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(currentDirectory, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let windows: WindowManager | null = null

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const mainWindow = windows?.getMainWindow()
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      destroyTray()
      app.quit()
    }
  })

  app.on('activate', () => {
    if (!windows?.getMainWindow()) {
      void windows?.createInitialWindow()
    }
  })

  void app.whenReady().then(async () => {
    if (process.platform === 'win32') {
      app.setAppUserModelId(app.name)
    }

    windows = new WindowManager({
      preloadPath: path.join(currentDirectory, 'preload.mjs'),
      rendererDist: RENDERER_DIST,
      publicPath: process.env.VITE_PUBLIC ?? RENDERER_DIST,
      devServerUrl: VITE_DEV_SERVER_URL,
    })
    registerIpcHandlers({
      windows,
      rendererDist: RENDERER_DIST,
      devServerUrl: VITE_DEV_SERVER_URL,
    })
    await windows.createInitialWindow()
  })
}
