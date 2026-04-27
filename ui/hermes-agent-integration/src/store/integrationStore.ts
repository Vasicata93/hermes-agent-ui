import { create } from 'zustand';
import { IConnector, ISkill, ConnectorStatus } from '../types/integration';

interface IntegrationState {
  connectors: Record<string, IConnector>;
  skills: Record<string, ISkill>;
  
  // Actions
  registerConnector: (connector: IConnector) => void;
  updateConnectorStatus: (id: string, status: ConnectorStatus) => void;
  registerSkill: (skill: ISkill) => void;
  toggleSkill: (id: string, isActive: boolean) => void;
  
  // Selectors
  getAvailableSkills: () => ISkill[];
  getActiveConnectors: () => IConnector[];
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  connectors: {},
  skills: {},

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

  toggleSkill: (id, isActive) => set((state) => {
    const skill = state.skills[id];
    if (!skill) return state;
    return {
      skills: {
        ...state.skills,
        [id]: { ...skill, isActive }
      }
    };
  }),

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
