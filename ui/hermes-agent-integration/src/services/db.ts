const DB_NAME = "PerplexityCloneDB";
const DB_VERSION = 7; // Incremented version for schema update

export const STORES = {
  THREADS: "threads",
  SPACES: "spaces",
  NOTES: "notes",
  SETTINGS: "settings",
  MEMORIES: "memories",
  CACHE: "cache",
  BUFFER: "memory_buffer", // New Short-Term RAM
  PROJECTS: "projects", // New Project State
  CALENDAR: "calendar", // New Calendar Store
  PORTFOLIO: "portfolio", // Portfolio Assets & Positions
  PRIVATELIFE: "privatelife", // Private Life Tracker Data
};

export class DB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private useFallback = false;
  private memoryStore: Record<string, Record<string, any>> = {};

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn("IndexedDB initialization failed (using fallback):", request.error?.message || request.error);
          this.useFallback = true;
          resolve(); // Resolve anyway to use fallback
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log(
            "IndexedDB opened successfully. Stores:",
            Array.from(this.db.objectStoreNames),
          );
          resolve();
        };

        request.onupgradeneeded = (event) => {
          console.log("IndexedDB upgrade needed, version:", DB_VERSION);
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object stores if they don't exist
          Object.values(STORES).forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              console.log("Creating object store:", storeName);
              db.createObjectStore(storeName);
            }
          });
        };
      } catch (e) {
        console.error("IndexedDB initialization failed, using fallback:", e);
        this.useFallback = true;
        resolve();
      }
    });
    return this.initPromise;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    
    if (this.useFallback) {
      return this.getFromFallback<T>(storeName, key);
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          console.warn("IndexedDB get error (using fallback):", request.error?.message || request.error);
          this.useFallback = true;
          resolve(this.getFromFallback<T>(storeName, key));
        };
      } catch (e) {
        console.warn("IndexedDB get exception (using fallback):", e instanceof Error ? e.message : e);
        this.useFallback = true;
        resolve(this.getFromFallback<T>(storeName, key));
      }
    });
  }

  private getFromFallback<T>(storeName: string, key: string): T | null {
    try {
      const item = localStorage.getItem(`${DB_NAME}_${storeName}_${key}`);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (e) {
      // LocalStorage failed, try memory
    }
    if (this.memoryStore[storeName] && this.memoryStore[storeName][key]) {
      return this.memoryStore[storeName][key] as T;
    }
    return null;
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    await this.init();
    
    if (this.useFallback) {
      return this.setInFallback(storeName, key, value);
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn("IndexedDB set error (using fallback):", request.error?.message || request.error);
          this.useFallback = true;
          resolve(this.setInFallback(storeName, key, value));
        };
      } catch (e) {
        console.warn("IndexedDB set exception (using fallback):", e instanceof Error ? e.message : e);
        this.useFallback = true;
        resolve(this.setInFallback(storeName, key, value));
      }
    });
  }

  private setInFallback(storeName: string, key: string, value: any): void {
    try {
      localStorage.setItem(`${DB_NAME}_${storeName}_${key}`, JSON.stringify(value));
    } catch (e) {
      // LocalStorage failed, use memory
      if (!this.memoryStore[storeName]) {
        this.memoryStore[storeName] = {};
      }
      this.memoryStore[storeName][key] = value;
    }
  }
}

export const db = new DB();
