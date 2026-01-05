import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DesktopApp from './desktop/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.electronEnv?.isElectron ? <DesktopApp /> : <App />}
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
