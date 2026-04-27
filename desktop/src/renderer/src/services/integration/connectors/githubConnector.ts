import { IConnector } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const githubConnector: IConnector = {
  id: 'github',
  name: 'GitHub',
  description: 'Connect to GitHub to search repositories, read code, and manage issues.',
  icon: 'github', // Assuming we use lucide-react icons, we can map this later
  authType: 'api_key', // For simplicity in PoC, we'll use Personal Access Tokens
  status: 'disconnected',
  
  connect: async () => {
    // In a real app, this would trigger an OAuth flow or open a modal to ask for the API key.
    // For now, this is just a placeholder interface method. The actual connection logic 
    // (saving the key) will be handled by the UI calling connectorManager.saveCredentials.
    return true;
  },
  
  disconnect: async () => {
    await connectorManager.disconnect('github');
    return true;
  },
  
  checkStatus: async () => {
    const creds = await connectorManager.getCredentials('github');
    return creds?.apiKey ? 'connected' : 'disconnected';
  }
};
