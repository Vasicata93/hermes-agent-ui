import { create } from 'zustand';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  minRamMB: number;
  url: string;
  filename: string;
  status: 'uninstalled' | 'downloading' | 'installed' | 'active';
  progress: number;
  path?: string;
}

interface ModelStore {
  models: ModelCatalogEntry[];
  sysResources: any | null;
  isLoading: boolean;
  
  fetchCatalog: () => Promise<void>;
  fetchSysResources: () => Promise<void>;
  downloadModel: (id: string) => Promise<void>;
  stopDownload: (id: string) => Promise<void>;
  startRuntime: (id: string) => Promise<void>;
  stopRuntime: () => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  updateModels: (models: ModelCatalogEntry[]) => void;
}

export const useModelStore = create<ModelStore>((set, get) => {
  // Listen for catalog updates from main process
  if (typeof window !== 'undefined' && window.hermesAPI) {
    window.hermesAPI.onModelsCatalogUpdated((models: ModelCatalogEntry[]) => {
      set({ models });
    });
  }

  return {
    models: [],
    sysResources: null,
    isLoading: false,

    fetchCatalog: async () => {
      set({ isLoading: true });
      try {
        const models = await window.hermesAPI.getModelsCatalog();
        set({ models });
      } catch (err) {
        console.error('Failed to fetch models catalog', err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchSysResources: async () => {
      try {
        const sysResources = await window.hermesAPI.getModelsSystemResources();
        set({ sysResources });
      } catch (err) {
        console.error('Failed to fetch sys resources', err);
      }
    },

    downloadModel: async (id: string) => {
      const { sysResources, models } = get();
      const model = models.find(m => m.id === id);
      
      if (model && sysResources && sysResources.totalRamMB < model.minRamMB) {
         console.warn(`Warning: System RAM (${sysResources.totalRamMB}MB) is less than recommended (${model.minRamMB}MB)`);
      }

      await window.hermesAPI.downloadModel(id);
    },

    stopDownload: async (id: string) => {
      await window.hermesAPI.stopDownloadModel(id);
    },

    startRuntime: async (id: string) => {
      set({ isLoading: true });
      try {
        await window.hermesAPI.startLocalRuntime(id);
        // Catalog will update via event, showing it as 'active'
      } catch (err) {
        console.error('Failed to start runtime', err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    stopRuntime: async () => {
      await window.hermesAPI.stopLocalRuntime();
    },

    deleteModel: async (id: string) => {
      try {
        await window.hermesAPI.deleteModel(id);
      } catch (err) {
        console.error('Failed to delete model', err);
        throw err;
      }
    },

    updateModels: (models: ModelCatalogEntry[]) => set({ models })
  };
});
