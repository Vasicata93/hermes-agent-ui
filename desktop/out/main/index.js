"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
const fs = require("fs");
const net = require("net");
const electronUpdater = require("electron-updater");
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
function registerIpcHandlers(pythonManager2) {
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
let mainWindow = null;
let tray = null;
let pythonManager = null;
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
  registerIpcHandlers(pythonManager);
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
