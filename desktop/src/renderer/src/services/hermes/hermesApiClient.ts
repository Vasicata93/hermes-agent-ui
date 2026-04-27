/**
 * Hermes API Client — Adapted for Electron IPC.
 *
 * All requests go through the preload bridge (window.hermesAPI)
 * instead of making direct HTTP calls. This ensures:
 * - No CORS issues
 * - Sandboxed renderer (no direct network access needed)
 * - Backend URL is managed by the main process
 */

// Declare the hermesAPI type on window
declare global {
  interface Window {
    hermesAPI?: {
      request: (args: {
        method: string;
        endpoint: string;
        body?: any;
        headers?: Record<string, string>;
      }) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>;
      stream: (args: { endpoint: string; body?: any }) => Promise<{ ok: boolean; error?: string }>;
      sendMessage: (args: { message: string; sessionId?: string; agentMode?: boolean }) => Promise<any>;
      getStatus: () => Promise<any>;
      restartBackend: () => Promise<any>;
      getConfig: () => Promise<any>;
      updateConfig: (config: Record<string, any>) => Promise<any>;
      getEnv: () => Promise<any>;
      setEnv: (args: { key: string; value: string }) => Promise<any>;
      getSessions: (args?: { limit?: number; offset?: number }) => Promise<any>;
      getStore: (args: { storeName: string; key: string }) => Promise<any>;
      setStore: (args: { storeName: string; key: string; payload: any }) => Promise<any>;
      deleteStore: (args: { storeName: string; key: string }) => Promise<any>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      onBackendStatus: (callback: (data: any) => void) => () => void;
      onStreamChunk: (callback: (data: any) => void) => () => void;
      onStreamEnd: (callback: (data: any) => void) => () => void;
      onUpdaterStatus: (callback: (data: any) => void) => () => void;
      platform: string;
    };
  }
}

// Check if running in Electron (hermesAPI available)
const isElectron = typeof window !== 'undefined' && !!window.hermesAPI;

// Fallback base URL for development/web mode
const FALLBACK_BASE_URL = 'http://localhost:9119';

export class HermesApiClient {
  /**
   * Make a GET request to the Hermes backend
   */
  static async get(endpoint: string) {
    if (isElectron) {
      const result = await window.hermesAPI!.request({
        method: 'GET',
        endpoint
      });
      if (!result.ok) {
        throw new Error(result.error || `Hermes API error: ${result.status}`);
      }
      return result.data;
    }

    // Fallback: direct HTTP (dev mode without Electron)
    const response = await fetch(`${FALLBACK_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Make a POST request to the Hermes backend
   */
  static async post(endpoint: string, data: any) {
    if (isElectron) {
      const result = await window.hermesAPI!.request({
        method: 'POST',
        endpoint,
        body: data
      });
      if (!result.ok) {
        throw new Error(result.error || `Hermes API error: ${result.status}`);
      }
      return result.data;
    }

    const response = await fetch(`${FALLBACK_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Make a PUT request
   */
  static async put(endpoint: string, data: any) {
    if (isElectron) {
      const result = await window.hermesAPI!.request({
        method: 'PUT',
        endpoint,
        body: data
      });
      if (!result.ok) {
        throw new Error(result.error || `Hermes API error: ${result.status}`);
      }
      return result.data;
    }

    const response = await fetch(`${FALLBACK_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Make a DELETE request
   */
  static async delete(endpoint: string) {
    if (isElectron) {
      const result = await window.hermesAPI!.request({
        method: 'DELETE',
        endpoint
      });
      if (!result.ok) {
        throw new Error(result.error || `Hermes API error: ${result.status}`);
      }
      return result.data;
    }

    const response = await fetch(`${FALLBACK_BASE_URL}${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }
    return response.json();
  }

  // ===== Hermes-specific convenience methods =====

  static async sendMessage(message: string, sessionId?: string, agentMode?: boolean) {
    if (isElectron) {
      return window.hermesAPI!.sendMessage({ message, sessionId, agentMode });
    }
    return this.post('/api/chat', { message, session_id: sessionId, agent_mode: agentMode });
  }

  static async getStatus() {
    return this.get('/api/status');
  }

  static async getConfig() {
    if (isElectron) {
      return window.hermesAPI!.getConfig();
    }
    return this.get('/api/config');
  }

  static async updateConfig(config: Record<string, any>) {
    if (isElectron) {
      return window.hermesAPI!.updateConfig(config);
    }
    return this.put('/api/config', { config });
  }

  static async getEnv() {
    if (isElectron) {
      return window.hermesAPI!.getEnv();
    }
    return this.get('/api/env');
  }

  static async setEnv(key: string, value: string) {
    if (isElectron) {
      return window.hermesAPI!.setEnv({ key, value });
    }
    return this.put('/api/env', { key, value });
  }

  static async getSessions(limit?: number, offset?: number) {
    if (isElectron) {
      return window.hermesAPI!.getSessions({ limit, offset });
    }
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return this.get(`/api/sessions?${params}`);
  }

  static async getStore(storeName: string, key: string) {
    if (isElectron) {
      const res = await window.hermesAPI!.getStore({ storeName, key });
      // The bridge returns { ok, data: { data: ... } } because the backend returns {data: ...}
      return res?.data?.data; 
    }
    const res = await this.get(`/api/store/${storeName}/${key}`);
    return res?.data;
  }

  static async setStore(storeName: string, key: string, payload: any) {
    if (isElectron) {
      return window.hermesAPI!.setStore({ storeName, key, payload });
    }
    return this.post(`/api/store/${storeName}/${key}`, payload);
  }

  static async deleteStore(storeName: string, key: string) {
    if (isElectron) {
      return window.hermesAPI!.deleteStore({ storeName, key });
    }
    return this.delete(`/api/store/${storeName}/${key}`);
  }

  static async getSkills() {
    return this.get('/api/skills');
  }

  static async getMemory() {
    return this.get('/api/memory');
  }

  static async createTask(taskDefinition: any) {
    return this.post('/api/tasks', taskDefinition);
  }

  // ===== Backend management (Electron only) =====

  static async getBackendStatus() {
    if (isElectron) {
      return window.hermesAPI!.getStatus();
    }
    return { running: true, port: 9119, baseUrl: FALLBACK_BASE_URL };
  }

  static async restartBackend() {
    if (isElectron) {
      return window.hermesAPI!.restartBackend();
    }
    return { ok: false, error: 'Not running in Electron' };
  }
}
