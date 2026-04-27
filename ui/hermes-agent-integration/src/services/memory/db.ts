import Dexie, { Table } from 'dexie';
import { EpisodicMemory, SemanticMemory, ProceduralMemory } from '../../types/memory';
import { ConnectorCredential } from '../../types/integration';

export class AgentDatabase extends Dexie {
  episodic!: Table<EpisodicMemory, number>;
  semantic!: Table<SemanticMemory, number>;
  procedural!: Table<ProceduralMemory, number>;
  connectors!: Table<ConnectorCredential, string>; // connectorId is the primary key

  constructor() {
    super('PerplexAgentDB');
    
    // Define schema
    this.version(1).stores({
      episodic: '++id, date, topic',
      semantic: '++id, category, key', // 'key' is indexed for fast lookups
      procedural: '++id, pattern'
    });

    // Version 2: Add connectors
    this.version(2).stores({
      connectors: 'connectorId'
    });

    // Version 3: Add sorting indices for semantic (updatedAt) and procedural (weight)
    this.version(3).stores({
      semantic: '++id, category, key, updatedAt',
      procedural: '++id, pattern, weight'
    });
  }
}

export const db = new AgentDatabase();
