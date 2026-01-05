export {}

declare global {
  interface Window {
    electronEnv?: {
      isElectron: boolean
    }

    ipcRenderer?: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void
      off: (channel: string, listener?: (...args: unknown[]) => void) => void
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}
