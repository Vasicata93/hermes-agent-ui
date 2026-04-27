import { ToolRegistry } from './ToolRegistry';
import { MemoryManager } from '../../memory/MemoryManager';
import { TavilyService } from '../../tavilyService';
import { db, STORES } from '../../db';
import { portfolioService } from '../../portfolioService';
import { safeDigitalService } from '../../safeDigitalService';

export function registerCoreTools() {
  ToolRegistry.register(
    {
      name: 'memory_retrieval',
      description: 'Fetch relevant context from memory (semantic, episodic, procedural).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional query to filter memory.'
          }
        }
      }
    },
    async (_args: { query?: string }) => {
      const context = await MemoryManager.getRelevantContext();
      return {
        success: true,
        data: context,
        summary: `Fetched ${context.semantic.length} facts and ${context.recentEpisodes.length} episodes.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'perform_search',
      description: 'Searches the web for real-time information. REQUIRED for current events, news, weather, or specific facts not in your training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The optimal search query to find the information.'
          }
        },
        required: ['query']
      }
    },
    async (args: { query: string }) => {
      try {
        // Try to get API key from settings
        const settings = await db.get<any>(STORES.SETTINGS, 'user_settings');
        const searchProvider = settings?.searchProvider || 'tavily';
        const apiKey = searchProvider === 'brave' ? settings?.braveApiKey : settings?.tavilyApiKey;
        
        if (apiKey) {
          const searchData = await TavilyService.search(args.query, apiKey, searchProvider);
          if (searchData && searchData.results) {
            return {
              success: true,
              data: searchData.results,
              summary: `Found ${searchData.results.length} web results for "${args.query}".`
            };
          } else {
            return {
              success: false,
              error: "Search returned no results or failed. Check your API key and network connection.",
              summary: `Search failed for "${args.query}".`
            };
          }
        }
        
        // Fallback mock if no API key
        return {
          success: true,
          data: { results: [`Mock result for ${args.query} (No API Key provided)`] },
          summary: `Mock search completed for "${args.query}".`
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
          summary: `Search failed for "${args.query}".`
        };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'library_tool',
      description: 'Gestionează paginile și conținutul din librăria utilizatorului.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          payload: { type: 'object' }
        },
        required: ['action']
      }
    },
    async (args: { action: string, payload?: any }) => {
      return {
        success: true,
        data: { action: args.action, payload: args.payload },
        summary: `Executed ${args.action} on library.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'workspace_tool',
      description: 'Gestionează interacțiunea cu fișierele din workspace (knowledge base).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          payload: { type: 'object' }
        },
        required: ['action']
      }
    },
    async (args: { action: string, payload?: any }, context?: any) => {
      if (!context?.llmService) {
        return {
          success: false,
          error: "LLMService not available in context",
          summary: "Failed to access workspace."
        };
      }

      const workspaceFiles = context.llmService.getWorkspaceFiles();
      
      if (args.action === 'read_files') {
        const files = args.payload?.filenames || [];
        const readResults: Record<string, string> = {};
        let notFound: string[] = [];

        files.forEach((filename: string) => {
          const file = workspaceFiles.find((f: any) => f.name === filename);
          if (file && file.content) {
            readResults[filename] = file.content;
          } else {
            notFound.push(filename);
          }
        });

        return {
          success: true,
          data: { filesRead: readResults, notFound },
          summary: `Read content of ${Object.keys(readResults).length} files. ${notFound.length > 0 ? `Not found: ${notFound.join(', ')}` : ''}`
        };
      } else if (args.action === 'search_files') {
        const queries = (args.payload?.queries || []).map((q: string) => q.toLowerCase());
        let foundCount = 0;
        const results: string[] = [];

        workspaceFiles.forEach((f: any) => {
          if (!f.content) return;
          const lines = f.content.split("\n");
          lines.forEach((line: string, idx: number) => {
            if (queries.some((q: string) => line.toLowerCase().includes(q))) {
              foundCount++;
              results.push(`File: ${f.name}, Line ${idx + 1}: ${line.trim()}`);
            }
          });
        });

        return {
          success: true,
          data: { results, foundCount },
          summary: `Searched workspace files. Found ${foundCount} matches.`
        };
      } else if (args.action === 'get_map') {
        const map = workspaceFiles.map((f: any) => f.name).join('\n');
        return {
          success: true,
          data: { map: `Workspace contains ${workspaceFiles.length} files:\n${map}` },
          summary: `Retrieved workspace map with ${workspaceFiles.length} files.`
        };
      } else if (args.action === 'semantic_search') {
        const query = (args.payload?.query || '').toLowerCase();
        let foundCount = 0;
        const results: string[] = [];

        workspaceFiles.forEach((f: any) => {
          if (!f.content) return;
          const lines = f.content.split("\n");
          lines.forEach((line: string, idx: number) => {
            if (line.toLowerCase().includes(query)) {
              foundCount++;
              results.push(`File: ${f.name}, Line ${idx + 1}: ${line.trim()}`);
            }
          });
        });

        return {
          success: true,
          data: { results, foundCount },
          summary: `Performed semantic search for "${args.payload?.query}". Found ${foundCount} matches.`
        };
      }

      return {
        success: false,
        error: `Unknown action: ${args.action}`,
        summary: `Failed to perform action on workspace.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'portfolio_tool',
      description: 'Gestionează portofoliul financiar al utilizatorului. Folosește acest tool pentru a citi date (\'read_assets\', \'read_positions\', \'read_performance\') sau pentru a face modificări (\'add_asset\', \'update_asset\', \'delete_asset\', \'add_position\', etc.).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'The action to perform (e.g., "read_assets", "add_asset", "update_position").' },
          payload: { type: 'object', description: 'The data for the action.' }
        },
        required: ['action']
      }
    },
    async (args: { action: string, payload?: any }) => {
      try {
        if (args.action.startsWith('read_')) {
          let data;
          switch (args.action) {
            case 'read_assets': data = await portfolioService.getAssets(); break;
            case 'read_positions': data = await portfolioService.getPositions(); break;
            case 'read_strategies': data = await portfolioService.getStrategies(); break;
            case 'read_performance': data = await portfolioService.getPerformance(); break;
            case 'read_historical': data = await portfolioService.getHistoricalPortfolioData(); break;
            case 'read_all': 
              data = {
                assets: await portfolioService.getAssets(),
                positions: await portfolioService.getPositions(),
                strategies: await portfolioService.getStrategies()
              };
              break;
            default: 
              return { 
                success: false, 
                error: `Invalid action "${args.action}" for portfolio tool.`,
                summary: `Failed to execute ${args.action} on portfolio.`
              };
          }
          return {
            success: true,
            data: data,
            summary: `Successfully executed ${args.action} on portfolio.`
          };
        } else {
           // Write actions are handled by UI confirmation, this is just a fallback return
           return {
            success: true,
            data: { action: args.action, payload: args.payload },
            summary: `Successfully performed ${args.action} on portfolio.`
          };
        }
      } catch (error) {
        return { success: false, error: String(error), summary: `Failed to execute ${args.action} on portfolio.` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'safe_digital_tool',
      description: 'Gestionează seiful digital (Safe Digital) al utilizatorului. Folosește acest tool pentru a citi informații (\'read_documents\', \'read_notes\', \'read_tasks\') sau pentru a gestiona fișierele (\'add_document\', \'update_document\', \'delete_document\').',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'The action to perform (e.g., "read_documents", "add_document", "update_task").' },
          payload: { type: 'object', description: 'The data for the action.' }
        },
        required: ['action']
      }
    },
    async (args: { action: string, payload?: any }) => {
      try {
        if (args.action.startsWith('read_')) {
          let data;
          switch (args.action) {
            case 'read_documents': data = await safeDigitalService.getDocuments(); break;
            case 'read_notes': data = await safeDigitalService.getNotes(); break;
            case 'read_tasks': data = await safeDigitalService.getTasks(); break;
            case 'read_all':
              data = {
                documents: await safeDigitalService.getDocuments(),
                notes: await safeDigitalService.getNotes(),
                tasks: await safeDigitalService.getTasks()
              };
              break;
            default:
              return { 
                success: false, 
                error: `Invalid action "${args.action}" for safe_digital tool.`,
                summary: `Failed to execute ${args.action} on safe_digital.`
              };
          }
          return {
            success: true,
            data: data,
            summary: `Successfully executed ${args.action} on safe_digital.`
          };
        } else {
           // Write actions are handled by UI confirmation, this is just a fallback return
           return {
            success: true,
            data: { action: args.action, payload: args.payload },
            summary: `Successfully performed ${args.action} on safe_digital.`
          };
        }
      } catch (error) {
        return { success: false, error: String(error), summary: `Failed to execute ${args.action} on safe_digital.` };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'code_execution',
      description: 'Execute code or scripts.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to execute.'
          },
          language: {
            type: 'string',
            description: 'The programming language.'
          }
        },
        required: ['code']
      }
    },
    async (args: { code: string, language?: string }) => {
      // Mock implementation for now
      return {
        success: true,
        data: { output: 'Code executed successfully (mock).' },
        summary: `Executed ${args.language || 'code'} script.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'calendar_tool',
      description: 'Gestionează evenimentele din calendarul utilizatorului. Folosește acest tool pentru a citi (\'read_events\') sau a modifica (\'add_event\', \'update_event\', \'delete_event\') calendarul.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          payload: { type: 'object' }
        },
        required: ['action']
      }
    },
    async (args: { action: string, payload?: any }) => {
      if (args.action === 'read_events') {
        return {
          success: true,
          data: { events: [] },
          summary: `Listed calendar events.`
        };
      } else {
        return {
          success: true,
          data: { action: args.action },
          summary: `Performed ${args.action} on calendar.`
        };
      }
    }
  );

  ToolRegistry.register(
    {
      name: 'get_calendar_holidays',
      description: 'Get official holidays and non-working days.',
      parameters: {
        type: 'object',
        properties: { year: { type: 'number' } },
        required: ['year']
      }
    },
    async (args: { year: number }) => {
      return {
        success: true,
        data: { holidays: [] },
        summary: `Retrieved holidays for year ${args.year}.`
      };
    }
  );



}
