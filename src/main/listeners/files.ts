import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as fs from 'fs'
// import * as path from 'node:path'

const handleFileOpen = (window: BrowserWindow) => async (path) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window)

  if (canceled) {
    return null
  }

  const destinationDir = path.join(__dirname, 'books')
  const destinationFile = path.join(destinationDir, 'book1.jpg')

  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }

  fs.copyFileSync(filePaths[0], destinationFile)

  return destinationFile

  // Option 2: Read the file and send it as Base64
  // const image = fs.readFileSync(originalImagePath)
  // const imageAsBase64 = image.toString('base64')
  // event.reply('image-data', imageAsBase64)
}

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
  // IPC: Call Renderer -> main + data return
  ipcMain.handle('dialog:open-file', handleFileOpen(mainWindow))
  ipcMain.handle('dialog:select-folder', handleFolderOpen(mainWindow))

  app.on('window-all-closed', () => {
    ipcMain.removeHandler('dialog:open-file')
    ipcMain.removeHandler('dialog:select-folder')
  })
}
