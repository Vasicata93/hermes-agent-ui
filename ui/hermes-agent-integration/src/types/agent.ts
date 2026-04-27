// src/types/agent.ts

export type ConfidenceScore = 'high' | 'medium' | 'low';

export type AgentMode = 'chat' | 'agent' | 'idle';

export type ToolState = 'idle' | 'writing' | 'confirming' | 'error';

export interface Perception {
  timestamp: number;
  literalInput: string;
  realIntent: string;
  tone: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  situationModel: {
    projectState: string;
    changesSinceLastMessage: string;
    relevantMemoryContext: string;
  };
  goalAwareness: {
    mainGoal: string;
    activeSubgoals: string[];
    remainingTasks: string[];
  };
  eventDetection: {
    directionChanges: string[];
    opportunities: string[];
    blocks: string[];
  };
}

export interface SubTaskLog {
  id: string;
  timestamp: number;
  type: 'thought' | 'action' | 'result' | 'error';
  content: string;
  toolName?: string;
}

export interface SubTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs: SubTaskLog[]; // Detailed logs for this specific task
  retried?: boolean;
}

export interface ArchitectureStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  logs: SubTaskLog[];
}

export interface ActionFeedItem {
  id: string;
  timestamp: number;
  toolName: string;
  summary: string;
  status: 'pending' | 'success' | 'error';
  resultPreview?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface AgentState {
  // Perception
  currentPerception: Perception | null;
  
  // Routing & Mode
  mode: AgentMode;
  toolState: ToolState;
  
  // UI Panels
  planPanel: SubTask[];
  actionFeed: ActionFeedItem[];
  architectureSteps: ArchitectureStep[];
  
  // Thinking Indicator
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  
  // Response
  confidenceScore: ConfidenceScore | null;
  simplifyResponse: boolean;
}
