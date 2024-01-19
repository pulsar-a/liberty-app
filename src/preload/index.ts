import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { exposeElectronTRPC } from 'electron-trpc/main'
import { LoadingStatusItem } from '../../types/loader.types'

process.once('loaded', async () => {
  exposeElectronTRPC()
})

// Custom APIs for renderer
export const api = {
  settings: {
    get(key, defaultValue) {
      return ipcRenderer.sendSync('settings:get', key, defaultValue)
    },
    getAll() {
      return ipcRenderer.sendSync('settings:getAll')
    },
    set(property, val) {
      ipcRenderer.send('settings:set', property, val)
    },
    reset() {
      ipcRenderer.send('settings:reset')
    },
    // Other method you want to add like has(), reset(), etc.
  },

  // IPC: Renderer -> main
  setTitle: (title: string) => ipcRenderer.send('window:set-title', title),

  // IPC: Renderer -> main + data return
  openFile: () => ipcRenderer.invoke('dialog:open-file'),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),

  onAddLoaders: (callback: (items: LoadingStatusItem[]) => void) => {
    ipcRenderer.on('loader:add-items', (_event, value) => callback(value))
  },
  onUpdateLoader: (
    callback: (value: {
      id: string | number
      status: LoadingStatusItem['status']
      label?: string
      labelParams?: Record<string, string>
      subLabel?: string
      subLabelParams?: Record<string, string>
    }) => void
  ) => {
    ipcRenderer.on('loader:update-item', (_event, value) => callback(value))
  },

  // IPC: main -> Renderer
  onUpdateCounter: (callback) =>
    ipcRenderer.on('update-counter', (_event, value) => callback(value)),
  // IPC: Renderer -> main
  counterValue: (value) => ipcRenderer.send('counter-value', value),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
