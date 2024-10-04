import {
    Tray,
    Menu,
    Notification,
    BrowserWindow,
    MenuItemConstructorOptions
} from 'electron'
import path from 'node:path'

let tray: Tray | null = null

export function openTray(win: BrowserWindow) {
    const iconPath = path.join(process.env.VITE_PUBLIC, 'icon.png')
    console.log(iconPath)
    tray = new Tray(iconPath)
    tray.setToolTip("Desktop Calendar")
    const contextMenu: Array<MenuItemConstructorOptions> = [
        {
            label: "프로그램 종료",
            type: "normal",
            click: () => {
                tray?.destroy()
                win.destroy()
            }
        },
        {
            label: "숨기기",
            type: "normal",
            click: () => {
                win.hide()
            }
        },
        {
            label: "보이기",
            type: "normal",
            click: () => {
                win.show()
            }
        }
    ]

    if (process.env.NODE_ENV == "development" || process.env['VITE_DEV_SERVER_URL']) {
        contextMenu.push({
            label: "Open DevTool",
            type: "normal",
            click: () => {
                win.webContents.openDevTools({
                    mode: "undocked"
                })
            }
        })
    }

    tray.setContextMenu(Menu.buildFromTemplate(contextMenu))

    new Notification({
        title: "Desktop Calendar 실행 중",
        body: "Desktop Calendar가 실행 중입니다. 트레이 아이콘에서 볼 수 있습니다.",
        icon: iconPath,
    }).show()
}

export function destroyTray() {
    if (tray != null) {
        tray.destroy()
        tray = null
    }
}