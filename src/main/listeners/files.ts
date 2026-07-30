import { BrowserWindow, dialog, ipcMain } from 'electron'

const handleFolderOpen = (window: BrowserWindow) => async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ['openDirectory'],
  })

  if (canceled) {
    return null
  }

  return filePaths[0]
}

export const initFileListeners = (mainWindow: BrowserWindow) => {
  ipcMain.handle('dialog:select-folder', (event) => {
    if (event.sender.id !== mainWindow.webContents.id) throw new Error('Untrusted IPC sender')
    return handleFolderOpen(mainWindow)()
  })

  return () => {
    ipcMain.removeHandler('dialog:select-folder')
  }
}
