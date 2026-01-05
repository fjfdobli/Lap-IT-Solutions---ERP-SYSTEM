import React from 'react'
import ReactDOM from 'react-dom/client'
// The web renderer `App.tsx` is used for the web dev server.
// For the desktop renderer we'll mount a desktop-specific root when running in Electron.
import App from './App.tsx'
import DesktopApp from './desktop/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* If running inside Electron, render the desktop-specific root. */}
    {((window as any).electronEnv && (window as any).electronEnv.isElectron)
      ? <DesktopApp />
      : <App />
    }
  </React.StrictMode>,
)

// Electron IPC is only available when running inside Electron.
// Guard access so running `npm run dev` for the web does not error.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeIpc = (window as any).ipcRenderer
  if (maybeIpc && typeof maybeIpc.on === 'function') {
    maybeIpc.on('main-process-message', (_event: any, message: any) => {
      console.log(message)
    })
  }
} catch (err) {
  // ignore — running in browser
}
