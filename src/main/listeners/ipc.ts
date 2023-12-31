import { BrowserWindow } from 'electron'
import { initAppListeners } from './app'
import { initFileListeners } from './files'
import { initSettingsListeners } from './settings'

export const initIpcListeners = (mainWindow: BrowserWindow) => {
  initFileListeners(mainWindow)
  initAppListeners()
  initSettingsListeners()
}
