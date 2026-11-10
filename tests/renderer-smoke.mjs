import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const script = fileURLToPath(import.meta.url)
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function waitFor(check, message) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if (await check()) return
    await delay(25)
  }
  throw new Error(`Timed out: ${message}`)
}

async function runElectron() {
  const { app, BrowserWindow, ipcMain } = await import('electron')
  const runtime = process.argv.find((argument) => argument.startsWith('--smoke-runtime=')).slice('--smoke-runtime='.length)
  for (const name of ['userData', 'sessionData', 'logs', 'crashDumps']) {
    app.setPath(name, path.join(runtime, name))
  }
  app.disableHardwareAcceleration()
  await app.whenReady()

  const errors = []
  const queries = []
  const sizes = []
  let mouseIgnored = false
  let calendars = [
    { id: 'work', summary: 'Work', checked: true, primary: true, isprimary: true, accessRole: 'owner', colorId: '1' },
    { id: 'personal', summary: 'Personal', checked: true, accessRole: 'owner', colorId: '1' },
  ]
  let releaseSettingsList
  let mainWindow
  let settingsWindow
  const evaluate = (window, expression) => window.webContents.executeJavaScript(expression)
  const visibleEvent = `Array.from(document.querySelectorAll('#calendar .calendar-pointer-interactive')).find((element) => element.textContent.includes('Renderer smoke event'))`

  const createWindow = (width = 1100, height = 950) => {
    const window = new BrowserWindow({
      width, height, useContentSize: true, frame: false, transparent: true, show: false,
      webPreferences: {
        preload: path.join(root, 'dist-electron', 'preload.mjs'),
        contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false,
      },
    })
    window.webContents.on('console-message', (details) => {
      if (details.level === 'error' || details.level === 3) errors.push(details.message)
    })
    window.webContents.on('preload-error', (_event, _file, error) => errors.push(String(error)))
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*'] },
      (_details, callback) => callback({ cancel: true }),
    )
    return window
  }

  ipcMain.handle('getNoteMemo', () => '')
  ipcMain.on('enableMouse', () => { mouseIgnored = false })
  ipcMain.on('disableMouse', () => { mouseIgnored = true })
  ipcMain.handle('getAppVersion', () => '3.2.1-test')
  ipcMain.handle('getAutoStartProgram', () => false)
  ipcMain.handle('getWindowSize', () => ({ window: mainWindow.getSize(), displayArea: [1920, 1080] }))
  ipcMain.handle('getCalendarList', async (event) => {
    if (event.sender === settingsWindow?.webContents) {
      await new Promise((resolve) => { releaseSettingsList = resolve })
    } else {
      await delay(50)
    }
    return calendars
  })
  ipcMain.handle('justGoogleAuth', () => true)
  ipcMain.handle('getCalendarColor', () => ({
    calendar: { 1: { background: '#123456', foreground: '#ffffff' } }, event: {},
  }))
  ipcMain.handle('getBatchCalendarEvents', (_event, query) => {
    queries.push(query)
    const start = new Date(query.start)
    start.setDate(start.getDate() + 6)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const dateKey = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    return {
      work: { items: [{
        id: 'smoke-event', summary: 'Renderer smoke event',
        start: { date: dateKey(start) }, end: { date: dateKey(end) },
        description: `<p>${'Long event description. '.repeat(1000)}</p>`,
        organizer: { email: 'smoke@example.test' },
      }] },
    }
  })
  ipcMain.handle('saveCalendarList', async (_event, value) => {
    await delay(50)
    calendars = value
  })
  ipcMain.on('requstReloadCalendar', () => mainWindow.webContents.send('requstReloadCalendar'))
  ipcMain.on('setWindowSize', (_event, size) => {
    sizes.push(size)
    mainWindow.setSize(size.width, size.height)
  })
  ipcMain.on('sendMainSettingData', (_event, { key, value }) => mainWindow.webContents.send('getSettingData', key, value))
  ipcMain.on('openSettingWindow', () => {
    settingsWindow = createWindow(900, 950)
    settingsWindow.on('closed', () => mainWindow.webContents.send('setWinClosed'))
    void settingsWindow.loadFile(path.join(root, 'dist', 'index.html'), { hash: 'setting' })
      .catch((error) => errors.push(String(error)))
  })

  try {
    mainWindow = createWindow()
    await mainWindow.loadFile(path.join(root, 'dist', 'index.html'))
    await waitFor(() => evaluate(mainWindow, `Boolean(${visibleEvent})`), 'events on first launch')
    assert.equal(queries.length, 1, 'startup should issue one event request without a manual refresh')

    mainWindow.webContents.send('getSettingData', 'calendar', JSON.stringify({
      background: { r: 120, g: 30, b: 70, a: 0.3 },
      color: { r: 0, g: 0, b: 0, a: 1 }, buttonType: 'primary',
    }))
    await waitFor(() => evaluate(mainWindow, `getComputedStyle(document.querySelector('#calendar')).backgroundColor === 'rgba(120, 30, 70, 0.3)'`), 'custom calendar background')
    assert.equal(await evaluate(mainWindow, `getComputedStyle(document.querySelector('#calendar .fc-classic-Jk3')).backgroundColor`), 'rgba(0, 0, 0, 0)')

    const day = await evaluate(mainWindow, `(() => {
      const cell = Array.from(document.querySelectorAll('#calendar .calendar-day-cell[data-date]')).find((element) => !element.querySelector('.calendar-pointer-interactive'));
      const rect = cell.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2), y = Math.round(rect.top + rect.height / 2);
      return { date: cell.dataset.date, x, y, hitDate: document.elementFromPoint(x, y)?.closest('.calendar-day-cell')?.dataset.date };
    })()`)
    assert.equal(day.hitDate, day.date, 'empty day cells must receive hover hit testing')
    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: day.x, y: day.y })
    await waitFor(() => evaluate(mainWindow, `Boolean(document.querySelector('.calendar-day-add-button'))`), 'add button on an empty day')
    assert.equal(mouseIgnored, true, 'empty day hover must preserve desktop click-through')
    const addPoint = await evaluate(mainWindow, `(() => {
      const button = document.querySelector('.calendar-day-add-button');
      const rect = button.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2), y = Math.round(rect.top + rect.height / 2);
      return { x, y, clickable: Boolean(document.elementFromPoint(x, y)?.closest('.calendar-day-add-button')) };
    })()`)
    assert.ok(addPoint.clickable, 'day headers must not cover the add button')
    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: addPoint.x, y: addPoint.y })
    await waitFor(() => !mouseIgnored, 'mouse input enabled on the day add button')
    mainWindow.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, x: addPoint.x, y: addPoint.y })
    mainWindow.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, x: addPoint.x, y: addPoint.y })
    await waitFor(() => evaluate(mainWindow, `Boolean(document.querySelector('.event-add')?.closest('.uk-drop.uk-open'))`), 'event form from the day add button')
    assert.deepEqual(await evaluate(mainWindow, `Array.from(document.querySelectorAll('.event-add [data-test-id="dp-input"]')).map((input) => input.value)`), [day.date, day.date])
    await evaluate(mainWindow, `document.body.click()`)

    const checkPopup = async () => {
      await evaluate(mainWindow, `(${visibleEvent}).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))`)
      await waitFor(() => evaluate(mainWindow, `document.querySelector('#gcal-event').getBoundingClientRect().width > 0`), 'visible event popup')
      await delay(50)
      const bounds = await evaluate(mainWindow, `(() => {
        const rect = document.querySelector('#gcal-event').getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
      })()`)
      assert.ok(bounds.left >= 19 && bounds.right <= bounds.width - 19, JSON.stringify(bounds))
      assert.ok(bounds.top >= 19 && bounds.bottom <= bounds.height - 19, JSON.stringify(bounds))
    }
    await checkPopup()
    mainWindow.setSize(1024, 800)
    await delay(100)
    await checkPopup()

    await evaluate(mainWindow, `document.querySelector('#createOption').click()`)
    await waitFor(() => Boolean(settingsWindow && releaseSettingsList), 'settings calendar request')
    await waitFor(() => evaluate(settingsWindow, `Boolean(document.querySelector('input[type=range][min="1024"]:not(:disabled)'))`), 'size controls before calendar data')
    const resources = await evaluate(settingsWindow, `performance.getEntriesByType('resource').map((entry) => entry.name)`)
    assert.ok(!resources.some((url) => /\/main-[^/]+\.js$/.test(url)), 'settings must not load the main calendar/editor bundle')

    await evaluate(settingsWindow, `(() => {
      const slider = document.querySelector('input[type=range][min="1024"]');
      for (const value of [1200, 1280, 1350]) {
        slider.value = String(value);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`)
    await waitFor(() => sizes.length > 0, 'slider resize')
    assert.deepEqual(sizes, [{ width: 1350, height: 800 }])
    assert.equal(mainWindow.getSize()[0], 1350)

    releaseSettingsList()
    await waitFor(() => evaluate(settingsWindow, `document.querySelectorAll('.itemlist input[type=checkbox]').length === 2`), 'calendar choices')
    await evaluate(settingsWindow, `(() => {
      const checkbox = document.querySelectorAll('.itemlist input[type=checkbox]')[1];
      checkbox.click();
      Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === '적용').click();
    })()`)
    await waitFor(() => queries.length === 2, 'reload after saving calendar selection')
    assert.deepEqual(queries[1].calendarIds, ['work'])
    settingsWindow.destroy()
    await waitFor(() => evaluate(mainWindow, `!document.querySelector('#createOption').disabled`), 'settings button after closing')
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('Renderer smoke passed: startup, day hover/add, transparency, popup bounds, settings isolation, live resize, calendar save/reload.')
  } finally {
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.destroy()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy()
  }
  app.exit(0)
}

async function run() {
  await access(path.join(root, 'dist', 'index.html'))
  await access(path.join(root, 'dist-electron', 'preload.mjs'))
  const runtime = await mkdtemp(path.join(root, 'tests', '.renderer-smoke-'))
  try {
    for (const name of ['userData', 'sessionData', 'logs', 'crashDumps']) {
      await mkdir(path.join(runtime, name))
    }
    const environment = { ...process.env, TEMP: runtime, TMP: runtime, ELECTRON_DISABLE_SECURITY_WARNINGS: '1' }
    delete environment.ELECTRON_RUN_AS_NODE
    const child = spawn(require('electron'), [script, `--smoke-runtime=${runtime}`], { cwd: root, env: environment, stdio: 'inherit' })
    const timeout = setTimeout(() => child.kill(), 60_000)
    try {
      const status = await new Promise((resolve, reject) => {
        child.once('error', reject)
        child.once('exit', resolve)
      })
      assert.equal(status, 0, 'Electron renderer smoke process failed')
    } finally {
      clearTimeout(timeout)
    }
  } finally {
    await rm(runtime, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }
}

if (process.versions.electron) {
  runElectron().catch(async (error) => {
    console.error(error)
    const { app } = await import('electron')
    app.exit(1)
  })
} else {
  run().catch((error) => { console.error(error); process.exitCode = 1 })
}
