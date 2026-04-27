/**
 * IPC Handlers — Bridge between Electron renderer and Hermes backend.
 *
 * All frontend API calls go through IPC → main process → HTTP to backend.
 * This keeps the renderer sandboxed and avoids CORS issues.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { PythonManager } from './pythonManager'

export function registerIpcHandlers(pythonManager: PythonManager): void {
  /**
   * Generic API request proxy: renderer sends { method, endpoint, body }
   * and we forward it to the local backend.
   */
  ipcMain.handle('hermes:api-request', async (_event, args: {
    method: string
    endpoint: string
    body?: any
    headers?: Record<string, string>
  }) => {
    const baseUrl = pythonManager.getBaseUrl()
    const url = `${baseUrl}${args.endpoint}`

    try {
      const fetchOptions: RequestInit = {
        method: args.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...args.headers
        }
      }

      if (args.body && args.method !== 'GET') {
        fetchOptions.body = JSON.stringify(args.body)
      }

      const response = await fetch(url, fetchOptions)
      const data = await response.json()

      return {
        ok: response.ok,
        status: response.status,
        data
      }
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: String(error)
      }
    }
  })

  /**
   * Stream API request: for chat streaming, tool progress, etc.
   * Uses Server-Sent Events or chunked responses.
   */
  ipcMain.handle('hermes:api-stream', async (event, args: {
    endpoint: string
    body?: any
  }) => {
    const baseUrl = pythonManager.getBaseUrl()
    const url = `${baseUrl}${args.endpoint}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: args.body ? JSON.stringify(args.body) : undefined
      })

      if (!response.ok) {
        return { ok: false, status: response.status, error: `HTTP ${response.status}` }
      }

      const reader = response.body?.getReader()
      if (!reader) {
        return { ok: false, error: 'No response body' }
      }

      const decoder = new TextDecoder()
      const senderWindow = BrowserWindow.fromWebContents(event.sender)

      // Read and forward chunks
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          senderWindow?.webContents.send('hermes:stream-chunk', {
            endpoint: args.endpoint,
            chunk
          })
        }
      } finally {
        reader.releaseLock()
      }

      senderWindow?.webContents.send('hermes:stream-end', {
        endpoint: args.endpoint
      })

      return { ok: true }
    } catch (error) {
      return { ok: false, error: String(error) }
    }
  })

  /**
   * Send a chat message to the Hermes agent
   */
  ipcMain.handle('hermes:send-message', async (_event, args: {
    message: string
    sessionId?: string
    agentMode?: boolean
    settings?: any
  }) => {
    const baseUrl = pythonManager.getBaseUrl()
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: args.message,
          session_id: args.sessionId,
          agent_mode: args.agentMode || false,
          settings: args.settings
        })
      })
      return await response.json()
    } catch (error) {
      return { ok: false, error: String(error) }
    }
  })

  /**
   * Get backend status
   */
  ipcMain.handle('hermes:status', async () => {
    return {
      running: pythonManager.isRunning(),
      port: pythonManager.getPort(),
      baseUrl: pythonManager.getBaseUrl(),
      hermesHome: pythonManager.getHermesHome(),
      isFirstRun: pythonManager.isFirstRun()
    }
  })

  /**
   * Restart backend
   */
  ipcMain.handle('hermes:restart-backend', async () => {
    try {
      await pythonManager.restart()
      return { ok: true, port: pythonManager.getPort() }
    } catch (error) {
      return { ok: false, error: String(error) }
    }
  })

  /**
   * Get config
   */
  ipcMain.handle('hermes:get-config', async () => {
    const baseUrl = pythonManager.getBaseUrl()
    try {
      const response = await fetch(`${baseUrl}/api/config`)
      return await response.json()
    } catch (error) {
      return { error: String(error) }
    }
  })

  /**
   * Update config
   */
  ipcMain.handle('hermes:update-config', async (_event, config: Record<string, any>) => {
    const baseUrl = pythonManager.getBaseUrl()
    try {
      const response = await fetch(`${baseUrl}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      return await response.json()
    } catch (error) {
      return { error: String(error) }
    }
  })

  /**
   * Get env vars (redacted)
   */
  ipcMain.handle('hermes:get-env', async () => {
    const baseUrl = pythonManager.getBaseUrl()
    try {
      const response = await fetch(`${baseUrl}/api/env`)
      return await response.json()
    } catch (error) {
      return { error: String(error) }
    }
  })

  /**
   * Set env var (API key, etc.)
   */
  ipcMain.handle('hermes:set-env', async (_event, args: { key: string, value: string }) => {
    const baseUrl = pythonManager.getBaseUrl()
    try {
      const response = await fetch(`${baseUrl}/api/env`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      })
      return await response.json()
    } catch (error) {
      return { error: String(error) }
    }
  })

  /**
   * Get sessions list
   */
  ipcMain.handle('hermes:get-sessions', async (_event, args?: { limit?: number, offset?: number }) => {
    const baseUrl = pythonManager.getBaseUrl()
    const params = new URLSearchParams()
    if (args?.limit) params.set('limit', String(args.limit))
    if (args?.offset) params.set('offset', String(args.offset))

    try {
      const response = await fetch(`${baseUrl}/api/sessions?${params}`)
      return await response.json()
    } catch (error) {
      return { error: String(error) }
    }
  })

  /**
   * Window controls
   */
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}
