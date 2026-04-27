export type ConnectorAuthType = 'oauth2' | 'api_key' | 'none';

export type ConnectorStatus = 'connected' | 'disconnected' | 'error';

export interface IConnector {
  id: string;
  name: string;
  description: string;
  icon: string; // URL or Lucide icon name
  authType: ConnectorAuthType;
  status: ConnectorStatus;
  config?: Record<string, any>; // e.g., clientId for OAuth, or specific settings
  
  // Methods for the ConnectorManager to call
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  checkStatus: () => Promise<ConnectorStatus>;
}

export interface ConnectorCredential {
  connectorId: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: number;
  metadata?: Record<string, any>; // Additional data like username, workspace ID, etc.
}

export interface ToolSchemaProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: ToolSchemaProperty;
}

export interface ToolSchema {
  type: 'object';
  properties: Record<string, ToolSchemaProperty>;
  required?: string[];
}

export interface ISkill {
  id: string;
  name: string; // Must match the regex ^[a-zA-Z0-9_-]{1,64}$ for Gemini/OpenAI
  description: string;
  icon: string;
  isActive: boolean; // User toggle
  requiredConnectors: string[]; // Array of connector IDs needed
  
  // The schema that will be passed to the LLM
  schema: ToolSchema;
  
  // The actual execution function
  execute: (params: any, context?: any) => Promise<any>;
}
