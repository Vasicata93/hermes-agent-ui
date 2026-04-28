import { db } from '../db';
import { IConnector, ConnectorCredential } from '../../types/integration';
import { useIntegrationStore } from '../../store/integrationStore';
import { HermesApiClient } from '../hermes/hermesApiClient';

class ConnectorManager {
  private static instance: ConnectorManager;

  private constructor() {}

  public static getInstance(): ConnectorManager {
    if (!ConnectorManager.instance) {
      ConnectorManager.instance = new ConnectorManager();
    }
    return ConnectorManager.instance;
  }

  /**
   * Registers a new connector in the system.
   */
  public registerConnector(connector: IConnector) {
    useIntegrationStore.getState().registerConnector(connector);
    // Check initial status from DB
    this.checkAndRestoreConnection(connector.id);
  }

  /**
   * Checks if we have credentials for this connector and restores the connection state.
   */
  private async checkAndRestoreConnection(connectorId: string) {
    try {
      const creds = await db.connectors.get(connectorId);
      if (creds && (creds.accessToken || creds.apiKey)) {
        // We have credentials, assume connected for now. 
        // In a real app, we might want to validate the token here.
        useIntegrationStore.getState().updateConnectorStatus(connectorId, 'connected');
      } else {
        useIntegrationStore.getState().updateConnectorStatus(connectorId, 'disconnected');
      }
    } catch (error) {
      console.error(`Failed to restore connection for ${connectorId}`, error);
    }
  }

  /**
   * Saves credentials for a connector.
   */
  public async saveCredentials(credentials: ConnectorCredential) {
    try {
      await db.connectors.put(credentials);
      useIntegrationStore.getState().updateConnectorStatus(credentials.connectorId, 'connected');

      // SYNC TO BACKEND
      const ENV_MAP: Record<string, string> = {
        'github': 'GITHUB_TOKEN',
        'vercel': 'VERCEL_TOKEN',
        'google_workspace': 'GOOGLE_API_KEY',
        'tavily': 'TAVILY_API_KEY',
        'brave': 'BRAVE_API_KEY',
        'elevenlabs': 'ELEVENLABS_API_KEY',
      };

      const envKey = ENV_MAP[credentials.connectorId] || credentials.connectorId.toUpperCase() + '_API_KEY';
      
      const tokenToSync = credentials.apiKey || credentials.accessToken;
      if (tokenToSync) {
        await HermesApiClient.setEnv(envKey, tokenToSync).catch(err => {
            console.error(`Failed to sync connector key ${envKey} to backend`, err);
        });
      }
    } catch (error) {
      console.error(`Failed to save credentials for ${credentials.connectorId}`, error);
      throw error;
    }
  }

  /**
   * Retrieves credentials for a connector.
   */
  public async getCredentials(connectorId: string): Promise<ConnectorCredential | undefined> {
    return await db.connectors.get(connectorId);
  }

  /**
   * Removes credentials and disconnects.
   */
  public async disconnect(connectorId: string) {
    try {
      await db.connectors.delete(connectorId);
      useIntegrationStore.getState().updateConnectorStatus(connectorId, 'disconnected');
      
      const ENV_MAP: Record<string, string> = {
        'github': 'GITHUB_TOKEN',
        'vercel': 'VERCEL_TOKEN',
        'google_workspace': 'GOOGLE_API_KEY',
        'tavily': 'TAVILY_API_KEY',
        'brave': 'BRAVE_API_KEY',
        'elevenlabs': 'ELEVENLABS_API_KEY',
      };
      const envKey = ENV_MAP[connectorId] || connectorId.toUpperCase() + '_API_KEY';
      await HermesApiClient.setEnv(envKey, "").catch(err => {
         console.error(`Failed to clear connector key ${envKey} in backend`, err);
      });
    } catch (error) {
      console.error(`Failed to disconnect ${connectorId}`, error);
      throw error;
    }
  }
}

export const connectorManager = ConnectorManager.getInstance();
