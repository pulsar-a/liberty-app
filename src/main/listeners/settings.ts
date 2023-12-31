import { ipcMain } from 'electron'
import { store } from '../settings/store'

export const initSettingsListeners = () => {
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
