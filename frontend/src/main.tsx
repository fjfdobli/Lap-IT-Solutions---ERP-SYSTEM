import React from 'react'
import ReactDOM from 'react-dom/client'
import DesktopApp from './desktop/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.electronEnv?.isElectron && <DesktopApp />}
  </React.StrictMode>,
)

try {
  const maybeIpc = window.ipcRenderer
  if (maybeIpc && typeof maybeIpc.on === 'function') {
    maybeIpc.on('main-process-message', (_event, message) => {
      console.log(message)
    })
  }
} catch (err) {
  // ignore — running in browser
}
