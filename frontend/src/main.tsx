import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import './index.css'
import App from './web/pages/App'
import DesktopApp from './desktop/App'

try {
  if (import.meta.env && import.meta.env.DEV) {
    const originalWarn = console.warn.bind(console)
    console.warn = (...args: unknown[]) => {
      const first = args[0]
      if (typeof first === 'string') {
        if (
          first.includes('React Router Future Flag Warning') ||
          first.includes('v7_startTransition') ||
          first.includes('v7_relativeSplatPath')
        ) {
          return
        }
      }
      originalWarn(...args)
    }
  }
} catch (e) {
  // ignore if environment detection fails
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      {window.electronEnv?.isElectron ? <DesktopApp /> : <App />}
    </Provider>
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
