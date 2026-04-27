export interface EpisodicMemory {
  id?: number;
  date: number; // timestamp
  topic: string;
  summary: string;
  outcome: string;
}

export interface SemanticMemory {
  id?: number;
  category: 'profile' | 'project' | 'preference' | 'decision' | 'rag_cache';
  key: string;
  value: string;
  updatedAt: number;
}

export interface ProceduralMemory {
  id?: number;
  pattern: string;
  action: string;
  weight: number; // importance/confidence level
}
