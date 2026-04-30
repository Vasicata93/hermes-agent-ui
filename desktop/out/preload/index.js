"use strict";
const electron = require("electron");
const hermesAPI = {
  // Generic API request proxy
  request: (args) => electron.ipcRenderer.invoke("hermes:api-request", args),
  // Streaming API
  stream: (args) => electron.ipcRenderer.invoke("hermes:api-stream", args),
  sendMessage: (args) => electron.ipcRenderer.invoke("hermes:send-message", args),
  getStatus: () => electron.ipcRenderer.invoke("hermes:status"),
  restartBackend: () => electron.ipcRenderer.invoke("hermes:restart-backend"),
  getConfig: () => electron.ipcRenderer.invoke("hermes:get-config"),
  updateConfig: (config) => electron.ipcRenderer.invoke("hermes:update-config", config),
  getEnv: () => electron.ipcRenderer.invoke("hermes:get-env"),
  setEnv: (args) => electron.ipcRenderer.invoke("hermes:set-env", args),
  getSessions: (args) => electron.ipcRenderer.invoke("hermes:get-sessions", args),
  getStore: (args) => electron.ipcRenderer.invoke("hermes:api-request", { method: "GET", endpoint: `/api/store/${args.storeName}/${args.key}` }),
  setStore: (args) => electron.ipcRenderer.invoke("hermes:api-request", { method: "POST", endpoint: `/api/store/${args.storeName}/${args.key}`, body: args.payload }),
  deleteStore: (args) => electron.ipcRenderer.invoke("hermes:api-request", { method: "DELETE", endpoint: `/api/store/${args.storeName}/${args.key}` }),
  // Window controls
  minimize: () => electron.ipcRenderer.send("window:minimize"),
  maximize: () => electron.ipcRenderer.send("window:maximize"),
  close: () => electron.ipcRenderer.send("window:close"),
  getSystemInfo: () => electron.ipcRenderer.invoke("hermes:get-system-info"),
  // Auto Updater
  checkForUpdates: () => electron.ipcRenderer.invoke("hermes:check-for-updates"),
  installUpdate: () => electron.ipcRenderer.invoke("hermes:install-update"),
  // Local Models
  getModelsCatalog: () => electron.ipcRenderer.invoke("models:catalog"),
  getModelsSystemResources: () => electron.ipcRenderer.invoke("models:sys-resources"),
  downloadModel: (id) => electron.ipcRenderer.invoke("models:download", { id }),
  stopDownloadModel: (id) => electron.ipcRenderer.invoke("models:stop-download", { id }),
  startLocalRuntime: (id) => electron.ipcRenderer.invoke("models:start-runtime", { id }),
  stopLocalRuntime: () => electron.ipcRenderer.invoke("models:stop-runtime"),
  promptLocalModel: (message) => electron.ipcRenderer.invoke("models:prompt", { message }),
  deleteModel: (id) => electron.ipcRenderer.invoke("models:delete", id),
  onModelsCatalogUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("models:catalog-updated", handler);
    return () => electron.ipcRenderer.removeListener("models:catalog-updated", handler);
  },
  onModelsToken: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("models:token", handler);
    return () => electron.ipcRenderer.removeListener("models:token", handler);
  },
  // Event listeners (returns unsubscribe function)
  onBackendStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("backend-status", handler);
    return () => electron.ipcRenderer.removeListener("backend-status", handler);
  },
  onStreamChunk: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("hermes:stream-chunk", handler);
    return () => electron.ipcRenderer.removeListener("hermes:stream-chunk", handler);
  },
  onStreamEnd: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("hermes:stream-end", handler);
    return () => electron.ipcRenderer.removeListener("hermes:stream-end", handler);
  },
  onUpdaterStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("updater:status", handler);
    return () => electron.ipcRenderer.removeListener("updater:status", handler);
  },
  // Platform
  platform: process.platform
};
electron.contextBridge.exposeInMainWorld("hermesAPI", hermesAPI);
