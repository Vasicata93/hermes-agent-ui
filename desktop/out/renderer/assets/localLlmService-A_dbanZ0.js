import { _ as __vitePreload, R as Role } from "./index-D-WN5Dis.js";
function isWebGPUSupported() {
  return !!navigator.gpu;
}
function isWebWorkerSupported() {
  return typeof Worker !== "undefined";
}
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
function checkLocalModelSupport() {
  if (!isWebGPUSupported()) {
    if (isMobileDevice()) {
      return {
        supported: false,
        reason: "WebGPU not available on this device",
        details: "Local AI models require WebGPU, which is not yet supported on most mobile browsers. Try on a desktop Chrome/Edge browser (version 113+)."
      };
    }
    return {
      supported: false,
      reason: "WebGPU not supported in this browser",
      details: "Please use Chrome or Edge version 113+ on desktop. Make sure hardware acceleration is enabled in browser settings."
    };
  }
  if (!isWebWorkerSupported()) {
    return {
      supported: false,
      reason: "Web Workers not available",
      details: "Your browser does not support Web Workers, which are required for local models."
    };
  }
  return { supported: true };
}
class LocalLLMService {
  constructor() {
    this.engine = null;
    this.currentModelId = null;
    this.isInitializing = false;
  }
  async initModel(modelId, onProgress) {
    if (this.engine && this.currentModelId === modelId) {
      return;
    }
    if (this.isInitializing) {
      throw new Error("A model is already being downloaded. Please wait.");
    }
    const support = checkLocalModelSupport();
    if (support.supported === false) {
      throw new Error(`${support.reason}. ${support.details}`);
    }
    this.isInitializing = true;
    try {
      const { CreateWebWorkerMLCEngine } = await __vitePreload(async () => {
        const { CreateWebWorkerMLCEngine: CreateWebWorkerMLCEngine2 } = await import("./index-BSSuOVq5.js");
        return { CreateWebWorkerMLCEngine: CreateWebWorkerMLCEngine2 };
      }, true ? [] : void 0, import.meta.url).catch(() => {
        throw new Error(
          "Failed to load the WebLLM library. This may happen in environments that do not support ES modules or Web Workers."
        );
      });
      const initProgressCallback = (report) => {
        if (onProgress) {
          onProgress(Math.round(report.progress * 100), report.text);
        }
      };
      let worker;
      try {
        worker = new Worker(new URL(
          /* @vite-ignore */
          "" + new URL("llm.worker-Dm7W3vqQ.js", import.meta.url).href,
          import.meta.url
        ), {
          type: "module"
        });
      } catch (workerErr) {
        throw new Error(
          "Failed to start the AI worker process. This feature requires a modern browser with module worker support (Chrome 80+, Edge 80+)."
        );
      }
      this.engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback
      });
      this.currentModelId = modelId;
    } catch (err) {
      this.engine = null;
      this.currentModelId = null;
      const msg = err?.message || String(err);
      if (msg.includes("WebGPU") || msg.includes("gpu")) {
        throw new Error(
          "WebGPU error: Your device or browser does not properly support WebGPU. Try Chrome on a desktop with a dedicated GPU."
        );
      }
      if (msg.includes("Out of memory") || msg.includes("OOM")) {
        throw new Error(
          "Out of memory: This model is too large for your device. Try a smaller model (1B or 3B parameters)."
        );
      }
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("NetworkError")) {
        throw new Error(
          "Network error: Could not download model files. Check your internet connection and try again."
        );
      }
      throw new Error(msg || "Unknown error during model initialization.");
    } finally {
      this.isInitializing = false;
    }
  }
  async generateResponse(history, prompt, systemInstruction, onChunk) {
    if (!this.engine) {
      throw new Error(
        "Local model is not initialized. Please select and download a model first."
      );
    }
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    history.slice(-10).forEach((msg) => {
      messages.push({
        role: msg.role === Role.MODEL ? "assistant" : "user",
        content: msg.content
      });
    });
    messages.push({ role: "user", content: prompt });
    const chunks = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.7
    });
    let fullText = "";
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;
      if (onChunk && content) {
        onChunk(content);
      }
    }
    return { text: fullText };
  }
  async deleteModel(modelId) {
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        if (key.includes("webllm")) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.includes(modelId)) {
              await cache.delete(req);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to clear model cache:", e);
    }
    if (this.currentModelId === modelId) {
      this.engine = null;
      this.currentModelId = null;
    }
  }
  getLoadedModelId() {
    return this.currentModelId;
  }
  isReady() {
    return this.engine !== null && this.currentModelId !== null;
  }
}
const localLlmService = new LocalLLMService();
export {
  checkLocalModelSupport,
  isMobileDevice,
  isWebGPUSupported,
  isWebWorkerSupported,
  localLlmService
};
