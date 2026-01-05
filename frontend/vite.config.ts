import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

if (process.env.START_ELECTRON === 'true') {
  const origLog = console.log.bind(console)
  const origInfo = console.info.bind(console)
  const shouldFilter = (text: string) => {
    return (
      text.includes('Local:') ||
      text.includes('building client environment') ||
      text.includes('watching for file changes') ||
      text.includes('press h + enter')
    )
  }
  console.log = (...args: unknown[]) => {
    try {
      const first = typeof args[0] === 'string' ? args[0] : ''
      if (shouldFilter(first)) return
    } catch (e) {
      // ignore
    }
    origLog(...args)
  }
  console.info = (...args: unknown[]) => {
    try {
      const first = typeof args[0] === 'string' ? args[0] : ''
      if (shouldFilter(first)) return
    } catch (e) {
      // ignore
    }
    origInfo(...args)
  }
}

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.START_ELECTRON === 'true' ? [
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        renderer: process.env.NODE_ENV === 'test' ? undefined : {},
      })
    ] : []),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (function printLocalUrl() {
      return {
        name: 'print-local-url',
        configureServer(server: any) {
          const srv = server as any
          const httpServer = srv.httpServer
          if (httpServer && typeof httpServer.once === 'function') {
            httpServer.once('listening', () => {
              try {
                const addr = typeof httpServer.address === 'function' ? httpServer.address() : undefined
                const port = (addr && typeof addr === 'object' && 'port' in addr) ? (addr as any).port : (srv.config?.server?.port ?? 5173)
                const host = srv.config?.server?.host ?? 'localhost'
                const protocol = srv.config?.server?.https ? 'https' : 'http'

                if (process.env.START_ELECTRON === 'true') {
                  // eslint-disable-next-line no-console
                  console.log('  ➜  Electron bundles: dist-electron/ (one-line summary)\n')
                } else {
                  const BLUE = '\x1b[34m'
                  const UNDERLINE = '\x1b[4m'
                  const RESET = '\x1b[0m'
                  const url = `${protocol}://${host}:${port}/`
                  // eslint-disable-next-line no-console
                  console.log(`\n  ➜  Local:   ${BLUE}${UNDERLINE}${url}${RESET}\n`)
                }
              } catch (e) {
                // ignore
              }
            })
          }
        }
      }
    })(),
    /* eslint-enable @typescript-eslint/no-explicit-any */
  ],
  logLevel: 'silent',
})
