import { HermesApiClient } from './hermes/hermesApiClient';

export const STORES = {
  THREADS: "threads",
  SPACES: "spaces",
  NOTES: "notes",
  SETTINGS: "settings",
  MEMORIES: "memories",
  CACHE: "cache",
  BUFFER: "memory_buffer",
  PROJECTS: "projects",
  CALENDAR: "calendar",
  PORTFOLIO: "portfolio",
  PRIVATELIFE: "privatelife",
};

export class DB {
  async init(): Promise<void> {
    // No initialization needed anymore
    return Promise.resolve();
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const data = await HermesApiClient.getStore(storeName, key);
      return data as T | null;
    } catch (e) {
      console.error(`Failed to get ${key} from ${storeName}:`, e);
      return null;
    }
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    try {
      await HermesApiClient.setStore(storeName, key, value);
    } catch (e) {
      console.error(`Failed to set ${key} in ${storeName}:`, e);
    }
  }

  async put(storeName: string, value: any): Promise<void> {
    // Standard put behavior: use ID as key
    const key = value.id || value.connectorId || "default";
    return this.set(storeName, key, value);
  }

  async delete(storeName: string, key: string): Promise<void> {
    try {
      await HermesApiClient.setStore(storeName, key, null);
    } catch (e) {
      console.error(`Failed to delete ${key} from ${storeName}:`, e);
    }
  }
}

export const db = new DB();
