import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, createWriteStream, promises as fsPromises } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import * as os from 'os';

// Import node-llama-cpp dynamically or statically
// We will use dynamic import because node-llama-cpp v3 uses ESM.
let LlamaCpp: any = null;

// The folder where we store the downloaded models
const MODELS_DIR = join(app.getPath('userData'), 'hermes-models');

export interface ModelCatalogEntry {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  minRamMB: number;
  url: string;
  filename: string;
}

export interface ModelInstallStatus {
  id: string;
  status: 'uninstalled' | 'downloading' | 'installed' | 'active';
  progress: number;
  path?: string;
}

const CATALOG: ModelCatalogEntry[] = [
  {
    id: 'llama-3-8b-instruct',
    name: 'Llama-3 8B Instruct (Q4_K_M)',
    description: 'A fast, highly capable 8B model perfect for general tasks and coding.',
    sizeMB: 4920,
    minRamMB: 8000,
    url: 'https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q4_K_M.gguf',
    filename: 'Meta-Llama-3-8B-Instruct.Q4_K_M.gguf'
  },
  {
    id: 'phi-3-mini-4k',
    name: 'Phi-3 Mini 4k (Q4_K_M)',
    description: 'Microsofts extremely lightweight and fast 3.8B model, ideal for older hardware.',
    sizeMB: 2390,
    minRamMB: 4000,
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    filename: 'Phi-3-mini-4k-instruct-q4.gguf'
  },
  {
    id: 'mistral-7b-v0.2',
    name: 'Mistral 7B Instruct v0.2 (Q4_K_M)',
    description: 'A well-rounded, powerful 7B model by Mistral AI.',
    sizeMB: 4370,
    minRamMB: 8000,
    url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    filename: 'mistral-7b-instruct-v0.2.Q4_K_M.gguf'
  }
];

export class ModelManager {
  private activeDownloads: Map<string, AbortController> = new Map();
  private installStatus: Map<string, ModelInstallStatus> = new Map();
  
  private activeLlama: any = null; // getLlama() instance
  private activeModel: any = null; // LlamaModel instance
  private activeContext: any = null; // LlamaContext instance
  private activeChatSession: any = null; // LlamaChatSession instance
  private activeModelId: string | null = null;

  constructor() {
    if (!existsSync(MODELS_DIR)) {
      mkdirSync(MODELS_DIR, { recursive: true });
    }
    this.refreshLocalState();
  }

  /**
   * Initializes node-llama-cpp (it's ESM so we must await import)
   */
  async initLlama() {
    if (!LlamaCpp) {
      try {
        const module = await import('node-llama-cpp');
        LlamaCpp = module;
      } catch (err) {
        console.error('Failed to load node-llama-cpp', err);
      }
    }
  }

  /**
   * Scan the directory for downloaded models and update state
   */
  private async refreshLocalState() {
    const files = existsSync(MODELS_DIR) ? await fsPromises.readdir(MODELS_DIR) : [];
    
    for (const entry of CATALOG) {
      const isDownloaded = files.includes(entry.filename);
      if (isDownloaded) {
        const stats = await fsPromises.stat(join(MODELS_DIR, entry.filename));
        // Check if file size is roughly correct (e.g. > 90% of expected size to prevent broken partials showing as installed)
        // sizeMB to bytes is sizeMB * 1024 * 1024
        if (stats.size > entry.sizeMB * 1024 * 1000) {
           this.installStatus.set(entry.id, {
            id: entry.id,
            status: this.activeModelId === entry.id ? 'active' : 'installed',
            progress: 100,
            path: join(MODELS_DIR, entry.filename)
          });
          continue;
        }
      }
      
      // If we are currently downloading it, don't overwrite the state
      if (this.installStatus.get(entry.id)?.status === 'downloading') {
        continue;
      }
      
      this.installStatus.set(entry.id, {
        id: entry.id,
        status: 'uninstalled',
        progress: 0
      });
    }
  }

  getCatalog() {
    return CATALOG.map(entry => ({
      ...entry,
      ...this.installStatus.get(entry.id)
    }));
  }

  getSystemResources() {
    return {
      totalRamMB: Math.round(os.totalmem() / 1024 / 1024),
      freeRamMB: Math.round(os.freemem() / 1024 / 1024),
      platform: os.platform(),
      arch: os.arch()
    };
  }

  async downloadModel(id: string, window: BrowserWindow) {
    const entry = CATALOG.find(e => e.id === id);
    if (!entry) throw new Error('Model not found');

    if (this.activeDownloads.has(id)) {
      throw new Error('Already downloading');
    }

    const destPath = join(MODELS_DIR, entry.filename);
    const controller = new AbortController();
    this.activeDownloads.set(id, controller);

    this.installStatus.set(id, { id, status: 'downloading', progress: 0 });
    this.broadcastStatus(window);

    try {
      const response = await fetch(entry.url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error('No body in response');

      const totalBytes = Number(response.headers.get('content-length'));
      let downloadedBytes = 0;

      const fileStream = createWriteStream(destPath);
      
      // We convert Web ReadableStream to Node Readable
      const readableNode = Readable.fromWeb(response.body as any);

      readableNode.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
          const progress = Math.round((downloadedBytes / totalBytes) * 100);
          
          // Throttle updates so we don't spam IPC
          const currentStatus = this.installStatus.get(id);
          if (currentStatus && currentStatus.progress !== progress && progress % 2 === 0) {
            currentStatus.progress = progress;
            this.broadcastStatus(window);
          }
        }
      });

      await pipeline(readableNode, fileStream);

      this.installStatus.set(id, { id, status: 'installed', progress: 100, path: destPath });
      this.activeDownloads.delete(id);
      this.broadcastStatus(window);

    } catch (err: any) {
      this.activeDownloads.delete(id);
      if (err.name === 'AbortError') {
        this.installStatus.set(id, { id, status: 'uninstalled', progress: 0 });
        if (existsSync(destPath)) await fsPromises.unlink(destPath);
      } else {
        console.error('Download failed', err);
        this.installStatus.set(id, { id, status: 'uninstalled', progress: 0 });
        if (existsSync(destPath)) await fsPromises.unlink(destPath);
      }
      this.broadcastStatus(window);
      throw err;
    }
  }

  stopDownload(id: string) {
    const controller = this.activeDownloads.get(id);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(id);
    }
  }

  async startRuntime(id: string, window: BrowserWindow) {
    const entry = CATALOG.find(e => e.id === id);
    if (!entry) throw new Error('Model not found');
    
    const status = this.installStatus.get(id);
    if (!status || status.status !== 'installed') {
      throw new Error('Model is not installed or still downloading');
    }

    const sys = this.getSystemResources();
    if (sys.totalRamMB < entry.minRamMB) {
      throw new Error(\`Insufficient RAM. Model needs \${entry.minRamMB}MB, system has \${sys.totalRamMB}MB\`);
    }

    // Stop currently running model if any
    await this.stopRuntime(window);

    try {
      await this.initLlama();
      if (!LlamaCpp) throw new Error('node-llama-cpp failed to load');

      // Initialize llama.cpp
      this.activeLlama = await LlamaCpp.getLlama();
      
      // Load model
      this.activeModel = await this.activeLlama.loadModel({
        modelPath: status.path
      });

      // Create context
      this.activeContext = await this.activeModel.createContext();
      
      // Create session
      this.activeChatSession = new LlamaCpp.LlamaChatSession({
        contextSequence: this.activeContext.getSequence()
      });

      this.activeModelId = id;
      
      // Update states
      this.installStatus.forEach(s => {
        if (s.status === 'active') s.status = 'installed';
      });
      status.status = 'active';
      
      this.broadcastStatus(window);
      return true;

    } catch (err) {
      console.error('Failed to start model', err);
      await this.stopRuntime(window);
      throw err;
    }
  }

  async stopRuntime(window?: BrowserWindow) {
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
      if (status && status.status === 'active') {
        status.status = 'installed';
      }
      this.activeModelId = null;
    }
    
    if (window) this.broadcastStatus(window);
  }

  /**
   * Prompt the active model
   */
  async promptModel(message: string, onToken?: (token: string) => void) {
    if (!this.activeChatSession) {
      throw new Error('No local model is running');
    }

    const response = await this.activeChatSession.prompt(message, {
      onToken: (chunk: any) => {
        if (onToken) {
          // chunk is an array of tokens, we can decode them or let node-llama-cpp handle it
          // the onToken callback for node-llama-cpp v3 usually provides the string chunks
          // if chunk is an array of token IDs, we need to use activeModel.detokenize
          let text = '';
          if (Array.isArray(chunk)) {
             text = this.activeModel.detokenize(chunk);
          } else if (typeof chunk === 'string') {
             text = chunk;
          }
          onToken(text);
        }
      }
    });

    return response;
  }

  async deleteModel(id: string, window: BrowserWindow) {
    const entry = CATALOG.find(e => e.id === id);
    if (!entry) throw new Error('Model not found');

    if (this.activeModelId === id) {
      await this.stopRuntime(window);
    }

    const destPath = join(MODELS_DIR, entry.filename);
    if (existsSync(destPath)) {
      await fsPromises.unlink(destPath);
    }

    this.installStatus.set(id, {
      id,
      status: 'uninstalled',
      progress: 0
    });

    this.broadcastStatus(window);
    return true;
  }

  private broadcastStatus(window: BrowserWindow) {
    window.webContents.send('models:catalog-updated', this.getCatalog());
  }
}
