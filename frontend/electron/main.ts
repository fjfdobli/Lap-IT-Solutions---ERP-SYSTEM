import { app, BrowserWindow, type BrowserWindowConstructorOptions } from 'electron'
import os from 'node:os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

const cacheDir = path.join(os.tmpdir(), 'erp-electron-cache')
app.commandLine.appendSwitch('disk-cache-dir', cacheDir)
app.commandLine.appendSwitch('disk-cache-size', '1048576')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')

const userDataPath = path.join(os.tmpdir(), 'erp-electron-user-data')
try {
  app.setPath('userData', userDataPath)
} catch (err) {
  console.warn('Could not set Electron userData path:', err)
}

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null

if (!VITE_DEV_SERVER_URL) {
  try {
    const backendEntry = path.join(process.env.APP_ROOT, '..', 'backend', 'dist', 'index.js')
    require(backendEntry)
    console.log('Started packaged backend from', backendEntry)
  } catch (err) {
    console.warn('Could not start packaged backend automatically:', err)
  }
}

function createWindow() {
  const webPrefs: BrowserWindowConstructorOptions['webPreferences'] = {
    preload: path.join(__dirname, 'preload.mjs'),
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  }

  win = new BrowserWindow({
    icon: path.join(process.env.APP_ROOT, 'images', 'lap_it_no-bg.png'),
    title: 'Lap IT Solutions Inc. | ERP System',
    webPreferences: webPrefs,
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Inject a safer Content-Security-Policy into responses so the renderer
  // does not trigger Electron's "Insecure Content-Security-Policy" warning.
  // We avoid enabling 'unsafe-eval' here to keep the policy stricter.
  try {
    const ses = win.webContents.session
    // Use a broad URL filter so dev server and packaged files are covered.
    ses.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details: any, callback: any) => {
      const headers = details.responseHeaders || {}
      headers['Content-Security-Policy'] = [
        "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3000 ws://localhost:5173 ws://localhost:5174 http://localhost:5173 http://localhost:5174",
      ]
      callback({ responseHeaders: headers })
    })
  } catch (err) {
    // If session modification fails, ignore — this is only a dev-time convenience.
    console.warn('Could not set CSP header injection:', err)
  }

  if (VITE_DEV_SERVER_URL && process.env.START_ELECTRON === 'true') {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (process.env.START_ELECTRON === 'true' && BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', e => e.preventDefault())
})

app.whenReady().then(() => {
  if (process.env.START_ELECTRON === 'true') {
    createWindow()
  } else {
    // Intentionally silent when not running Electron during web dev.
  }
})
