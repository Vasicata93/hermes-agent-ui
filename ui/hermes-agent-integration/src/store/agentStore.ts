// src/store/agentStore.ts
import { create } from 'zustand';
import { AgentState, Perception, SubTask, ActionFeedItem, AgentMode, ToolState, ConfidenceScore, SubTaskLog, ArchitectureStep } from '../types/agent';

interface AgentStore extends AgentState {
  // Actions
  setPerception: (perception: Perception) => void;
  setMode: (mode: AgentMode) => void;
  setToolState: (state: ToolState) => void;
  
  // Architecture Steps Actions
  initArchitectureSteps: (steps: ArchitectureStep[]) => void;
  updateArchitectureStepStatus: (stepId: string, status: ArchitectureStep['status'], description?: string) => void;
  addArchitectureStepLog: (stepId: string, log: Omit<SubTaskLog, 'id' | 'timestamp'>) => void;

  // Plan Panel Actions
  setPlan: (tasks: SubTask[]) => void;
  updateTaskStatus: (taskId: string, status: SubTask['status']) => void;
  addTaskLog: (taskId: string, log: Omit<SubTaskLog, 'id' | 'timestamp'>) => void;
  
  // Action Feed Actions
  addAction: (action: ActionFeedItem) => void;
  updateAction: (actionId: string, updates: Partial<ActionFeedItem>) => void;
  
  // Thinking Actions
  setThinkingStep: (step: number, total: number, description: string) => void;
  
  // Response Actions
  setConfidence: (score: ConfidenceScore) => void;
  setSimplifyResponse: (simplify: boolean) => void;
  
  // ... other actions
  resetSession: () => void;

  // Hermes specific
  hermesConnectionStatus: 'disconnected' | 'connecting' | 'connected';
  setHermesConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
}

const initialState: AgentState & { hermesConnectionStatus: 'disconnected' | 'connecting' | 'connected' } = {
  currentPerception: null,
  mode: 'idle',
  toolState: 'idle',
  planPanel: [],
  actionFeed: [],
  architectureSteps: [],
  currentStep: 0,
  totalSteps: 0,
  stepDescription: '',
  confidenceScore: null,
  simplifyResponse: false,
  hermesConnectionStatus: 'disconnected',
};

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,

  setHermesConnectionStatus: (status) => set({ hermesConnectionStatus: status }),

  setPerception: (perception) => set({ currentPerception: perception }),
  
  setMode: (mode) => set({ mode }),
  
  setToolState: (toolState) => set({ toolState }),
  
  initArchitectureSteps: (steps) => set({ architectureSteps: steps }),

  updateArchitectureStepStatus: (stepId, status, description) =>
    set((state) => ({
      architectureSteps: state.architectureSteps.map((step) =>
        step.id === stepId ? { ...step, status, ...(description ? { description } : {}) } : step
      )
    })),

  addArchitectureStepLog: (stepId, log) =>
    set((state) => ({
      architectureSteps: state.architectureSteps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              logs: [
                ...(step.logs || []),
                {
                  ...log,
                  id: Math.random().toString(36).substring(7),
                  timestamp: Date.now(),
                },
              ],
            }
          : step
      ),
    })),

  setPlan: (tasks) => set({ planPanel: tasks }),
  
  updateTaskStatus: (taskId, status) => 
    set((state) => ({
      planPanel: state.planPanel.map((task) => 
        task.id === taskId ? { ...task, status } : task
      )
    })),
    
  addTaskLog: (taskId, log) =>
    set((state) => ({
      planPanel: state.planPanel.map((task) =>
        task.id === taskId
          ? {
              ...task,
              logs: [
                ...(task.logs || []),
                {
                  ...log,
                  id: Math.random().toString(36).substring(7),
                  timestamp: Date.now(),
                },
              ],
            }
          : task
      ),
    })),
    
  addAction: (action) => 
    set((state) => ({
      actionFeed: [action, ...state.actionFeed] // Prepend new actions
    })),
    
  updateAction: (actionId, updates) =>
    set((state) => ({
      actionFeed: state.actionFeed.map((action) =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    })),
    
  setThinkingStep: (currentStep, totalSteps, stepDescription) =>
    set({ currentStep, totalSteps, stepDescription }),
    
  setConfidence: (confidenceScore) => set({ confidenceScore }),
  
  setSimplifyResponse: (simplifyResponse) => set({ simplifyResponse }),
  
  resetSession: () => set(initialState),
}));

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).agentStore = useAgentStore;
}
