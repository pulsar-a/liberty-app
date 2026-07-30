import { BrowserWindow, ipcMain } from 'electron'
import { isSettingKey, settings, settingValueSchemas } from '../settings/settings'

export const initSettingsListeners = (mainWindow: BrowserWindow) => {
  const isTrusted = (senderId: number): boolean => senderId === mainWindow.webContents.id

  ipcMain.handle('settings:getAll', (event) => {
    if (!isTrusted(event.sender.id)) throw new Error('Untrusted IPC sender')
    return settings.store
  })

  ipcMain.handle('settings:set', (event, key: unknown, value: unknown) => {
    if (!isTrusted(event.sender.id)) throw new Error('Untrusted IPC sender')
    if (!isSettingKey(key)) throw new Error('Unknown setting')
    const parsed = settingValueSchemas[key].parse(value)
    settings.set(key, parsed)
    return settings.store
  })

  ipcMain.handle('settings:reset', (event) => {
    if (!isTrusted(event.sender.id)) throw new Error('Untrusted IPC sender')
    settings.reset()
    return settings.store
  })

  return () => {
    ipcMain.removeHandler('settings:getAll')
    ipcMain.removeHandler('settings:set')
    ipcMain.removeHandler('settings:reset')
  }
}
