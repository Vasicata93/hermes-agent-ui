/**
 * Auto-Updater — Checks for updates from GitHub Releases and installs them.
 */

import { BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
    mainWindow.webContents.send('updater:status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    mainWindow.webContents.send('updater:status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })

    // Ask user if they want to download
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) of Hermes Agent is available.`,
      detail: 'Would you like to download and install it?',
      buttons: ['Download', 'Later'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate()
        mainWindow.webContents.send('updater:status', { status: 'downloading' })
      }
    })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('App is up to date.')
    mainWindow.webContents.send('updater:status', { status: 'up-to-date' })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('updater:status', {
      status: 'downloading',
      percent: Math.round(progress.percent)
    })
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded, will install on quit.')
    mainWindow.webContents.send('updater:status', { status: 'downloaded' })

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded. It will be installed when you restart the app.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (error) => {
    console.error('Auto-update error:', error)
    mainWindow.webContents.send('updater:status', {
      status: 'error',
      error: error.message
    })
  })

  // Check for updates after a short delay (don't block startup)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(console.error)
  }, 10000)

  // Check every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(console.error)
  }, 4 * 60 * 60 * 1000)
}
