import { BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { RENDERER_DIST } from './main'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let settingWindow: BrowserWindow | null

export function LoadSettingWindow(curwin:BrowserWindow) {
    if (settingWindow != null) {
        return
    }

    settingWindow = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
        frame: true,
        focusable: true,
        title: "Desktop Calendar 설정",
        skipTaskbar: false,
        webPreferences: {
          preload: path.join(__dirname, 'preload.mjs'),
        }
    })

    settingWindow.setMenu(null)

    settingWindow.webContents.once('did-finish-load', () => {
        // settingWindow?.webContents.send('init-options')
        settingWindow?.setIgnoreMouseEvents(false)
        settingWindow?.focus()
    })

    settingWindow.on('close', () => {
        curwin.webContents.send("setWinClosed")
        settingWindow = null
    })

    if(process.env.NODE_ENV == "development" || process.env['VITE_DEV_SERVER_URL']) {
        settingWindow.webContents.openDevTools({
            mode: "undocked"
          })
        settingWindow.loadURL(`${process.env['VITE_DEV_SERVER_URL']}#/setting`)
    } else {
        settingWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {hash: 'setting'})
    }
}