// ipcMain Process
import { BrowserWindow, ipcMain, app, shell } from 'electron'
import { win } from './main'
import Store from 'electron-store'
import * as googleapi from './GoogleApi'
import * as loadSetting from './loadSetting'
import fs from 'fs'
import path from 'path'

const store = new Store()

ipcMain.on('enableMouse', (_event) => {
    // var curwin = BrowserWindow.fromId(ev.frameId)
    win?.setIgnoreMouseEvents(false)
})

ipcMain.on('disableMouse', (_event) => {
    // var curwin = BrowserWindow.fromId(ev.frameId)
    win?.setIgnoreMouseEvents(true, { forward: true })
})

ipcMain.on('googleLoginAuth', (ev) => {
    var curwin = BrowserWindow.fromId(ev.frameId) as BrowserWindow
    googleapi.useAuthorize(curwin, (_event) => {
        ev.reply("isAuthed", true)
        googleapi.useCalendarList((res) => {
            let resCalList = res.items.map((item:any) => {
                var obj = Object.assign({}, item)
                obj.checked = true
                if (item.primary) {
                    obj.isprimary = true
                }
                return obj
            })
            ev.reply('CalendarList', resCalList)
        })
    })
})

ipcMain.on('saveCalendarList', (_event, data) => {
    const calendarList = JSON.parse(data)
    googleapi.useSaveCalendarList(calendarList)
})

ipcMain.handle('getCalendarColor', async (_event) => {
    return await googleapi.useGetCalendarColor()
})

ipcMain.handle('getCalendarEvents', async (_event, id, start, end) => {
    return await googleapi.useGetCalendarEvents(id, start, end)
})

ipcMain.handle('getBatchCalendarEvents', async (_event, ids, start, end) => {
    return await googleapi.useGetBatchCalendarEvents(ids, start, end)
})

ipcMain.handle('justGoogleAuth', async (ev) => {
    var curwin = BrowserWindow.fromId(ev.frameId)
    if (curwin == null) {
        return false
    }

    return await googleapi.useAsyncAuthorize(curwin)
})

ipcMain.on('setAutoStartProgram', (_event, data) => {
    app.setLoginItemSettings({
        openAtLogin: data,
        name: "Desktop Calendar"
    })
})

ipcMain.handle('getAutoStartProgram', (_event) => {
    var temp = app.getLoginItemSettings().openAtLogin
    if (process.platform == 'win32') {
        temp = app.getLoginItemSettings().executableWillLaunchAtLogin
    }
    return temp
})

ipcMain.on('saveNoteMemo', (_event, data) => {
    store.set('memo', data)
})

ipcMain.handle('getNoteMemo', (_event) => {
    var data = ""
    data = store.get('memo', '') as string
    return data
})

ipcMain.on('openExternalLink', (_event, data) => {
    shell.openExternal(data)
})

ipcMain.handle('getCalendarList', (ev) => {
    var curwin = BrowserWindow.fromId(ev.frameId) as BrowserWindow
    return googleapi.useAsyncCalendarList(curwin)
})

ipcMain.handle('deleteCalEvent', async (_event, email, id) => {
    return await googleapi.useDeleteCalendarEvent(email, id)
})

ipcMain.handle('insertCalEvent', async (_event, calId, timeType, start, end, title, content, colorid) => {
    return await googleapi.useInsertCaledarEvent(calId, timeType, start, end, title, content, colorid)
})

ipcMain.on('openSettingWindow', (ev) => {
    var curwin = BrowserWindow.fromId(ev.frameId)
    if (curwin == null) {
        curwin = win
    }
    if (win == null) {
        return
    }

    loadSetting.LoadSettingWindow(win)
})

ipcMain.handle('getAppVersion', (_event) => {
    return app.getVersion()
})

/** 
 * see main.ts
 * 
 * ipcMain.on('sendMainSettingData')
 * ipcMain.handle('setWindowSize')
 * ipcMain.handle('getWindowSize')
 * 
*/

ipcMain.on('deleteToken', (ev) => {
    const tokenPath = path.join(app.getPath("userData"), 'token.json')
    if (fs.existsSync(tokenPath)) {
        try {
            fs.unlinkSync(tokenPath)
        } catch (err) {
            console.error(err)
        }
    }
    
    var curwin = BrowserWindow.fromId(ev.frameId) as BrowserWindow
    googleapi.useAuthorize(curwin, (_event) => {
        googleapi.useCalendarList((res) => {
            let resCalList = res.items.map((item:any) => {
                var obj = Object.assign({}, item)
                obj.checked = true
                if (item.primary) {
                    obj.isprimary = true
                }
                return obj
            })
            ev.reply('resetCalendarList', resCalList)
        })
    })
})

ipcMain.on('restartApp', (_event) => {
    const ud = app.getPath('userData')
    fs.unlink(path.join(ud, "calendar.json"), (err) => {
        if (err) {
            console.error(err)
        }
        fs.unlink(path.join(ud, "token.json"), (err) => {
            if (err) {
                console.error(err)
            }
            
            store.clear()
            app.relaunch()
            app.exit(0)
        })
    })
})