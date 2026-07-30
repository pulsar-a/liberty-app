import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { exposeElectronTRPC } from 'electron-trpc/main'
import { LoadingStatusItem } from '../../types/loader.types'
import type { SettingKeys, SettingsType } from '../../types/settings.types'

process.once('loaded', async () => {
  exposeElectronTRPC()
})

// Custom APIs for renderer
export const api = {
  settings: {
    getAll: (): Promise<SettingsType> => ipcRenderer.invoke('settings:getAll'),
    set: <Key extends SettingKeys>(
      property: Key,
      value: SettingsType[Key]
    ): Promise<SettingsType> => ipcRenderer.invoke('settings:set', property, value),
    reset: (): Promise<SettingsType> => ipcRenderer.invoke('settings:reset'),
  },

  // IPC: Renderer -> main
  setTitle: (title: string) => ipcRenderer.send('window:set-title', title),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // IPC: Renderer -> main + data return
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

  // Reader progress IPC
  onReaderProgress: (
    callback: (data: { bookId: number; percent: number; stage: string }) => void
  ) => {
    ipcRenderer.on('reader:progress', (_event, value) => callback(value))
  },
  offReaderProgress: () => {
    ipcRenderer.removeAllListeners('reader:progress')
  },

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
