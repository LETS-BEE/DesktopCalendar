const { app, BrowserWindow } = require('electron')
const { DisableMinimize } = require('electron-disable-minimize')

app.whenReady()
  .then(() => {
    const window = new BrowserWindow({ show: false })
    const result = DisableMinimize(window.getNativeWindowHandle())

    if (typeof result !== 'boolean') {
      throw new Error('DisableMinimize did not return a boolean result')
    }

    window.destroy()
    console.log('Native Electron smoke test passed')
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
