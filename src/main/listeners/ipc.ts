import { BrowserWindow } from 'electron'
import { initAppListeners } from './app'
import { initFileListeners } from './files'
import { initSettingsListeners } from './settings'

export const initIpcListeners = (mainWindow: BrowserWindow) => {
  const cleanups = [
    initFileListeners(mainWindow),
    initAppListeners(mainWindow),
    initSettingsListeners(mainWindow),
  ]
  return () => cleanups.forEach((cleanup) => cleanup())
}
