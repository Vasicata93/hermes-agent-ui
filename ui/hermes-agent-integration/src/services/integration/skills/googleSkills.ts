import { ISkill } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const searchGoogleDriveSkill: ISkill = {
  id: 'search_google_drive',
  name: 'search_google_drive',
  description: 'Search for files in Google Drive.',
  icon: 'google',
  isActive: true,
  requiredConnectors: ['google_workspace'],
  
  schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for Google Drive files.'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of files to return (default 5)'
      }
    },
    required: ['query']
  },
  
  execute: async (params: { query: string; limit?: number }) => {
    const creds = await connectorManager.getCredentials('google_workspace');
    if (!creds || !creds.accessToken) {
      throw new Error('Google Workspace credentials not found. Please authenticate.');
    }

    const limit = params.limit || 5;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(params.query)}&pageSize=${limit}&fields=files(id,name,mimeType,webViewLink)`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      type: file.mimeType,
      url: file.webViewLink
    }));
  }
};
