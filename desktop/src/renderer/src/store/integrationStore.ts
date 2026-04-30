import { create } from 'zustand';
import { IConnector, ISkill, IHubSkill, ConnectorStatus } from '../types/integration';
import { HermesApiClient } from '../services/hermes/hermesApiClient';

interface IntegrationState {
  connectors: Record<string, IConnector>;
  skills: Record<string, ISkill>;
  marketplaceSkills: IHubSkill[];
  isMarketplaceLoading: boolean;
  marketplaceTotal: number;
  marketplacePage: number;
  
  // Actions
  registerConnector: (connector: IConnector) => void;
  updateConnectorStatus: (id: string, status: ConnectorStatus) => void;
  registerSkill: (skill: ISkill) => void;
  toggleSkill: (id: string, isActive: boolean) => Promise<void>;
  
  // Hub Actions
  fetchMarketplace: (query?: string, page?: number, limit?: number, source?: string) => Promise<void>;
  installSkill: (skill: IHubSkill) => Promise<boolean>;
  uninstallSkill: (name: string) => Promise<boolean>;
  refreshInstalledSkills: () => Promise<void>;
  
  // Selectors
  getAvailableSkills: () => ISkill[];
  getActiveConnectors: () => IConnector[];
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  connectors: {},
  skills: {},
  marketplaceSkills: [],
  isMarketplaceLoading: false,
  marketplaceTotal: 0,
  marketplacePage: 1,

  registerConnector: (connector) => set((state) => ({
    connectors: { ...state.connectors, [connector.id]: connector }
  })),

  updateConnectorStatus: (id, status) => set((state) => {
    const connector = state.connectors[id];
    if (!connector) return state;
    return {
      connectors: {
        ...state.connectors,
        [id]: { ...connector, status }
      }
    };
  }),

  registerSkill: (skill) => set((state) => ({
    skills: { ...state.skills, [skill.id]: skill }
  })),

  toggleSkill: async (id, isActive) => {
    const skill = get().skills[id];
    if (!skill) return;

    try {
      // Sync with backend
      await HermesApiClient.toggleSkillBackend(skill.name || id, isActive);
      
      set((state) => ({
        skills: {
          ...state.skills,
          [id]: { ...skill, isActive }
        }
      }));
    } catch (error) {
      console.error('Failed to toggle skill:', error);
      throw error;
    }
  },

  fetchMarketplace: async (query = '', page = 1, limit = 20, source?: string) => {
    set({ isMarketplaceLoading: true });
    try {
      const data = await HermesApiClient.getHubSkills(query, page, limit, source);
      set({ 
        marketplaceSkills: data.items, 
        marketplaceTotal: data.total,
        marketplacePage: data.page,
        isMarketplaceLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch marketplace:', error);
      set({ isMarketplaceLoading: false });
    }
  },

  installSkill: async (skill) => {
    try {
      await HermesApiClient.installSkill(skill.identifier);
      await get().refreshInstalledSkills();
      await get().fetchMarketplace(); // Refresh marketplace view status
      return true;
    } catch (error) {
      console.error('Failed to install skill:', error);
      return false;
    }
  },

  uninstallSkill: async (name) => {
    try {
      await HermesApiClient.uninstallSkill(name);
      await get().refreshInstalledSkills();
      await get().fetchMarketplace(); // Refresh marketplace view status
      return true;
    } catch (error) {
      console.error('Failed to uninstall skill:', error);
      return false;
    }
  },

  refreshInstalledSkills: async () => {
    try {
      const backendSkills = await HermesApiClient.getSkills();
      set((state) => {
        const newSkills = { ...state.skills };
        backendSkills.forEach((bs: any) => {
          // If the skill doesn't exist in the store, create a skeleton for it
          if (!newSkills[bs.name]) {
            newSkills[bs.name] = {
              id: bs.name,
              name: bs.name,
              description: bs.description || 'No description available',
              icon: bs.icon || 'Zap',
              isActive: bs.enabled,
              requiredConnectors: [],
              // Backend skills don't have frontend execution logic
            } as ISkill;
          } else {
            // Update existing skill status
            newSkills[bs.name] = { 
              ...newSkills[bs.name], 
              isActive: bs.enabled 
            };
          }
        });
        return { skills: newSkills };
      });
    } catch (error) {
      console.error('Failed to refresh installed skills:', error);
    }
  },

  getAvailableSkills: () => {
    const { skills, connectors } = get();
    return Object.values(skills).filter(skill => {
      if (!skill.isActive) return false;
      // Check if all required connectors are connected
      return skill.requiredConnectors.every(
        connId => connectors[connId]?.status === 'connected'
      );
    });
  },

  getActiveConnectors: () => {
    return Object.values(get().connectors).filter(c => c.status === 'connected');
  }
}));
