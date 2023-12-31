import { BrowserWindow, dialog, ipcMain } from 'electron'

const handleFileOpen = (window: BrowserWindow) => async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window)
  if (!canceled) {
    return filePaths[0]
  }

  return null
}

export const initFileListeners = (mainWindow: BrowserWindow) => {
  // IPC: Call Renderer -> main + data return
  ipcMain.handle('dialog:open-file', handleFileOpen(mainWindow))
}
