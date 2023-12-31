import { BrowserWindow, ipcMain } from 'electron'

export const initAppListeners = () => {
  // IPC: Call Renderer -> main
  ipcMain.on('window:set-title', (event, title) => {
    const webContents = event.sender
    const mainWindow = BrowserWindow.fromWebContents(webContents)
    mainWindow?.setTitle(title)
  })
}
