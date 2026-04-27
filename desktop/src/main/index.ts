/**
 * Hermes Agent Desktop — Main Process
 *
 * Orchestrates the Electron window, Python backend lifecycle,
 * IPC bridge, system tray, and auto-updates.
 */

import { app, shell, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PythonManager } from './pythonManager'
import { registerIpcHandlers } from './ipcHandlers'
import { setupAutoUpdater } from './autoUpdater'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let pythonManager: PythonManager | null = null

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#191919',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // In dev mode, load the Vite dev server URL
  // In production, load the built renderer HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Close to tray instead of quitting on macOS
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray(): void {
  // Use a simple tray icon (will be replaced with proper icon later)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAA' +
    'ABJREFUeJztzjEBAAAAwiD7p/YPJhcAAAAASUVORK5CYII='
  )

  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Hermes Agent',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: pythonManager?.isRunning() ? '● Backend Running' : '○ Backend Stopped',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Restart Backend',
      click: () => {
        pythonManager?.restart()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Hermes Agent',
      click: () => {
        (app as any).isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Hermes Agent')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.hermes.agent')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Python backend manager
  pythonManager = new PythonManager()

  // Register IPC handlers for renderer↔backend communication
  registerIpcHandlers(pythonManager)

  // Create the main window
  createWindow()

  // Create system tray
  createTray()

  // Start the Python backend
  try {
    await pythonManager.ensureSetup()

    // Notify renderer that backend is starting
    mainWindow?.webContents.send('backend-status', { status: 'starting' })

    await pythonManager.start()

    // Notify renderer that backend is ready
    mainWindow?.webContents.send('backend-status', {
      status: 'running',
      port: pythonManager.getPort()
    })
  } catch (error) {
    console.error('Failed to start Python backend:', error)
    mainWindow?.webContents.send('backend-status', {
      status: 'error',
      error: String(error)
    })
  }

  // Setup auto-updater
  setupAutoUpdater(mainWindow!)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// Second instance — focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  (app as any).isQuitting = true
  // Gracefully shutdown Python backend
  if (pythonManager) {
    await pythonManager.stop()
  }
})
