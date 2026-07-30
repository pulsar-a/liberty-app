import { BrowserWindow, ipcMain, shell, type IpcMainEvent } from 'electron'

export const initAppListeners = (mainWindow: BrowserWindow) => {
  const isTrusted = (senderId: number): boolean => senderId === mainWindow.webContents.id

  const handleSetTitle = (event: IpcMainEvent, title: unknown) => {
    if (!isTrusted(event.sender.id) || typeof title !== 'string') return
    const webContents = event.sender
    BrowserWindow.fromWebContents(webContents)?.setTitle(title)
  }
  ipcMain.on('window:set-title', handleSetTitle)

  ipcMain.handle('app:open-external', async (event, value: unknown) => {
    if (!isTrusted(event.sender.id) || typeof value !== 'string') return false

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

  return () => {
    ipcMain.removeListener('window:set-title', handleSetTitle)
    ipcMain.removeHandler('app:open-external')
  }
}
