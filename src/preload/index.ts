import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  desktop: true,
  test: (medd) => {
    console.log('test:', medd)
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      // IPC: Renderer -> main
      setTitle: (title: string) => ipcRenderer.send('window:set-title', title),
      getAllSettings: () => ipcRenderer.invoke('app:get-all-settings'),
      setAllSettings: (settings) => ipcRenderer.invoke('app:set-all-settings', settings),

      // IPC: Renderer -> main + data return
      openFile: () => ipcRenderer.invoke('dialog:open-file'),

      // IPC: main -> Renderer
      onUpdateCounter: (callback) =>
        ipcRenderer.on('update-counter', (_event, value) => callback(value)),
      // IPC: Renderer -> main
      counterValue: (value) => ipcRenderer.send('counter-value', value),
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
