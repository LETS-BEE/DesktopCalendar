'use strict'

import { 
  app,
  BrowserWindow,
  Menu,
  Notification,
  protocol,
  screen,
  Tray,
  ipcMain
} from 'electron'
import Store from 'electron-store'
import * as remoteMain from '@electron/remote/main'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { DisableMinimize } from 'electron-disable-minimize'
import path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'
process.chdir(path.dirname(process.execPath))

remoteMain.initialize()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, startWindow;
let tray = null;
const store = new Store();
let windowMoving = false, display = null;

function createWindow() {
  openTray()
  // Create the browser window.
  mainWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true
    }
  })
  
  var rect = store.get('bounds')
  if (rect === undefined) {
    display = screen.getAllDisplays()[0]
    rect = display.workArea
  }
  else {
    display = screen.getDisplayMatching(rect)
    var newRect = display.workArea
    var margin_medium_left = 40;
    if (rect.x  < newRect.x - margin_medium_left)
      newRect.x = Math.round(newRect.x - margin_medium_left)
    else if (rect.x  > newRect.x + newRect.width * 0.2)
      newRect.x = Math.round(newRect.x + newRect.width * 0.2)
    else
      newRect.x = rect.x

    if (rect.y > newRect.y + newRect.height * 0.5)
      newRect.y = Math.round(newRect.y + newRect.height * 0.5)
    else
      newRect.y = rect.y
    

    rect = newRect
  }

  windowMoving = true
  mainWindow.setBounds(rect)
  mainWindow.webContents.setZoomFactor(1)
  windowMoving = false

  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)

    if (!process.env.IS_TEST){
      mainWindow.webContents.openDevTools({ mode: 'undocked' })
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html')
  }
  
  DisableMinimize(mainWindow.getNativeWindowHandle())
  mainWindow.on("blur", () => {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
  })
  mainWindow.on("close", e => {
    e.preventDefault()
    e.returnValue = false
  })
  mainWindow.on("closed", () => {
    mainWindow = null
  })
  
  mainWindow.on("moved", () => {
    var nowRect = mainWindow.getBounds()
    var newDisplay = screen.getDisplayMatching(nowRect)
    var lastRect = newDisplay.workArea
    var margin_medium_left = 40;
    if (nowRect.x  < lastRect.x - margin_medium_left)
      lastRect.x = Math.round(lastRect.x - margin_medium_left)
    else if (nowRect.x  > lastRect.x + lastRect.width * 0.2)
      lastRect.x = Math.round(lastRect.x + lastRect.width * 0.2)
    else
      lastRect.x = nowRect.x

    if (nowRect.y > lastRect.y + lastRect.height * 0.5)
      lastRect.y = Math.round(lastRect.y + lastRect.height * 0.5)
    else
      lastRect.y = nowRect.y
    
    if (display.id !== newDisplay.id) {
      windowMoving = true
      mainWindow.setBounds(lastRect)
      mainWindow.webContents.setZoomFactor(1)
      display = newDisplay
    }
    mainWindow.setPosition(lastRect.x, lastRect.y)
    store.set('bounds', lastRect)
    windowMoving = false
  })

  mainWindow.on('resize', () => {
    if (windowMoving) {
      var sz = mainWindow.getSize()
      mainWindow.webContents.executeJavaScript(`window.resizeTo(${sz[0]}, ${sz[1]})`)
      // ./Calendar/index.vue?304
      mainWindow.webContents.executeJavaScript(`window.onresize()`)
    }
  })

  screen.on('display-removed', () => {
    const [x, y] = mainWindow.getPosition();
		mainWindow.setPosition(x, y);
  })
}

app.requestSingleInstanceLock()

ipcMain.on('settingend', () => {
  createWindow()
  startWindow.destroy()
})

app.setAppUserModelId('com.ingmagine.deskcal')

app.on('browser-window-created', (_, window) => {
  require('@electron/remote/main').enable(window.webContents)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    if (tray !== null) {
      tray.destroy()
    }

    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', setupWindow)

function openTray() {
  const iconPath = app.getAppPath() + '/icon.png'
  tray = new Tray(iconPath)
  tray.setToolTip("Desktop Calendar")
  const contextMenu = [
    {
      label: "프로그램 종료",
      type: "normal",
      click: () => {
        tray.destroy();
        mainWindow.destroy()
      }
    },
    {
      label: "숨기기",
      type: "normal",
      click: () => {
        mainWindow.hide()
      }
    },
    {
      label: "보이기",
      type: "normal",
      click: () => {
        mainWindow.show()
      }
    }
  ]
  if (process.env.NODE_ENV === "development") {
    contextMenu.push({
      label: "Open DevTool",
      type: "normal",
      click: () => {
        mainWindow.webContents.openDevTools({
          mode: "undocked"
        });
      }
    });
  }
  tray.setContextMenu(Menu.buildFromTemplate(contextMenu))

  const notify = new Notification({
    title: "Desktop Calendar 실행 중",
    body: "Desktop Calendar가 실행 중입니다. 트레이 아이콘에서 볼 수 있습니다."
  })
  notify.show()
}

function setupWindow() {
  const ud = app.getPath('userData')
  const fs = require('fs')
  fs.stat(ud + "/calendar.json", (err, stats) => {
    if (err) {
      fs.mkdir(ud, (errs) => {
        if (errs) {
          console.log("folderExists")
        }

        startWindow = new BrowserWindow({
          title: "Desktop Calendar 시작",
          height: 700,
          webPreferences: {
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            enableRemoteModule: true
          }
        })

        if (process.env.WEBPACK_DEV_SERVER_URL) {
          startWindow.webContents.openDevTools({
            mode: "undocked"
          })

          startWindow.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#/setup`)
        } else {
          startWindow.setMenu(null)
          createProtocol('app')
          // Load the index.html when not in development
          startWindow.loadURL("app://./index.html#setup")
        }

        startWindow.on("close", () => {
          startWindow = null;
        })
      })
    } else {
      createWindow()
    }
  })
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
