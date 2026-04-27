/**
 * Python Manager — Manages the embedded Python environment and Hermes backend.
 *
 * Responsibilities:
 * 1. Detect or download a portable Python (python-build-standalone)
 * 2. Create a venv and install hermes-agent on first run
 * 3. Start the Hermes web server (FastAPI on localhost)
 * 4. Monitor health and restart if needed
 */

import { app } from 'electron'
import { spawn, ChildProcess, execSync } from 'child_process'
import { join, resolve } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { createServer } from 'net'

// Where we store the Python venv, config, etc.
const HERMES_DATA_DIR = join(app.getPath('userData'), 'hermes-data')
const VENV_DIR = join(HERMES_DATA_DIR, 'venv')
const HERMES_HOME = join(app.getPath('home'), '.hermes')

export class PythonManager {
  private process: ChildProcess | null = null
  private port: number = 9119
  private backendDir: string
  private _isRunning = false
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // In production, the backend is in the app's resources folder
    // In development, it's the parent directory (the repo root)
    if (app.isPackaged) {
      this.backendDir = join(process.resourcesPath, 'hermes-backend')
    } else {
      this.backendDir = resolve(__dirname, '../../..')
    }
  }

  /**
   * Get the path to the Python executable in our venv
   */
  private getPythonPath(): string {
    const isWin = process.platform === 'win32'
    return join(VENV_DIR, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python')
  }

  /**
   * Get the path to the hermes CLI entry point in our venv
   */
  private getHermesPath(): string {
    const isWin = process.platform === 'win32'
    return join(VENV_DIR, isWin ? 'Scripts' : 'bin', isWin ? 'hermes.exe' : 'hermes')
  }

  /**
   * Find an available port
   */
  private async findAvailablePort(startPort: number = 9119): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer()
      server.listen(startPort, '127.0.0.1', () => {
        const addr = server.address()
        const port = typeof addr === 'string' ? startPort : addr?.port || startPort
        server.close(() => resolve(port))
      })
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1))
      })
    })
  }

  /**
   * Find a system Python >= 3.11
   */
  private findSystemPython(): string | null {
    const candidates = process.platform === 'win32'
      ? ['python3', 'python', 'py -3']
      : ['python3.13', 'python3.12', 'python3.11', 'python3', 'python']

    for (const cmd of candidates) {
      try {
        const version = execSync(`${cmd} --version 2>&1`, {
          encoding: 'utf-8',
          timeout: 5000
        }).trim()
        // Parse version: "Python 3.11.x"
        const match = version.match(/Python (\d+)\.(\d+)/)
        if (match) {
          const major = parseInt(match[1])
          const minor = parseInt(match[2])
          if (major >= 3 && minor >= 11) {
            // Get full path
            const fullPath = execSync(
              process.platform === 'win32'
                ? `where ${cmd}`
                : `which ${cmd}`,
              { encoding: 'utf-8', timeout: 5000 }
            ).trim().split('\n')[0]
            console.log(`Found Python ${major}.${minor} at: ${fullPath}`)
            return fullPath
          }
        }
      } catch {
        // Skip this candidate
      }
    }
    return null
  }

  /**
   * Try to find or install uv (the fast Python installer)
   */
  private findUv(): string | null {
    const candidates = process.platform === 'win32'
      ? ['uv', join(app.getPath('home'), '.local', 'bin', 'uv.exe')]
      : ['uv', join(app.getPath('home'), '.local', 'bin', 'uv'), join(app.getPath('home'), '.cargo', 'bin', 'uv')]

    for (const cmd of candidates) {
      try {
        execSync(`${cmd} --version`, { encoding: 'utf-8', timeout: 5000 })
        return cmd
      } catch {
        // Skip
      }
    }
    return null
  }

  /**
   * Ensure the Python environment is set up.
   * First run: creates venv, installs dependencies.
   * Subsequent runs: verifies venv is intact.
   */
  async ensureSetup(): Promise<void> {
    console.log('Ensuring Python environment setup...')
    console.log('Backend dir:', this.backendDir)
    console.log('Data dir:', HERMES_DATA_DIR)

    // Create data directory
    mkdirSync(HERMES_DATA_DIR, { recursive: true })
    mkdirSync(HERMES_HOME, { recursive: true })

    // Check if venv already exists and is functional
    const pythonPath = this.getPythonPath()
    if (existsSync(pythonPath)) {
      try {
        execSync(`"${pythonPath}" -c "import hermes_cli"`, {
          encoding: 'utf-8',
          timeout: 10000,
          cwd: this.backendDir
        })
        console.log('Python venv is ready.')
        return
      } catch {
        console.log('Venv exists but hermes-agent not installed, reinstalling...')
      }
    }

    // Create venv
    console.log('Creating Python virtual environment...')

    // Try uv first (faster), fall back to system Python
    const uv = this.findUv()
    if (uv) {
      console.log('Using uv to create venv...')
      try {
        execSync(`"${uv}" venv "${VENV_DIR}" --python 3.11`, {
          encoding: 'utf-8',
          timeout: 120000,
          cwd: this.backendDir,
          stdio: 'pipe'
        })
      } catch {
        // uv might not have python 3.11, try without specific version
        execSync(`"${uv}" venv "${VENV_DIR}"`, {
          encoding: 'utf-8',
          timeout: 120000,
          cwd: this.backendDir,
          stdio: 'pipe'
        })
      }

      // Install hermes-agent with web extra (for FastAPI)
      console.log('Installing hermes-agent via uv...')
      execSync(`"${uv}" pip install --python "${pythonPath}" -e ".[web,cli,pty,mcp]"`, {
        encoding: 'utf-8',
        timeout: 600000, // 10 minutes for first install
        cwd: this.backendDir,
        stdio: 'pipe'
      })
    } else {
      // Fall back to system Python
      const systemPython = this.findSystemPython()
      if (!systemPython) {
        throw new Error(
          'Python 3.11+ not found. Please install Python from https://python.org or install uv from https://docs.astral.sh/uv/'
        )
      }

      console.log(`Using system Python: ${systemPython}`)
      execSync(`"${systemPython}" -m venv "${VENV_DIR}"`, {
        encoding: 'utf-8',
        timeout: 60000,
        cwd: this.backendDir,
        stdio: 'pipe'
      })

      // Install hermes-agent
      console.log('Installing hermes-agent via pip...')
      execSync(`"${pythonPath}" -m pip install -e ".[web,cli,pty,mcp]"`, {
        encoding: 'utf-8',
        timeout: 600000,
        cwd: this.backendDir,
        stdio: 'pipe'
      })
    }

    // Create .env from example if it doesn't exist
    const envPath = join(HERMES_HOME, '.env')
    const envExample = join(this.backendDir, '.env.example')
    if (!existsSync(envPath) && existsSync(envExample)) {
      const template = readFileSync(envExample, 'utf-8')
      writeFileSync(envPath, template)
      console.log('Created .env from template')
    }

    console.log('Python environment setup complete!')
  }

  /**
   * Start the Hermes web server (dashboard mode)
   */
  async start(): Promise<void> {
    if (this._isRunning) {
      console.log('Backend already running')
      return
    }

    this.port = await this.findAvailablePort()
    console.log(`Starting Hermes backend on port ${this.port}...`)

    const pythonPath = this.getPythonPath()

    // Start the web server via Python module
    this.process = spawn(pythonPath, [
      '-m', 'hermes_cli.main', 'dashboard',
      '--port', String(this.port),
      '--no-open'  // Don't open browser, we have Electron
    ], {
      cwd: this.backendDir,
      env: {
        ...process.env,
        HERMES_HOME: HERMES_HOME,
        HERMES_NONINTERACTIVE: '1',
        PYTHONUNBUFFERED: '1',
        VIRTUAL_ENV: VENV_DIR,
        PATH: `${join(VENV_DIR, process.platform === 'win32' ? 'Scripts' : 'bin')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.process.stdout?.on('data', (data) => {
      console.log('[Hermes Backend]', data.toString().trim())
    })

    this.process.stderr?.on('data', (data) => {
      console.error('[Hermes Backend Error]', data.toString().trim())
    })

    this.process.on('exit', (code) => {
      console.log(`Hermes backend exited with code ${code}`)
      this._isRunning = false
    })

    // Wait for the backend to be ready
    await this.waitForReady()
    this._isRunning = true

    // Start health check
    this.startHealthCheck()
  }

  /**
   * Wait for the backend to respond to health checks
   */
  private async waitForReady(timeoutMs: number = 30000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/api/status`)
        if (response.ok) {
          console.log('Hermes backend is ready!')
          return
        }
      } catch {
        // Not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error(`Backend failed to start within ${timeoutMs}ms`)
  }

  /**
   * Periodic health check
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (!this._isRunning) return
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/api/status`)
        if (!response.ok) {
          console.warn('Backend health check failed, restarting...')
          await this.restart()
        }
      } catch {
        console.warn('Backend unreachable, restarting...')
        await this.restart()
      }
    }, 15000) // Every 15 seconds
  }

  /**
   * Stop the Python backend
   */
  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    if (this.process) {
      console.log('Stopping Hermes backend...')
      this.process.kill('SIGTERM')

      // Wait up to 5 seconds for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.process?.kill('SIGKILL')
          resolve()
        }, 5000)

        this.process?.on('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      this.process = null
      this._isRunning = false
    }
  }

  /**
   * Restart the backend
   */
  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }

  /**
   * Get the port the backend is running on
   */
  getPort(): number {
    return this.port
  }

  /**
   * Check if the backend is currently running
   */
  isRunning(): boolean {
    return this._isRunning
  }

  /**
   * Get the backend base URL
   */
  getBaseUrl(): string {
    return `http://127.0.0.1:${this.port}`
  }

  /**
   * Get HERMES_HOME path
   */
  getHermesHome(): string {
    return HERMES_HOME
  }

  /**
   * Check if this is the first run (no venv yet)
   */
  isFirstRun(): boolean {
    return !existsSync(this.getPythonPath())
  }
}
