import { ipcMain } from 'electron'
import { settings } from '../settings/settings'

export const initSettingsListeners = () => {
  ipcMain.on('settings:get', async (event, val) => {
    event.returnValue = settings.get(val)
  })

  ipcMain.on('settings:getAll', async (event) => {
    event.returnValue = settings.store
  })

  ipcMain.on('settings:set', async (_, key, val) => {
    settings.set(key, val)
  })

  ipcMain.on('settings:reset', async () => {
    settings.reset()
  })
}
