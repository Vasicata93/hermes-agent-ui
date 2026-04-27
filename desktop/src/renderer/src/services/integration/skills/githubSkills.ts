import { ISkill } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const searchGithubRepositoriesSkill: ISkill = {
  id: 'search_github_repositories',
  name: 'search_github_repositories',
  description: 'Search for GitHub repositories using a query string.',
  icon: 'search',
  isActive: true, // Enabled by default
  requiredConnectors: ['github'],
  
  schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query (e.g., "language:typescript machine learning")'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 5, max 10)'
      }
    },
    required: ['query']
  },
  
  execute: async (params: { query: string; limit?: number }) => {
    const creds = await connectorManager.getCredentials('github');
    if (!creds || !creds.apiKey) {
      throw new Error('GitHub credentials not found.');
    }

    const limit = params.limit || 5;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(params.query)}&per_page=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${creds.apiKey}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map to a simpler format for the LLM
    return data.items.map((item: any) => ({
      id: item.id,
      name: item.full_name,
      description: item.description,
      url: item.html_url,
      stars: item.stargazers_count,
      language: item.language
    }));
  }
};
