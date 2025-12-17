import 'reflect-metadata'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, net, protocol, shell } from 'electron'
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'
import { createIPCHandler } from 'electron-trpc/main'
import { join } from 'path'
import { pathToFileURL } from 'url'
// @ts-ignore - no types
import iconDarwin from '../../resources/app-icons/mac/app-icon.icns?asset'
// @ts-ignore - no types
import icon from '../../resources/app-icons/win/app-icon.ico?asset'
import { initIpcListeners } from './listeners/ipc'
import { router } from './router/routes'
import { logger } from './utils/logger'

import './services/db'

// Register custom protocol for secure local file access
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'liberty-file',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    minWidth: 850,
    autoHideMenuBar: true,
    ...(process.platform !== 'darwin' ? { icon } : { icon: iconDarwin }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true,
    },
  })

  createIPCHandler({ router, windows: [mainWindow] })

  // IPC: main -> Renderer
  // const menu = Menu.buildFromTemplate([
  //   {
  //     label: app.name,
  //     submenu: [
  //       {
  //         click: () => mainWindow.webContents.send('update-counter', 1),
  //         label: 'Increment',
  //       },
  //       {
  //         click: () => mainWindow.webContents.send('update-counter', -1),
  //         label: 'Decrement',
  //       },
  //     ],
  //   },
  // ])

  // Menu.setApplicationMenu(menu)

  initIpcListeners(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
    logger.debug('User data path:', app.getPath('userData'))
    
    // Open DevTools in development
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
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
  // Register protocol handler for local files
  protocol.handle('liberty-file', (request) => {
    const filePath = request.url.replace('liberty-file://', '')
    return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString())
  })

  await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], {
    loadExtensionOptions: {
      allowFileAccess: true,
    },
  })
    .then((name) => logger.debug('Added Extension:', name))
    .catch((err) => logger.error('Error installing extension:', err))

  // IPC: Call Renderer -> main
  // ipcMain.on('counter-value', (_event, value) => {
  //   console.log(value) // will print value to Node console
  // })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.pulsar-a.liberty')

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
