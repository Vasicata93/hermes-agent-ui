"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
const fs = require("fs");
const net = require("net");
const electronUpdater = require("electron-updater");
const os = require("os");
const promises = require("stream/promises");
const stream = require("stream");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const HERMES_DATA_DIR = path.join(electron.app.getPath("userData"), "hermes-data");
const VENV_DIR = path.join(HERMES_DATA_DIR, "venv");
const HERMES_HOME = path.join(electron.app.getPath("home"), ".hermes");
class PythonManager {
  process = null;
  port = 9119;
  backendDir;
  _isRunning = false;
  healthCheckInterval = null;
  constructor() {
    if (electron.app.isPackaged) {
      this.backendDir = path.join(process.resourcesPath, "hermes-backend");
    } else {
      this.backendDir = path.resolve(__dirname, "../../..");
    }
  }
  /**
   * Get the path to the Python executable in our venv
   */
  getPythonPath() {
    const isWin = process.platform === "win32";
    return path.join(VENV_DIR, isWin ? "Scripts" : "bin", isWin ? "python.exe" : "python");
  }
  /**
   * Get the path to the hermes CLI entry point in our venv
   */
  getHermesPath() {
    const isWin = process.platform === "win32";
    return path.join(VENV_DIR, isWin ? "Scripts" : "bin", isWin ? "hermes.exe" : "hermes");
  }
  /**
   * Find an available port
   */
  async findAvailablePort(startPort = 9119) {
    return new Promise((resolve2, reject) => {
      const server = net.createServer();
      server.listen(startPort, "127.0.0.1", () => {
        const addr = server.address();
        const port = typeof addr === "string" ? startPort : addr?.port || startPort;
        server.close(() => resolve2(port));
      });
      server.on("error", () => {
        resolve2(this.findAvailablePort(startPort + 1));
      });
    });
  }
  /**
   * Find a system Python >= 3.11
   */
  findSystemPython() {
    const candidates = process.platform === "win32" ? ["python3", "python", "py -3"] : ["python3.13", "python3.12", "python3.11", "python3", "python"];
    for (const cmd of candidates) {
      try {
        const version = child_process.execSync(`${cmd} --version 2>&1`, {
          encoding: "utf-8",
          timeout: 5e3
        }).trim();
        const match = version.match(/Python (\d+)\.(\d+)/);
        if (match) {
          const major = parseInt(match[1]);
          const minor = parseInt(match[2]);
          if (major >= 3 && minor >= 11) {
            const fullPath = child_process.execSync(
              process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`,
              { encoding: "utf-8", timeout: 5e3 }
            ).trim().split("\n")[0];
            console.log(`Found Python ${major}.${minor} at: ${fullPath}`);
            return fullPath;
          }
        }
      } catch {
      }
    }
    return null;
  }
  /**
   * Try to find or install uv (the fast Python installer)
   */
  findUv() {
    const candidates = process.platform === "win32" ? ["uv", path.join(electron.app.getPath("home"), ".local", "bin", "uv.exe")] : ["uv", path.join(electron.app.getPath("home"), ".local", "bin", "uv"), path.join(electron.app.getPath("home"), ".cargo", "bin", "uv")];
    for (const cmd of candidates) {
      try {
        child_process.execSync(`${cmd} --version`, { encoding: "utf-8", timeout: 5e3 });
        return cmd;
      } catch {
      }
    }
    return null;
  }
  /**
   * Ensure the Python environment is set up.
   * First run: creates venv, installs dependencies.
   * Subsequent runs: verifies venv is intact.
   */
  async ensureSetup() {
    console.log("Ensuring Python environment setup...");
    console.log("Backend dir:", this.backendDir);
    console.log("Data dir:", HERMES_DATA_DIR);
    fs.mkdirSync(HERMES_DATA_DIR, { recursive: true });
    fs.mkdirSync(HERMES_HOME, { recursive: true });
    const pythonPath = this.getPythonPath();
    if (fs.existsSync(pythonPath)) {
      try {
        child_process.execSync(`"${pythonPath}" -c "import hermes_cli"`, {
          encoding: "utf-8",
          timeout: 1e4,
          cwd: this.backendDir
        });
        console.log("Python venv is ready.");
        return;
      } catch {
        console.log("Venv exists but hermes-agent not installed, reinstalling...");
      }
    }
    console.log("Creating Python virtual environment...");
    const uv = this.findUv();
    if (uv) {
      console.log("Using uv to create venv...");
      try {
        child_process.execSync(`"${uv}" venv "${VENV_DIR}" --python 3.11`, {
          encoding: "utf-8",
          timeout: 12e4,
          cwd: this.backendDir,
          stdio: "pipe"
        });
      } catch {
        child_process.execSync(`"${uv}" venv "${VENV_DIR}"`, {
          encoding: "utf-8",
          timeout: 12e4,
          cwd: this.backendDir,
          stdio: "pipe"
        });
      }
      console.log("Installing hermes-agent via uv...");
      child_process.execSync(`"${uv}" pip install --python "${pythonPath}" -e ".[web,cli,pty,mcp]"`, {
        encoding: "utf-8",
        timeout: 6e5,
        // 10 minutes for first install
        cwd: this.backendDir,
        stdio: "pipe"
      });
    } else {
      const systemPython = this.findSystemPython();
      if (!systemPython) {
        throw new Error(
          "Python 3.11+ not found. Please install Python from https://python.org or install uv from https://docs.astral.sh/uv/"
        );
      }
      console.log(`Using system Python: ${systemPython}`);
      child_process.execSync(`"${systemPython}" -m venv "${VENV_DIR}"`, {
        encoding: "utf-8",
        timeout: 6e4,
        cwd: this.backendDir,
        stdio: "pipe"
      });
      console.log("Installing hermes-agent via pip...");
      child_process.execSync(`"${pythonPath}" -m pip install -e ".[web,cli,pty,mcp]"`, {
        encoding: "utf-8",
        timeout: 6e5,
        cwd: this.backendDir,
        stdio: "pipe"
      });
    }
    const envPath = path.join(HERMES_HOME, ".env");
    const envExample = path.join(this.backendDir, ".env.example");
    if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
      const template = fs.readFileSync(envExample, "utf-8");
      fs.writeFileSync(envPath, template);
      console.log("Created .env from template");
    }
    console.log("Python environment setup complete!");
  }
  /**
   * Start the Hermes web server (dashboard mode)
   */
  async start() {
    if (this._isRunning) {
      console.log("Backend already running");
      return;
    }
    this.port = await this.findAvailablePort();
    console.log(`Starting Hermes backend on port ${this.port}...`);
    const pythonPath = this.getPythonPath();
    this.process = child_process.spawn(pythonPath, [
      "-m",
      "hermes_cli.main",
      "dashboard",
      "--port",
      String(this.port),
      "--no-open"
      // Don't open browser, we have Electron
    ], {
      cwd: this.backendDir,
      env: {
        ...process.env,
        HERMES_HOME,
        HERMES_NONINTERACTIVE: "1",
        PYTHONUNBUFFERED: "1",
        VIRTUAL_ENV: VENV_DIR,
        PATH: `${path.join(VENV_DIR, process.platform === "win32" ? "Scripts" : "bin")}${process.platform === "win32" ? ";" : ":"}${process.env.PATH}`
      },
      stdio: ["pipe", "pipe", "pipe"]
    });
    this.process.stdout?.on("data", (data) => {
      console.log("[Hermes Backend]", data.toString().trim());
    });
    this.process.stderr?.on("data", (data) => {
      console.error("[Hermes Backend Error]", data.toString().trim());
    });
    this.process.on("exit", (code) => {
      console.log(`Hermes backend exited with code ${code}`);
      this._isRunning = false;
    });
    await this.waitForReady();
    this._isRunning = true;
    this.startHealthCheck();
  }
  /**
   * Wait for the backend to respond to health checks
   */
  async waitForReady(timeoutMs = 3e4) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/api/status`);
        if (response.ok) {
          console.log("Hermes backend is ready!");
          return;
        }
      } catch {
      }
      await new Promise((resolve2) => setTimeout(resolve2, 500));
    }
    throw new Error(`Backend failed to start within ${timeoutMs}ms`);
  }
  /**
   * Periodic health check
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      if (!this._isRunning) return;
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/api/status`);
        if (!response.ok) {
          console.warn("Backend health check failed, restarting...");
          await this.restart();
        }
      } catch {
        console.warn("Backend unreachable, restarting...");
        await this.restart();
      }
    }, 15e3);
  }
  /**
   * Stop the Python backend
   */
  async stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.process) {
      console.log("Stopping Hermes backend...");
      this.process.kill("SIGTERM");
      await new Promise((resolve2) => {
        const timeout = setTimeout(() => {
          this.process?.kill("SIGKILL");
          resolve2();
        }, 5e3);
        this.process?.on("exit", () => {
          clearTimeout(timeout);
          resolve2();
        });
      });
      this.process = null;
      this._isRunning = false;
    }
  }
  /**
   * Restart the backend
   */
  async restart() {
    await this.stop();
    await this.start();
  }
  /**
   * Get the port the backend is running on
   */
  getPort() {
    return this.port;
  }
  /**
   * Check if the backend is currently running
   */
  isRunning() {
    return this._isRunning;
  }
  /**
   * Get the backend base URL
   */
  getBaseUrl() {
    return `http://127.0.0.1:${this.port}`;
  }
  /**
   * Get HERMES_HOME path
   */
  getHermesHome() {
    return HERMES_HOME;
  }
  /**
   * Check if this is the first run (no venv yet)
   */
  isFirstRun() {
    return !fs.existsSync(this.getPythonPath());
  }
}
function registerIpcHandlers(pythonManager2, modelManager2) {
  electron.ipcMain.handle("hermes:api-request", async (_event, args) => {
    const baseUrl = pythonManager2.getBaseUrl();
    const url = `${baseUrl}${args.endpoint}`;
    try {
      const fetchOptions = {
        method: args.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...args.headers
        }
      };
      if (args.body && args.method !== "GET") {
        fetchOptions.body = JSON.stringify(args.body);
      }
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: String(error)
      };
    }
  });
  electron.ipcMain.handle("hermes:api-stream", async (event, args) => {
    const baseUrl = pythonManager2.getBaseUrl();
    const url = `${baseUrl}${args.endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: args.body ? JSON.stringify(args.body) : void 0
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: `HTTP ${response.status}` };
      }
      const reader = response.body?.getReader();
      if (!reader) {
        return { ok: false, error: "No response body" };
      }
      const decoder = new TextDecoder();
      const senderWindow = electron.BrowserWindow.fromWebContents(event.sender);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          senderWindow?.webContents.send("hermes:stream-chunk", {
            endpoint: args.endpoint,
            chunk
          });
        }
      } finally {
        reader.releaseLock();
      }
      senderWindow?.webContents.send("hermes:stream-end", {
        endpoint: args.endpoint
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:send-message", async (_event, args) => {
    const baseUrl = pythonManager2.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: args.message,
          session_id: args.sessionId,
          agent_mode: args.agentMode || false,
          settings: args.settings
        })
      });
      return await response.json();
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:status", async () => {
    return {
      running: pythonManager2.isRunning(),
      port: pythonManager2.getPort(),
      baseUrl: pythonManager2.getBaseUrl(),
      hermesHome: pythonManager2.getHermesHome(),
      isFirstRun: pythonManager2.isFirstRun()
    };
  });
  electron.ipcMain.handle("hermes:restart-backend", async () => {
    try {
      await pythonManager2.restart();
      return { ok: true, port: pythonManager2.getPort() };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:get-config", async () => {
    const baseUrl = pythonManager2.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/config`);
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:update-config", async (_event, config) => {
    const baseUrl = pythonManager2.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:get-env", async () => {
    const baseUrl = pythonManager2.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/env`);
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:set-env", async (_event, args) => {
    const baseUrl = pythonManager2.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/env`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      });
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:get-sessions", async (_event, args) => {
    const baseUrl = pythonManager2.getBaseUrl();
    const params = new URLSearchParams();
    if (args?.limit) params.set("limit", String(args.limit));
    if (args?.offset) params.set("offset", String(args.offset));
    try {
      const response = await fetch(`${baseUrl}/api/sessions?${params}`);
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  });
  electron.ipcMain.on("window:minimize", (event) => {
    electron.BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  electron.ipcMain.on("window:maximize", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });
  electron.ipcMain.on("window:close", (event) => {
    electron.BrowserWindow.fromWebContents(event.sender)?.close();
  });
  electron.ipcMain.handle("hermes:check-for-updates", async () => {
    try {
      const result = await electronUpdater.autoUpdater.checkForUpdates();
      return { ok: true, result };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("hermes:install-update", () => {
    electronUpdater.autoUpdater.quitAndInstall();
  });
  electron.ipcMain.handle("hermes:get-system-info", async () => {
    return {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length
    };
  });
  electron.ipcMain.handle("models:catalog", () => {
    return modelManager2.getCatalog();
  });
  electron.ipcMain.handle("models:sys-resources", () => {
    return modelManager2.getSystemResources();
  });
  electron.ipcMain.handle("models:download", async (event, args) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (!window) return { ok: false, error: "No window found" };
    try {
      modelManager2.downloadModel(args.id, window).catch((e) => console.error("Download model error:", e));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("models:stop-download", (_event, args) => {
    modelManager2.stopDownload(args.id);
    return { ok: true };
  });
  electron.ipcMain.handle("models:start-runtime", async (event, args) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (!window) return { ok: false, error: "No window found" };
    try {
      await modelManager2.startRuntime(args.id, window);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("models:stop-runtime", async (event) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    try {
      await modelManager2.stopRuntime(window);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("models:prompt", async (event, args) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (!window) return { ok: false, error: "No window" };
    try {
      const response = await modelManager2.promptModel(args.message, (token) => {
        window.webContents.send("models:token", { token });
      });
      return { ok: true, text: response };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("models:delete", async (event, id) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (!window) return { ok: false, error: "No window found" };
    try {
      await modelManager2.deleteModel(id, window);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
function setupAutoUpdater(mainWindow2) {
  electronUpdater.autoUpdater.autoDownload = false;
  electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
  electronUpdater.autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
    mainWindow2.webContents.send("updater:status", { status: "checking" });
  });
  electronUpdater.autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    mainWindow2.webContents.send("updater:status", {
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes
    });
    electron.dialog.showMessageBox(mainWindow2, {
      type: "info",
      title: "Update Available",
      message: `A new version (${info.version}) of Hermes Agent is available.`,
      detail: "Would you like to download and install it?",
      buttons: ["Download", "Later"],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        electronUpdater.autoUpdater.downloadUpdate();
        mainWindow2.webContents.send("updater:status", { status: "downloading" });
      }
    });
  });
  electronUpdater.autoUpdater.on("update-not-available", () => {
    console.log("App is up to date.");
    mainWindow2.webContents.send("updater:status", { status: "up-to-date" });
  });
  electronUpdater.autoUpdater.on("download-progress", (progress) => {
    mainWindow2.webContents.send("updater:status", {
      status: "downloading",
      percent: Math.round(progress.percent)
    });
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded, will install on quit.");
    mainWindow2.webContents.send("updater:status", { status: "downloaded" });
    electron.dialog.showMessageBox(mainWindow2, {
      type: "info",
      title: "Update Ready",
      message: "Update has been downloaded. It will be installed when you restart the app.",
      buttons: ["Restart Now", "Later"],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        electronUpdater.autoUpdater.quitAndInstall();
      }
    });
  });
  electronUpdater.autoUpdater.on("error", (error) => {
    console.error("Auto-update error:", error);
    mainWindow2.webContents.send("updater:status", {
      status: "error",
      error: error.message
    });
  });
  setTimeout(() => {
    electronUpdater.autoUpdater.checkForUpdates().catch(console.error);
  }, 1e4);
  setInterval(() => {
    electronUpdater.autoUpdater.checkForUpdates().catch(console.error);
  }, 4 * 60 * 60 * 1e3);
}
let LlamaCpp = null;
const MODELS_DIR = path.join(electron.app.getPath("userData"), "hermes-models");
const CATALOG = [
  {
    id: "llama-3-8b-instruct",
    name: "Llama-3 8B Instruct (Q4_K_M)",
    description: "A fast, highly capable 8B model perfect for general tasks and coding.",
    sizeMB: 4920,
    minRamMB: 8e3,
    url: "https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q4_K_M.gguf",
    filename: "Meta-Llama-3-8B-Instruct.Q4_K_M.gguf"
  },
  {
    id: "phi-3-mini-4k",
    name: "Phi-3 Mini 4k (Q4_K_M)",
    description: "Microsofts extremely lightweight and fast 3.8B model, ideal for older hardware.",
    sizeMB: 2390,
    minRamMB: 4e3,
    url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
    filename: "Phi-3-mini-4k-instruct-q4.gguf"
  },
  {
    id: "mistral-7b-v0.2",
    name: "Mistral 7B Instruct v0.2 (Q4_K_M)",
    description: "A well-rounded, powerful 7B model by Mistral AI.",
    sizeMB: 4370,
    minRamMB: 8e3,
    url: "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    filename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
  }
];
class ModelManager {
  activeDownloads = /* @__PURE__ */ new Map();
  installStatus = /* @__PURE__ */ new Map();
  activeLlama = null;
  // getLlama() instance
  activeModel = null;
  // LlamaModel instance
  activeContext = null;
  // LlamaContext instance
  activeChatSession = null;
  // LlamaChatSession instance
  activeModelId = null;
  constructor() {
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
    }
    this.refreshLocalState();
  }
  /**
   * Initializes node-llama-cpp (it's ESM so we must await import)
   */
  async initLlama() {
    if (!LlamaCpp) {
      try {
        const module2 = await import("node-llama-cpp");
        LlamaCpp = module2;
      } catch (err) {
        console.error("Failed to load node-llama-cpp", err);
      }
    }
  }
  /**
   * Scan the directory for downloaded models and update state
   */
  async refreshLocalState() {
    const files = fs.existsSync(MODELS_DIR) ? await fs.promises.readdir(MODELS_DIR) : [];
    for (const entry of CATALOG) {
      const isDownloaded = files.includes(entry.filename);
      if (isDownloaded) {
        const stats = await fs.promises.stat(path.join(MODELS_DIR, entry.filename));
        if (stats.size > entry.sizeMB * 1024 * 1e3) {
          this.installStatus.set(entry.id, {
            id: entry.id,
            status: this.activeModelId === entry.id ? "active" : "installed",
            progress: 100,
            path: path.join(MODELS_DIR, entry.filename)
          });
          continue;
        }
      }
      if (this.installStatus.get(entry.id)?.status === "downloading") {
        continue;
      }
      this.installStatus.set(entry.id, {
        id: entry.id,
        status: "uninstalled",
        progress: 0
      });
    }
  }
  getCatalog() {
    return CATALOG.map((entry) => ({
      ...entry,
      ...this.installStatus.get(entry.id)
    }));
  }
  getSystemResources() {
    return {
      totalRamMB: Math.round(os__namespace.totalmem() / 1024 / 1024),
      freeRamMB: Math.round(os__namespace.freemem() / 1024 / 1024),
      platform: os__namespace.platform(),
      arch: os__namespace.arch()
    };
  }
  async downloadModel(id, window) {
    const entry = CATALOG.find((e) => e.id === id);
    if (!entry) throw new Error("Model not found");
    if (this.activeDownloads.has(id)) {
      throw new Error("Already downloading");
    }
    const destPath = path.join(MODELS_DIR, entry.filename);
    const controller = new AbortController();
    this.activeDownloads.set(id, controller);
    this.installStatus.set(id, { id, status: "downloading", progress: 0 });
    this.broadcastStatus(window);
    try {
      const response = await fetch(entry.url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("No body in response");
      const totalBytes = Number(response.headers.get("content-length"));
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(destPath);
      const readableNode = stream.Readable.fromWeb(response.body);
      readableNode.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
          const progress = Math.round(downloadedBytes / totalBytes * 100);
          const currentStatus = this.installStatus.get(id);
          if (currentStatus && currentStatus.progress !== progress && progress % 2 === 0) {
            currentStatus.progress = progress;
            this.broadcastStatus(window);
          }
        }
      });
      await promises.pipeline(readableNode, fileStream);
      this.installStatus.set(id, { id, status: "installed", progress: 100, path: destPath });
      this.activeDownloads.delete(id);
      this.broadcastStatus(window);
    } catch (err) {
      this.activeDownloads.delete(id);
      if (err.name === "AbortError") {
        this.installStatus.set(id, { id, status: "uninstalled", progress: 0 });
        if (fs.existsSync(destPath)) await fs.promises.unlink(destPath);
      } else {
        console.error("Download failed", err);
        this.installStatus.set(id, { id, status: "uninstalled", progress: 0 });
        if (fs.existsSync(destPath)) await fs.promises.unlink(destPath);
      }
      this.broadcastStatus(window);
      throw err;
    }
  }
  stopDownload(id) {
    const controller = this.activeDownloads.get(id);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(id);
    }
  }
  async startRuntime(id, window) {
    const entry = CATALOG.find((e) => e.id === id);
    if (!entry) throw new Error("Model not found");
    const status = this.installStatus.get(id);
    if (!status || status.status !== "installed") {
      throw new Error("Model is not installed or still downloading");
    }
    const sys = this.getSystemResources();
    if (sys.totalRamMB < entry.minRamMB) {
      throw new Error(`Insufficient RAM. Model needs ${entry.minRamMB}MB, system has ${sys.totalRamMB}MB`);
    }
    await this.stopRuntime(window);
    try {
      await this.initLlama();
      if (!LlamaCpp) throw new Error("node-llama-cpp failed to load");
      this.activeLlama = await LlamaCpp.getLlama();
      this.activeModel = await this.activeLlama.loadModel({
        modelPath: status.path
      });
      this.activeContext = await this.activeModel.createContext();
      this.activeChatSession = new LlamaCpp.LlamaChatSession({
        contextSequence: this.activeContext.getSequence()
      });
      this.activeModelId = id;
      this.installStatus.forEach((s) => {
        if (s.status === "active") s.status = "installed";
      });
      status.status = "active";
      this.broadcastStatus(window);
      return true;
    } catch (err) {
      console.error("Failed to start model", err);
      await this.stopRuntime(window);
      throw err;
    }
  }
  async stopRuntime(window) {
    if (this.activeContext) {
      await this.activeContext.dispose();
      this.activeContext = null;
    }
    if (this.activeModel) {
      await this.activeModel.dispose();
      this.activeModel = null;
    }
    this.activeChatSession = null;
    if (this.activeModelId) {
      const status = this.installStatus.get(this.activeModelId);
      if (status && status.status === "active") {
        status.status = "installed";
      }
      this.activeModelId = null;
    }
    if (window) this.broadcastStatus(window);
  }
  /**
   * Prompt the active model
   */
  async promptModel(message, onToken) {
    if (!this.activeChatSession) {
      throw new Error("No local model is running");
    }
    const response = await this.activeChatSession.prompt(message, {
      onToken: (chunk) => {
        if (onToken) {
          let text = "";
          if (Array.isArray(chunk)) {
            text = this.activeModel.detokenize(chunk);
          } else if (typeof chunk === "string") {
            text = chunk;
          }
          onToken(text);
        }
      }
    });
    return response;
  }
  async deleteModel(id, window) {
    const entry = CATALOG.find((e) => e.id === id);
    if (!entry) throw new Error("Model not found");
    if (this.activeModelId === id) {
      await this.stopRuntime(window);
    }
    const destPath = path.join(MODELS_DIR, entry.filename);
    if (fs.existsSync(destPath)) {
      await fs.promises.unlink(destPath);
    }
    this.installStatus.set(id, {
      id,
      status: "uninstalled",
      progress: 0
    });
    this.broadcastStatus(window);
    return true;
  }
  broadcastStatus(window) {
    window.webContents.send("models:catalog-updated", this.getCatalog());
  }
}
let mainWindow = null;
let tray = null;
let pythonManager = null;
let modelManager = null;
const gotLock = electron.app.requestSingleInstanceLock();
if (!gotLock) {
  electron.app.quit();
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#191919",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && !electron.app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}
function createTray() {
  const icon = electron.nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAABJREFUeJztzjEBAAAAwiD7p/YPJhcAAAAASUVORK5CYII="
  );
  tray = new electron.Tray(icon.resize({ width: 16, height: 16 }));
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "Show Hermes Agent",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    { type: "separator" },
    {
      label: pythonManager?.isRunning() ? "● Backend Running" : "○ Backend Stopped",
      enabled: false
    },
    { type: "separator" },
    {
      label: "Restart Backend",
      click: () => {
        pythonManager?.restart();
      }
    },
    { type: "separator" },
    {
      label: "Quit Hermes Agent",
      click: () => {
        electron.app.isQuitting = true;
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("Hermes Agent");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}
electron.app.whenReady().then(async () => {
  utils.electronApp.setAppUserModelId("com.hermes.agent");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  pythonManager = new PythonManager();
  modelManager = new ModelManager();
  registerIpcHandlers(pythonManager, modelManager);
  createWindow();
  createTray();
  try {
    await pythonManager.ensureSetup();
    mainWindow?.webContents.send("backend-status", { status: "starting" });
    await pythonManager.start();
    mainWindow?.webContents.send("backend-status", {
      status: "running",
      port: pythonManager.getPort()
    });
  } catch (error) {
    console.error("Failed to start Python backend:", error);
    mainWindow?.webContents.send("backend-status", {
      status: "error",
      error: String(error)
    });
  }
  setupAutoUpdater(mainWindow);
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});
electron.app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", async () => {
  electron.app.isQuitting = true;
  if (pythonManager) {
    await pythonManager.stop();
  }
});
