import { BrowserWindow, ipcMain, shell } from 'electron'

export const initAppListeners = () => {
  // IPC: Call Renderer -> main
  ipcMain.on('window:set-title', (event, title) => {
    const webContents = event.sender
    const mainWindow = BrowserWindow.fromWebContents(webContents)
    mainWindow?.setTitle(title)
  })

  ipcMain.handle('app:open-external', async (_event, value: unknown) => {
    if (typeof value !== 'string') return false

    try {
      const url = new URL(value)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false
      }
      await shell.openExternal(url.toString())
      return true
    } catch {
      return false
    }
  })
}
