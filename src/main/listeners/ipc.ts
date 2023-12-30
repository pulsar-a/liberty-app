import { BrowserWindow, dialog, ipcMain } from 'electron'
import { store } from '../../store/store'

import { SettingKeys, SettingValues } from '../../../types/settings.types'

const handleFileOpen = (window: BrowserWindow) => async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window)
  if (!canceled) {
    return filePaths[0]
  }

  return null
}

const onAppSetSettingValue = (key: SettingKeys, value: SettingValues): Promise<SettingValues> => {
  return store.set(key, value)
}

export const initIpcListeners = (mainWindow: BrowserWindow) => {
  // IPC: Call Renderer -> main
  ipcMain.on('window:set-title', (event, title) => {
    const webContents = event.sender
    const mainWindow = BrowserWindow.fromWebContents(webContents)
    mainWindow?.setTitle(title)
  })

  // IPC: Call Renderer -> main + data return
  ipcMain.handle('dialog:open-file', handleFileOpen(mainWindow))

  ipcMain.handle('settings:setValue', (_, key, value) => {
    onAppSetSettingValue(key, value)
  })

  ipcMain.on('settings:get', async (event, val) => {
    event.returnValue = store.get(val)
  })

  ipcMain.on('settings:getAll', async (event) => {
    event.returnValue = store.store
  })

  ipcMain.on('settings:set', async (_, key, val) => {
    store.set(key, val)
  })

  ipcMain.on('settings:reset', async () => {
    store.reset()
  })
}
