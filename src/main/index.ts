import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'
// import storage from 'electron-json-storage'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { SettingKeys, SettingValues } from '../../types/settings.types'
import { store } from '../store/store'

const handleFileOpen = (window: BrowserWindow) => async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window)
  if (!canceled) {
    return filePaths[0]
  }

  return null
}

const onAppSetSettingValue = (key: SettingKeys, value: SettingValues): Promise<SettingValues> => {
  return store.set(key, value)
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
    },
  })

  // IPC: main -> Renderer
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        {
          click: () => mainWindow.webContents.send('update-counter', 1),
          label: 'Increment',
        },
        {
          click: () => mainWindow.webContents.send('update-counter', -1),
          label: 'Decrement',
        },
      ],
    },
  ])

  Menu.setApplicationMenu(menu)

  // IPC: Call Renderer -> main
  ipcMain.on('window:set-title', (event, title) => {
    const webContents = event.sender
    const mainWindow = BrowserWindow.fromWebContents(webContents)
    mainWindow?.setTitle(title)
  })

  // IPC: Call Renderer -> main + data return
  ipcMain.handle('dialog:open-file', handleFileOpen(mainWindow))

  ipcMain.handle('settings:setValue', (_, key, value) => {
    onAppSetSettingValue(key, value)
  })

  ipcMain.on('settings:get', async (event, val) => {
    event.returnValue = store.get(val)
  })

  ipcMain.on('settings:getAll', async (event, key, val) => {
    event.returnValue = store.store
  })
  ipcMain.on('settings:set', async (_, key, val) => {
    store.set(key, val)
  })
  ipcMain.on('settings:reset', async () => {
    store.reset()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], {
    loadExtensionOptions: {
      allowFileAccess: true,
    },
  })
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err))

  // IPC: Call Renderer -> main
  ipcMain.on('counter-value', (_event, value) => {
    console.log(value) // will print value to Node console
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
