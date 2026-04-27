/**
 * Preload Script — Secure bridge between the renderer (React UI) and main process.
 *
 * Exposes `window.hermesAPI` with typed methods for:
 * - API requests (proxied through main → backend)
 * - Backend status and control
 * - Config and env management
 * - Window controls
 * - Update notifications
 */

import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for the API exposed to the renderer
export interface HermesAPI {
  // Generic API proxy
  request: (args: {
    method: string
    endpoint: string
    body?: any
    headers?: Record<string, string>
  }) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>

  // Streaming API
  stream: (args: {
    endpoint: string
    body?: any
  }) => Promise<{ ok: boolean; error?: string }>

  stream: (args: { endpoint: string; body?: any }) => Promise<{ ok: boolean; error?: string }>
  sendMessage: (args: { message: string; sessionId?: string; agentMode?: boolean; settings?: any }) => Promise<any>
  getStatus: () => Promise<any>
  restartBackend: () => Promise<any>
  getConfig: () => Promise<any>
  updateConfig: (config: Record<string, any>) => Promise<any>
  getEnv: () => Promise<any>
  setEnv: (args: { key: string; value: string }) => Promise<any>
  getSessions: (args?: { limit?: number; offset?: number }) => Promise<any>
  getStore: (args: { storeName: string; key: string }) => Promise<any>
  setStore: (args: { storeName: string; key: string; payload: any }) => Promise<any>
  deleteStore: (args: { storeName: string; key: string }) => Promise<any>
  minimize: () => void
  maximize: () => void
  close: () => void

  // Event listeners
  onBackendStatus: (callback: (data: any) => void) => () => void
  onStreamChunk: (callback: (data: any) => void) => () => void
  onStreamEnd: (callback: (data: any) => void) => () => void
  onUpdaterStatus: (callback: (data: any) => void) => () => void

  // Platform info
  platform: string
}

// Expose the API to the renderer via contextBridge
const hermesAPI: HermesAPI = {
  // Generic API request proxy
  request: (args) => ipcRenderer.invoke('hermes:api-request', args),

  // Streaming API
  stream: (args) => ipcRenderer.invoke('hermes:api-stream', args),
  sendMessage: (args) => ipcRenderer.invoke('hermes:send-message', args),
  getStatus: () => ipcRenderer.invoke('hermes:status'),
  restartBackend: () => ipcRenderer.invoke('hermes:restart-backend'),
  getConfig: () => ipcRenderer.invoke('hermes:get-config'),
  updateConfig: (config) => ipcRenderer.invoke('hermes:update-config', config),
  getEnv: () => ipcRenderer.invoke('hermes:get-env'),
  setEnv: (args) => ipcRenderer.invoke('hermes:set-env', args),
  getSessions: (args) => ipcRenderer.invoke('hermes:get-sessions', args),
  getStore: (args) => ipcRenderer.invoke('hermes:api-request', { method: 'GET', endpoint: `/api/store/${args.storeName}/${args.key}` }),
  setStore: (args) => ipcRenderer.invoke('hermes:api-request', { method: 'POST', endpoint: `/api/store/${args.storeName}/${args.key}`, body: args.payload }),
  deleteStore: (args) => ipcRenderer.invoke('hermes:api-request', { method: 'DELETE', endpoint: `/api/store/${args.storeName}/${args.key}` }),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Event listeners (returns unsubscribe function)
  onBackendStatus: (callback) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('backend-status', handler)
    return () => ipcRenderer.removeListener('backend-status', handler)
  },

  onStreamChunk: (callback) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('hermes:stream-chunk', handler)
    return () => ipcRenderer.removeListener('hermes:stream-chunk', handler)
  },

  onStreamEnd: (callback) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('hermes:stream-end', handler)
    return () => ipcRenderer.removeListener('hermes:stream-end', handler)
  },

  onUpdaterStatus: (callback) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },

  // Platform
  platform: process.platform
}

contextBridge.exposeInMainWorld('hermesAPI', hermesAPI)
