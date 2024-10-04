import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Display,
  Rectangle
} from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// custom imort
// import { DisableMinimize } from 'electron-disable-minimize'
import './process'
import { openTray, destroyTray } from './trayfunc'
import fs from 'node:fs'
import Store from 'electron-store'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

export let win: BrowserWindow | null
let setWin: BrowserWindow | null
// let windowMoving = false
let display: Display | null
const store = new Store()

function createMainWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
		transparent: true,
		frame: false,
		skipTaskbar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
		},
	})

	openTray(win)

	var rect: Rectangle | null = store.get('bounds') as Rectangle
	// console.log(rect)
	if (rect === undefined || rect === null) {
		display = screen.getAllDisplays()[0]
		rect = display.workArea
	} else {
		display = screen.getDisplayMatching(rect as Rectangle)
		var newRect = display.workArea
		var margin_width = 0
		var margin_height = 0

		if (rect.width > newRect.width) {
			rect.width = newRect.width
		}

		if (rect.height > newRect.height) {
			rect.height = newRect.height
		}

		if (rect.x <= newRect.x - margin_width) {
			newRect.x = newRect.x - margin_width
		} else if (rect.x >= newRect.x + newRect.width - margin_width - rect.width) {
			newRect.x = newRect.x + newRect.width - margin_width - rect.width
		} else {
			newRect.x = rect.x
		}

		if (rect.y <= newRect.y + margin_height) {
			newRect.y = newRect.y + margin_height
		} else if (rect.y >= newRect.y + newRect.height - margin_height - rect.height) {
			newRect.y = newRect.y + newRect.height - margin_height - rect.height
		} else {
			newRect.y = rect.y
		}
		
		
		rect.x = newRect.x
		rect.y = newRect.y
		store.set('bounds', rect)
		
	}
	// windowMoving = true
	
	// console.log(rect, win.getBounds())
	win.setBounds(rect)
	// console.log(rect, win.getBounds())
	// ZoomFactor 배율 125%, 150%, 250% 등  노트북 => 모니터 화면에서 문제가 발생함
	win.webContents.setZoomFactor(display.scaleFactor)
	// windowMoving = false

	win.setIgnoreMouseEvents(true, { forward: true })
	win.setIgnoreMouseEvents(false)

	// Test active push message to Renderer-process.
	win.webContents.on('did-finish-load', () => {
		win?.setIgnoreMouseEvents(false)

	//   win?.webContents.send('main-process-message', (new Date).toLocaleString())
	})

	const { DisableMinimize } = require('electron-disable-minimize')
	DisableMinimize(win.getNativeWindowHandle())

	win.on('blur', () => {
		win?.setIgnoreMouseEvents(true, { forward: true })
	})

	win.on('close', (ev) => {
		ev.preventDefault()

		// returnValue is deprecated and removed
		// ev.returnValue = false
	})

	win.on('closed', () => {
		win = null
	})

	win.on('moved', () => {
		if (win != null) {
			var nowRect = win.getBounds()
			// console.log(nowRect)
			var newDisplay = screen.getDisplayMatching(nowRect)
			var lastRect = newDisplay.workArea
			var margin_width = 0
			var margin_height = 0
			if (nowRect.x  <= lastRect.x - margin_width) {
				lastRect.x = lastRect.x - margin_width
			} else if (nowRect.x >= lastRect.x + lastRect.width - margin_width - nowRect.width) {
				lastRect.x = lastRect.x + lastRect.width + margin_width - nowRect.width
			} else {
				lastRect.x = nowRect.x
			}

			if (nowRect.y <= lastRect.y + margin_height) {
				lastRect.y = lastRect.y + margin_height
			} else if (nowRect.y >= lastRect.y + lastRect.height - margin_height - nowRect.height) {
				lastRect.y = lastRect.y + lastRect.height - margin_height - nowRect.height
			} else {
				lastRect.y = nowRect.y
			}

			lastRect.width = nowRect.width
			lastRect.height = nowRect.height
			
			if (display?.id !== newDisplay.id) {
				// windowMoving = true
				lastRect.width = lastRect.width * newDisplay.scaleFactor
				lastRect.height = lastRect.height * newDisplay.scaleFactor
				win.setBounds(lastRect)
				win.webContents.setZoomFactor(newDisplay.scaleFactor)
				display = newDisplay
			}

			win.setPosition(lastRect.x, lastRect.y)
			store.set('bounds', lastRect)
			// windowMoving = false
		}
	})

	// win.on('resize', () => {
	// 	if (windowMoving && win != null) {
	// 		var sz = win.getSize()
			
	// 		win.webContents.executeJavaScript(`window.resizeTo(${sz[0]}, ${sz[0]})`)
	// 		// calendar vue
	// 		win.webContents.executeJavaScript('window.onresize()')
	// 	}
	// })

	screen.on('display-removed', () => {
		if (win != null) {
			const [x, y] = win.getPosition()
			win.setPosition(x, y)
		}
	})
	
	if (VITE_DEV_SERVER_URL) {
		// console.log(VITE_DEV_SERVER_URL)
		win.loadURL(VITE_DEV_SERVER_URL)
		win.webContents.openDevTools({
		mode: "undocked"
		})
	} else {
		// win.loadFile('dist/index.html')
		win.loadFile(path.join(RENDERER_DIST, 'index.html'))
	}
}


function createSetupWindow() {
	const ud = app.getPath('userData')
	// const fs = require('fs')
	fs.stat(ud + "/calendar.json", (err, _stat) => {
		if (err) {
			fs.mkdir(ud, (err) => {
				if (err) {
					console.error("useData folder Exists")
				}
			})

			setWin = new BrowserWindow({
				icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
				title: "Desktop Calendar 시작",
				height: 700,
				webPreferences: {
					preload: path.join(__dirname, 'preload.mjs'),
					// nodeIntegration: Boolean(process.env.ELECTRON_NODE_INTEGRATION),
					// contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
				}
			})
		
			// setWin.webContents.on('did-finish-load', () => {
			// 	// setWin?.webContents.send('main-process-message', (new Date).toLocaleString())
			// })

			setWin.on("close", () => {
				setWin = null
			})

			setWin.setMenu(null)
			
			// console.log(VITE_DEV_SERVER_URL)
			if (VITE_DEV_SERVER_URL) {
				setWin.webContents.openDevTools({
				mode: "undocked"
				})
				setWin.loadURL(`${VITE_DEV_SERVER_URL}#setup`)
			} else {
				// setWin.loadURL(`app://./index.html#setup`)
				setWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {hash: 'setup'})
				// setWin.loadFile(`${RENDERER_DIST}/index.html#setup`)
			}
		} else {
			createMainWindow()
		}
	})
}

ipcMain.on('setting-end', () => {
	createMainWindow()
	setWin?.destroy()
})

if (!app.requestSingleInstanceLock()) {
	app.quit()
}

// app.setAppUserModelId('com.ingmagine.deskcal')
// app.setAppUserModelId(app.name)

app.on('ready', () => {
	if (process.platform == 'win32') {
		app.setAppUserModelId(app.name)
	}
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		destroyTray()
		app.quit()
		win = null
	}
})

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	// if (BrowserWindow.getAllWindows().length === 0) {
	if (win === null) {
		createSetupWindow()
	}
})

app.whenReady().then(() => {
  	createSetupWindow()
})

ipcMain.on('sendMainSettingData', (_event, key, value) => {
  	win?.webContents.send('getSettingData', key, value)
})

ipcMain.on('setWindowSize', (_event, width, height) => {
	if (win == null) {
		return
	}

	width = parseInt(width)
	height = parseInt(height)

	var winRect = win.getBounds()
	var displayArea = screen.getDisplayMatching(winRect).workArea

	if (width <= displayArea.width && height <= displayArea.height) {
		// console.log(win.isResizable(), width, height)
		//win.setSize(width, height)

		if (winRect.x + width > displayArea.x + displayArea.width) {
			winRect.x += displayArea.x + displayArea.width - (winRect.x + width)
		}
		if (winRect.y + height > displayArea.y + displayArea.height) {
			winRect.y += displayArea.y + displayArea.height - (winRect.y + height)
		}

		winRect.width = width
		winRect.height = height
		// console.log(winRect)
		win.setBounds(winRect)
		store.set('bounds', winRect)
	}
})

ipcMain.handle('getWindowSize', (_event) => {
	if (win == null) {
		return JSON.stringify({
			window: [1024, 576],
			dispalyArea: [1024, 576]
		})
	}
	var winRect = win.getBounds()
	var displayArea = screen.getDisplayMatching(winRect).workArea

	return JSON.stringify({
		window: [winRect.width, winRect.height],
		displayArea: [displayArea.width, displayArea.height]
	})
})

ipcMain.on('requstReloadCalendar', (_event) => {
	if (win == null) {
		return
	}

	win.webContents.send('requstReloadCalendar')
})