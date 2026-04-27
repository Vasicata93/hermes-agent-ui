import {
  GoogleGenAI,
  Tool,
  FunctionDeclaration,
  Type,
  Content,
  Modality,
  ThinkingLevel,
} from "@google/genai";
import {
  Message,
  Role,
  Citation,
  Attachment,
  UserProfile,
  AiProfile,
  ModelProvider,
  LocalModelConfig,
  ProMode,
  PendingAction,
  CalendarEvent,
} from "../types";
import { MemoryService } from "./memoryService";
import { TavilyService } from "./tavilyService";
import { db, STORES } from "./db";
import { getHolidays } from "./holidayService";
import { skillManager } from "./integration/SkillManager";
import { portfolioService } from "./portfolioService";
import { safeDigitalService } from "./safeDigitalService";

// --- Tool Definitions ---

const searchToolGeneric = {
  type: "function",
  function: {
    name: "perform_search",
    description:
      "Searches the web for real-time information. REQUIRED for current events, news, weather, or specific facts not in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The optimal search query to find the information.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const libraryToolGeneric = {
  type: "function",
  function: {
    name: "library_tool",
    description:
      "Gestionează paginile și conținutul din librăria utilizatorului. Folosește acest tool pentru a citi structura ('get_structure') sau pentru a modifica pagini ('save_page', 'insert_block', 'replace_block', 'delete_block', 'update_table_cell'). CRITICAL: ONLY call 'save_page' if the user explicitly types 'save this', 'create a page', or 'remember this'.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "save_page",
            "insert_block",
            "replace_block",
            "delete_block",
            "get_structure",
            "update_table_cell",
          ],
          description: "The action to perform.",
        },
        payload: {
          type: "object",
          description: "The structured data for the action. Varies based on the action.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const libraryToolGemini: FunctionDeclaration = {
  name: "library_tool",
  description:
    "Gestionează paginile și conținutul din librăria utilizatorului. Folosește acest tool pentru a citi structura ('get_structure') sau pentru a modifica pagini ('save_page', 'insert_block', 'replace_block', 'delete_block', 'update_table_cell'). CRITICAL: ONLY call 'save_page' if the user explicitly types 'save this', 'create a page', or 'remember this'.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: [
          "save_page",
          "insert_block",
          "replace_block",
          "delete_block",
          "get_structure",
          "update_table_cell",
        ],
        description: "The action to perform.",
      },
      payload: {
        type: Type.OBJECT,
        description: "The structured data for the action. Varies based on the action.",
        properties: {
          title: { type: Type.STRING, description: "Title of the page (for save_page)" },
          content: { type: Type.STRING, description: "Content of the page (for save_page) or block" },
          blockId: { type: Type.STRING, description: "Block ID for block operations" },
          pageId: { type: Type.STRING, description: "Page ID" },
          rowIdx: { type: Type.NUMBER, description: "Row index for table operations" },
          colIdx: { type: Type.NUMBER, description: "Column index for table operations" },
        }
      },
    },
    required: ["action"],
  },
};

const workspaceToolGemini: FunctionDeclaration = {
  name: "workspace_tool",
  description:
    "Gestionează interacțiunea cu fișierele din workspace (knowledge base). Folosește acest tool pentru a citi fișiere ('read_files'), a căuta text ('search_files'), a obține harta semantică ('get_map') sau a face căutare semantică ('semantic_search').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["read_files", "search_files", "get_map", "semantic_search"],
        description: "The specific action to perform on the workspace.",
      },
      payload: {
        type: Type.OBJECT,
        description:
          "The structured data for the action. For 'read_files', provide 'filenames' (array of strings). For 'search_files', provide 'queries' (array of strings). For 'semantic_search', provide 'query' (string).",
        properties: {
          filenames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of filenames" },
          queries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of queries" },
          query: { type: Type.STRING, description: "Search query" }
        }
      },
    },
    required: ["action"],
  },
};

const workspaceToolGeneric = {
  type: "function",
  function: {
    name: "workspace_tool",
    description:
      "Gestionează interacțiunea cu fișierele din workspace (knowledge base). Folosește acest tool pentru a citi fișiere ('read_files'), a căuta text ('search_files'), a obține harta semantică ('get_map') sau a face căutare semantică ('semantic_search').",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["read_files", "search_files", "get_map", "semantic_search"],
          description: "The specific action to perform on the workspace.",
        },
        payload: {
          type: "object",
          description:
            "The structured data for the action. For 'read_files', provide 'filenames' (array). For 'search_files', provide 'queries' (array). For 'semantic_search', provide 'query' (string). For 'get_map', leave empty.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const portfolioToolGemini: FunctionDeclaration = {
  name: "portfolio_tool",
  description:
    "Gestionează portofoliul financiar al utilizatorului. Folosește acest tool pentru a citi date ('read_assets', 'read_positions', 'read_performance') sau pentru a face modificări ('add_asset', 'update_asset', 'delete_asset', 'add_position', etc.).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: [
          "read_assets",
          "read_positions",
          "read_strategies",
          "read_performance",
          "read_historical",
          "read_all",
          "add_asset",
          "update_asset",
          "delete_asset",
          "add_position",
          "update_position",
          "delete_position",
        ],
        description: "The specific action to perform on the portfolio.",
      },
      payload: {
        type: Type.STRING,
        description:
          "The structured data for the action as a minified JSON string. For 'add' actions, provide the full object JSON. For 'update' or 'delete', include the 'id' in JSON. Optional for 'read' actions.",
      },
    },
    required: ["action"],
  },
};

const safeDigitalToolGemini: FunctionDeclaration = {
  name: "safe_digital_tool",
  description:
    "Gestionează seiful digital (Safe Digital) al utilizatorului. Folosește acest tool pentru a citi informații ('read_documents', 'read_notes', 'read_tasks') sau pentru a gestiona fișierele ('add_document', 'update_document', 'delete_document').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: [
          "read_documents",
          "read_notes",
          "read_tasks",
          "read_all",
          "add_document",
          "update_document",
          "delete_document",
        ],
        description: "The specific action to perform on the safe digital.",
      },
      payload: {
        type: Type.STRING,
        description:
          "The structured data for the action as a minified JSON string. For 'add' actions, provide the full object JSON. For 'update' or 'delete', include the 'id' in JSON. Optional for 'read' actions.",
      },
    },
    required: ["action"],
  },
};

const portfolioToolGeneric = {
  type: "function",
  function: {
    name: "portfolio_tool",
    description:
      "Gestionează portofoliul financiar al utilizatorului. Folosește acest tool pentru a citi date ('read_assets', 'read_positions', 'read_performance') sau pentru a face modificări ('add_asset', 'update_asset', 'delete_asset', 'add_position', etc.).",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "read_assets",
            "read_positions",
            "read_strategies",
            "read_performance",
            "read_historical",
            "read_all",
            "add_asset",
            "update_asset",
            "delete_asset",
            "add_position",
            "update_position",
            "delete_position",
          ],
          description: "The specific action to perform on the portfolio.",
        },
        payload: {
          type: "object",
          description:
            "The structured data for the action. For 'add' actions, provide the full object. For 'update' or 'delete', include the 'id'. Optional for 'read' actions.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const safeDigitalToolGeneric = {
  type: "function",
  function: {
    name: "safe_digital_tool",
    description:
      "Gestionează seiful digital (Safe Digital) al utilizatorului. Folosește acest tool pentru a citi informații ('read_documents', 'read_notes', 'read_tasks') sau pentru a gestiona fișierele ('add_document', 'update_document', 'delete_document').",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "read_documents",
            "read_notes",
            "read_tasks",
            "read_all",
            "add_document",
            "update_document",
            "delete_document",
          ],
          description: "The specific action to perform on the safe digital.",
        },
        payload: {
          type: "object",
          description:
            "The structured data for the action. For 'add' actions, provide the full object. For 'update' or 'delete', include the 'id'. Optional for 'read' actions.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const getCalendarHolidaysToolGemini: FunctionDeclaration = {
  name: "get_calendar_holidays",
  description:
    "Get official holidays and non-working days for Romania (RO) and Germany (DE). Use this to check for holidays, religious celebrations, or public non-working days.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      year: {
        type: Type.NUMBER,
        description: "The year to get holidays for (e.g., 2024).",
      },
    },
    required: ["year"],
  },
};

const getCalendarHolidaysToolGeneric = {
  type: "function",
  function: {
    name: "get_calendar_holidays",
    description:
      "Get official holidays and non-working days for Romania (RO) and Germany (DE). Use this to check for holidays, religious celebrations, or public non-working days.",
    parameters: {
      type: "object",
      properties: {
        year: {
          type: "number",
          description: "The year to get holidays for (e.g., 2024).",
        },
      },
      required: ["year"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const calendarToolGemini: FunctionDeclaration = {
  name: "calendar_tool",
  description:
    "Gestionează evenimentele din calendarul utilizatorului. Folosește acest tool pentru a citi ('read_events') sau a modifica ('add_event', 'update_event', 'delete_event') calendarul.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["read_events", "add_event", "update_event", "delete_event"],
        description: "The specific action to perform on the calendar.",
      },
      payload: {
        type: Type.OBJECT,
        description:
          "The structured data for the action. For 'read_events', provide 'startDate' and 'endDate' (ISO strings). For 'add_event', provide 'title', 'startDate', 'endDate', etc. For 'update_event' or 'delete_event', include the 'id'.",
        properties: {
          startDate: { type: Type.STRING, description: "Start date (ISO)" },
          endDate: { type: Type.STRING, description: "End date (ISO)" },
          title: { type: Type.STRING, description: "Event title" },
          description: { type: Type.STRING, description: "Event description" },
          location: { type: Type.STRING, description: "Event location" },
          id: { type: Type.STRING, description: "Event ID" }
        }
      },
    },
    required: ["action"],
  },
};

// --- Generic Calendar Tools ---

const calendarToolGeneric = {
  type: "function",
  function: {
    name: "calendar_tool",
    description:
      "Gestionează evenimentele din calendarul utilizatorului. Folosește acest tool pentru a citi ('read_events') sau a modifica ('add_event', 'update_event', 'delete_event') calendarul.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["read_events", "add_event", "update_event", "delete_event"],
          description: "The specific action to perform on the calendar.",
        },
        payload: {
          type: "object",
          description:
            "The structured data for the action. For 'read_events', provide 'startDate' and 'endDate'. For 'add_event', provide 'title', 'startDate', 'endDate', etc. For 'update_event' or 'delete_event', include the 'id'.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const getCurrentTimeToolGeneric = {
  type: "function",
  function: {
    name: "get_current_time",
    description:
      "Get the current system date and time. Use this to orient yourself temporally before checking the calendar.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
};

const getCurrentTimeToolGemini: FunctionDeclaration = {
  name: "get_current_time",
  description:
    "Get the current system date and time. Use this to orient yourself temporally before checking the calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      format: { type: Type.STRING, description: "Optional format" }
    },
    required: [],
  },
};

import { BlockService } from "./blockService";

export class LLMService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  // Track listeners for "learning" state (brain pulse in UI)
  private learningListeners: ((isLearning: boolean) => void)[] = [];

  // Virtual Knowledge Base for Tool-based Retrieval
  public getWorkspaceFiles(): Attachment[] {
    return this.workspaceFiles;
  }

  private workspaceFiles: Attachment[] = [];

  // Models that support internal reasoning via OpenRouter
  private static readonly OPENROUTER_REASONING_MODELS = [
    "deepseek-r1",
    "deepseek-r1-0528",
    "deepseek-v3.2",
    "deepseek-v3.2-exp",
    "deepseek-v3.2-speciale",
    "deepseek-v3.1-terminus",
    "deepseek-v3.1",
    "qwen/qwq-32b",
    "qwen/qwen3-235b-a22b",
    "qwen/qwen3-30b-a3b",
    "qwen/qwen3-14b",
    "qwen/qwen3-8b",
    "qwen/qwen3-max-thinking",
    "claude-3.7-sonnet:thinking",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro-preview",
    "gemini-2.5-flash",
    "grok-4-1",
    "grok-4-1-fast",
    "minimax-m2.5",
    "minimax-m1",
    "glm-4-7",
    "magistral-medium",
    "magistral-small",
  ];

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
      }
    }
  }

  // --- Observer for UI ---
  public subscribeToLearningState(callback: (isLearning: boolean) => void) {
    this.learningListeners.push(callback);
  }

  private notifyLearningState(isLearning: boolean) {
    this.learningListeners.forEach((cb) => cb(isLearning));
  }

  private abortController: AbortController | null = null;

  public stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private async callLLMJson(
    prompt: string,
    systemInstruction: string,
    provider: ModelProvider,
    openRouterKey: string,
    openRouterModel: string,
    openAiKey: string,
    openAiModel: string,
    activeLocalModel: LocalModelConfig | undefined,
    geminiApiKey?: string,
    history: Message[] = [],
  ): Promise<any> {
    if (provider === ModelProvider.GEMINI) {
      const client = new GoogleGenAI({
        apiKey: geminiApiKey || this.apiKey || "",
      });

      // Map history for Gemini
      const contents: any[] = history.map((msg) => ({
        role: msg.role === Role.USER ? "user" : "model",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: prompt }] });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await client.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            // @ts-ignore
            signal: controller.signal
          },
        });
        clearTimeout(timeoutId);
        let jsonText = "";
        try {
          jsonText = response.text || "";
        } catch (e) {
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.text) jsonText += part.text;
            }
          }
        }
        return this.extractJson(jsonText || "{}");
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error generating JSON with Gemini:", error);
        throw error;
      }
    } else {
      let endpoint = "";
      let apiKey = "";
      let modelName = "";
      if (provider === ModelProvider.OPENAI) {
        endpoint = "https://api.openai.com/v1/chat/completions";
        apiKey = openAiKey;
        modelName = openAiModel || "gpt-4o-mini";
      } else if (provider === ModelProvider.OPENROUTER) {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = openRouterKey;
        modelName = openRouterModel || "openai/gpt-4o-mini";
      } else {
        endpoint = "http://localhost:11434/v1/chat/completions";
        modelName = activeLocalModel?.modelId || "";
        apiKey = "not-needed";
      }

      const headers: any = { "Content-Type": "application/json" };
      if (apiKey !== "not-needed")
        headers["Authorization"] = `Bearer ${apiKey}`;

      // Map history for Generic
      const messages: any[] = [{ role: "system", content: systemInstruction }];
      history.forEach((msg) => {
        messages.push({
          role: msg.role === Role.USER ? "user" : "assistant",
          content: msg.content,
        });
      });
      messages.push({ role: "user", content: prompt });

      const body = {
        model: modelName,
        messages: messages,
        response_format: { type: "json_object" },
      };

      let retryCount = 0;
      const maxRetries = 3;
      let lastError: any = null;

      while (retryCount <= maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.status === 429 && retryCount < maxRetries) {
            retryCount++;
            const delay = 2000 * retryCount;
            console.warn(`[callLLMJson] Rate limited (429) for ${provider}. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Expected JSON response, got ${contentType}: ${text.substring(0, 100)}`);
          }

          const data = await res.json();
          if (!res.ok || !data.choices || !data.choices[0]) {
            let errorMessage = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data)) || "Unknown API error";
            
            // OpenRouter specific error details
            if (data.error?.metadata?.raw) {
              errorMessage = `${errorMessage} (Details: ${data.error.metadata.raw})`;
            }
            
            throw new Error(errorMessage);
          }
          return this.extractJson(data.choices[0].message.content);
        } catch (error) {
          clearTimeout(timeoutId);
          lastError = error;
          
          if (retryCount < maxRetries && (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch')))) {
             retryCount++;
             const delay = 1000 * retryCount;
             console.warn(`[callLLMJson] Network error for ${provider}. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
             await new Promise(resolve => setTimeout(resolve, delay));
             continue;
          }
          
          console.error("Error generating JSON with provider:", provider, error);
          throw error;
        }
      }
      throw lastError || new Error("Max retries reached for JSON generation");
    }
  }

  private async triggerMemoryConsolidation(
    prompt: string,
    responseText: string,
    enableMemory: boolean,
    geminiApiKey?: string,
  ) {
    if (enableMemory) {
      await MemoryService.addToBuffer("model", responseText);
      const buffer = await MemoryService.getBuffer();
      const shouldConsolidate =
        buffer.length >= 5 ||
        prompt.toLowerCase().includes("remember this") ||
        prompt.toLowerCase().includes("salvează");
      if (shouldConsolidate) {
        this.runConsolidation(geminiApiKey);
      }
    }
  }

  // --- Simple Text Generation ---
  public async generateSimpleText(
    prompt: string,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string,
    requireJson: boolean = false
  ): Promise<string> {
    if (provider === ModelProvider.GEMINI) {
      const client = new GoogleGenAI({
        apiKey: geminiApiKey || this.apiKey || "",
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      try {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: requireJson ? "application/json" : "text/plain",
            // @ts-ignore - some versions of the SDK support signal
            signal: controller.signal
          }
        });
        clearTimeout(timeoutId);
        return response.text || "";
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error generating simple text with Gemini:", error);
        throw error;
      }
    } else {
      let endpoint = "";
      let apiKey = "";
      let modelName = "";
      if (provider === ModelProvider.OPENAI) {
        endpoint = "https://api.openai.com/v1/chat/completions";
        apiKey = openAiKey;
        modelName = openAiModel || "gpt-4o-mini";
      } else if (provider === ModelProvider.OPENROUTER) {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = openRouterKey;
        modelName = openRouterModel || "openai/gpt-4o-mini";
      } else {
        endpoint = "http://localhost:11434/v1/chat/completions";
        modelName = activeLocalModel?.modelId || "";
        apiKey = "not-needed";
      }

      const headers: any = { "Content-Type": "application/json" };
      if (apiKey !== "not-needed") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const body: any = {
        model: modelName,
        messages: [{ role: "user", content: prompt }],
      };
      
      if (requireJson) {
        if (provider === ModelProvider.OPENAI) {
          body.response_format = { type: "json_object" };
        } else if (provider === ModelProvider.OPENROUTER || provider === ModelProvider.LOCAL) {
            // Some local models and OpenRouter models support this
            body.response_format = { type: "json_object" };
        }
      }

      let response: Response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (true) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.status === 429 && retryCount < maxRetries) {
          retryCount++;
          console.warn(`[SimpleText] Rate limited (429). Retrying in ${2000 * retryCount}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          continue;
        }
        break;
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got ${contentType}: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      if (!response.ok || !data.choices || !data.choices[0]) {
        let errorMessage = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data)) || "Unknown API error";
        
        // OpenRouter specific error details
        if (data.error?.metadata?.raw) {
          errorMessage = `${errorMessage} (Details: ${data.error.metadata.raw})`;
        }
        
        throw new Error(errorMessage);
      }
      return data.choices[0].message.content || "";
    }
  }

  /**
   * Orchestrator function that implements the 3-stage agent architecture
   */
  async generateResponse(
    history: Message[],
    prompt: string,
    attachments: Attachment[],
    provider: ModelProvider,
    openRouterKey: string,
    openRouterModel: string,
    openAiKey: string,
    openAiModel: string,
    activeLocalModel: LocalModelConfig | undefined,
    useSearch: boolean,
    proMode: ProMode,
    enableMemory: boolean,
    userProfile: UserProfile,
    aiProfile: AiProfile,
    spaceSystemInstruction?: string,
    tavilyApiKey?: string,
    geminiApiKey?: string,
    searchProvider: "tavily" | "brave" = "tavily",
    braveApiKey?: string,
    onChunk?: (text: string, reasoning?: string) => void,
    useAgenticResearch: boolean = false,
  ): Promise<{
    text: string;
    citations: Citation[];
    relatedQuestions: string[];
    pendingAction?: PendingAction;
    reasoning?: string;
  }> {
    this.abortController = new AbortController();
    const shortTermHistory = history.slice(-5); // 5 messages short-term memory

    if (enableMemory) {
      await MemoryService.addToBuffer("user", prompt);
    }

    let accumulatedReasoning = "";
    const customOnChunk = (text: string, reasoning?: string) => {
      if (reasoning) accumulatedReasoning += reasoning;
      if (onChunk) onChunk(text, reasoning);
    };

    // If Agentic Research is disabled, bypass the planner and execute directly
    if (!useAgenticResearch) {
      if (onChunk) customOnChunk("", "⚡ Mod Chat Simplu (Fără etape)...\n");
      const result = await this.runCoreGeneration(
        shortTermHistory,
        prompt,
        attachments,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        useSearch,
        proMode,
        enableMemory,
        userProfile,
        aiProfile,
        spaceSystemInstruction,
        tavilyApiKey,
        geminiApiKey,
        searchProvider,
        braveApiKey,
        customOnChunk,
      );
      this.triggerMemoryConsolidation(
        prompt,
        result.text,
        enableMemory,
        geminiApiKey,
      );
      result.reasoning = accumulatedReasoning + (result.reasoning || "");
      return result;
    }

    // Stage 1: Router (Perception & Triage)
    if (onChunk) customOnChunk("", "🧠 Analizez complexitatea cererii (Routing)...\n");

    const agentBaseContext = await this.buildSystemContext(
      prompt,
      "",
      enableMemory,
      userProfile,
      aiProfile,
      spaceSystemInstruction,
      false,
      true,
    );

    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const routerSys = `${agentBaseContext}\n\nYou are the Router Agent. Analyze the user's request.
      CURRENT SYSTEM TIME: ${timeStr}

      Determine the complexity of the request:
      - "simple" -> Greeting, simple fact, quick answer, no external tool needed.
      - "medium" -> Requires 1-2 tool calls (web search, reading a file, checking calendar) but no complex multi-step planning.
      - "complex" -> Requires deep research, multi-step execution, coding, drafting large documents, comparing multiple sources.
      - "ambiguous" -> Critical information is missing to formulate a response.

      Return ONLY JSON format:
      {
        "route": "simple" | "medium" | "complex" | "ambiguous",
        "clarify_question": "If ambiguous, write ONE concise follow-up question. Otherwise leave empty.",
        "steps": ["If complex, provide an array of descriptive major steps to take..."]
      }`;

    let plan;
    try {
      plan = await this.callLLMJson(
        prompt,
        routerSys,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey,
        shortTermHistory,
      );
    } catch (e) {
      plan = { route: "medium" };
    }

    if (!this.abortController || this.abortController.signal.aborted) {
      return { text: "Oprit de utilizator.", citations: [], relatedQuestions: [] };
    }

    if (plan.route === "ambiguous" && plan.clarify_question) {
      if (onChunk) customOnChunk("", "❓ Cerific infomații suplimentare...\n");
      const resultText = plan.clarify_question;
      this.triggerMemoryConsolidation(prompt, resultText, enableMemory, geminiApiKey);
      return { text: resultText, citations: [], relatedQuestions: [], reasoning: accumulatedReasoning };
    }

    if (
      plan.route === "simple" || 
      plan.route === "medium" || 
      !plan.steps || 
      plan.steps.length === 0
    ) {
      if (onChunk) customOnChunk("", "⚡ Chat Mode: Execuție rapidă...\n");
      const result = await this.runCoreGeneration(
        shortTermHistory,
        prompt,
        attachments,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        useSearch || plan.route === "medium", // Enable search implicitly if medium
        proMode,
        enableMemory,
        userProfile,
        aiProfile,
        spaceSystemInstruction,
        tavilyApiKey,
        geminiApiKey,
        searchProvider,
        braveApiKey,
        customOnChunk,
      );
      this.triggerMemoryConsolidation( prompt, result.text, enableMemory, geminiApiKey );
      result.reasoning = accumulatedReasoning + (result.reasoning || "");
      return result;
    }

    // AGENT MODE EXECUTION (Complex)
    let researchContext = "";
    let finalCitations: Citation[] = [];
    let pendingAction: PendingAction | undefined = undefined;

    // LOOP DE EXECUȚIE (AGENT MODE)
    if (plan.steps && plan.steps.length > 0) {
      const maxIterations = 10;
      let iterations = 0;
      let todoList = [...plan.steps];
      let completedTasks: string[] = [];

      while (todoList.length > 0 && iterations < maxIterations) {
        if (!this.abortController || this.abortController.signal.aborted) break;
        iterations++;

        // A. SELECT TASK
        const currentTask = todoList.shift()!;
        if (onChunk) customOnChunk("", `\n📋 Selectez Task: "${currentTask}"...\n`);

        // B. EXECUTE & TOOL FLOW
        const executorSys = `${agentBaseContext}\n\nYou are the Executor Agent. Your current task is strictly to execute this step:
              "${currentTask}"
              
              Current gathered knowledge from previous steps:
              ${researchContext || "None yet."}
              
              Use tools if you need to gather information, search the web, read files, or check the calendar.
              If you already have the data, or you finished the tool calls, provide a factual summary of the execution result for this task.`;

        const executorOnChunk = (text: string, reasoning?: string) => {
          if (text) customOnChunk("", text); 
          if (reasoning) customOnChunk("", reasoning);
        };

        const executionResult = await this.runCoreGeneration(
          [],
          `Execute task: ${currentTask}\nOriginal objective: ${prompt}`,
          attachments,
          provider,
          openRouterKey,
          openRouterModel,
          openAiKey,
          openAiModel,
          activeLocalModel,
          true, // Tool flow enabled automatically in execution
          ProMode.STANDARD,
          false,
          userProfile,
          aiProfile,
          undefined,
          tavilyApiKey,
          geminiApiKey,
          searchProvider,
          braveApiKey,
          executorOnChunk,
          executorSys,
        );

        researchContext += `\n\n[Task Data: ${currentTask}]\n${executionResult.text}`;
        finalCitations = [...finalCitations, ...(executionResult.citations || [])];
        if (executionResult.pendingAction) pendingAction = executionResult.pendingAction;
        completedTasks.push(currentTask);

        if (!this.abortController || this.abortController.signal.aborted) break;

        // C, D, E, F: PREDICT, VERIFY, CRITIQUE, UPDATE TODO
        if (onChunk) customOnChunk("", `\n⚖️ Verific datele și actualizez planul (Critique)... \n`);

        const criticSys = `${agentBaseContext}\n\nYou are the Critic & Verify Agent.
          Original Request: ${prompt}
          Completed Tasks: ${JSON.stringify(completedTasks)}
          Pending Tasks: ${JSON.stringify(todoList)}
          Current Gathered Data: ${researchContext}
          
          TASK: Verify if the gathered data is sufficient to satisfy the original request.
          If there are glaring gaps, you MUST add ONE precise task to the TODO list to fix it.
          
          Return ONLY JSON Format:
          {
             "is_sufficient": boolean,
             "new_required_task": "string (only if is_sufficient is false and no pending task covers it, otherwise leave empty)",
             "next_logical_step": "string predicting the next action"
          }`;

        let critique;
        try {
          critique = await this.callLLMJson( prompt, criticSys, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey, [] );
        } catch(e) {
          critique = { is_sufficient: true };
        }

        if (critique.new_required_task) {
           todoList.push(critique.new_required_task);
           if (onChunk) customOnChunk("", `\n⚠️ Adaug în TODO List: "${critique.new_required_task}" \n`);
        } else if (todoList.length === 0 && !critique.is_sufficient) {
           todoList.push("Perform a final comprehensive search to fill remaining gaps.");
           if (onChunk) customOnChunk("", `\n⚠️ Fallback: Listă goală dar informații insuficiente. Adaug o căutare de final.\n`);
        }
      }
    }

    if (!this.abortController || this.abortController.signal.aborted) {
      return {
        text: "Oprit de utilizator.",
        citations: [],
        relatedQuestions: [],
      };
    }

    // Final Synthesis
    const baseSystemContext = await this.buildSystemContext(
      prompt,
      "",
      enableMemory,
      userProfile,
      aiProfile,
      spaceSystemInstruction,
      false,
      false,
    );
    const synthesizerSys = `${baseSystemContext}\n\nYou are the Expert Analyst Agent. You have conducted deep research and gathered a vast context. Your task is to synthesize this data into a final response for the user.
      
      Gathered Information:
      ${researchContext}
      
      DRAFTING RULES:
      1. Your response MUST be detailed, exhaustive, and proportional to the complexity of the research. Do not provide short summaries if you have rich data.
      2. Mandatory Structure: Use premium Markdown formatting. Include a clear Introduction, well-defined sections (using ### headings) based on the research stages, bullet points for readability, and a clear Conclusion or Executive Summary.
      3. Be objective, precise, and ensure you cover absolutely all nuances from the user's original request using ONLY the gathered information.`;

    let finalResult = await this.runCoreGeneration(
      shortTermHistory,
      prompt,
      [], // Attachments already processed
      provider,
      openRouterKey,
      openRouterModel,
      openAiKey,
      openAiModel,
      activeLocalModel,
      false, // No search needed here
      proMode,
      false,
      userProfile,
      aiProfile,
      undefined,
      tavilyApiKey,
      geminiApiKey,
      searchProvider,
      braveApiKey,
      customOnChunk,
      synthesizerSys,
    );

    // Retry logic if the model rejected the large context (e.g., 413 Payload Too Large causing CORS/Failed to fetch)
    if (
      finalResult.text.includes("Failed to fetch") ||
      finalResult.text.includes("Payload Too Large") ||
      finalResult.text.includes("context length")
    ) {
      if (onChunk)
        customOnChunk(
          "",
          "\n⚠️ Modelul a respins volumul mare de date. Încerc o sinteză cu date reduse...\n",
        );

      const maxContextLength = 15000;
      const truncatedContext =
        researchContext.length > maxContextLength
          ? researchContext.substring(0, maxContextLength) +
            "\n\n[...Context truncated due to length limits...]"
          : researchContext;

      const fallbackSys = `${baseSystemContext}\n\nYou are the Expert Analyst Agent. You have conducted deep research and gathered a vast context. Your task is to synthesize this data into a final response for the user.
          
          Gathered Information:
          ${truncatedContext}
          
          DRAFTING RULES:
          1. Your response MUST be detailed, exhaustive, and proportional to the complexity of the research. Do not provide short summaries if you have rich data.
          2. Mandatory Structure: Use premium Markdown formatting. Include a clear Introduction, well-defined sections (using ### headings) based on the research stages, bullet points for readability, and a clear Conclusion or Executive Summary.
          3. Be objective, precise, and ensure you cover absolutely all nuances from the user's original request using ONLY the gathered information.`;

      finalResult = await this.runCoreGeneration(
        shortTermHistory,
        prompt,
        [], // Attachments already processed
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        false, // No search needed here
        proMode,
        false,
        userProfile,
        aiProfile,
        undefined,
        tavilyApiKey,
        geminiApiKey,
        searchProvider,
        braveApiKey,
        customOnChunk,
        fallbackSys,
      );
    }

    // Merge results
    finalResult.citations = Array.from(
      new Map(finalCitations.map((c) => [c.uri, c])).values(),
    );
    if (pendingAction) finalResult.pendingAction = pendingAction;
    finalResult.reasoning =
      accumulatedReasoning + (finalResult.reasoning || "");

    this.triggerMemoryConsolidation(
      prompt,
      finalResult.text,
      enableMemory,
      geminiApiKey,
    );

    return finalResult;
  }

  /**
   * Internal generation function that routes to the correct provider
   */
  async runCoreGeneration(
    history: Message[],
    prompt: string,
    attachments: Attachment[],
    provider: ModelProvider,
    openRouterKey: string,
    openRouterModel: string,
    openAiKey: string,
    openAiModel: string,
    activeLocalModel: LocalModelConfig | undefined,
    useSearch: boolean,
    proMode: ProMode,
    enableMemory: boolean,
    userProfile: UserProfile,
    aiProfile: AiProfile,
    spaceSystemInstruction?: string,
    tavilyApiKey?: string,
    geminiApiKey?: string,
    searchProvider: "tavily" | "brave" = "tavily",
    braveApiKey?: string,
    onChunk?: (text: string, reasoning?: string) => void,
    systemInstructionOverride?: string,
  ): Promise<{
    text: string;
    citations: Citation[];
    relatedQuestions: string[];
    pendingAction?: PendingAction;
    reasoning?: string;
  }> {
    // Reset AbortController
    this.abortController = new AbortController();

    // 1. Add User Observation to Buffer
    if (enableMemory) {
      await MemoryService.addToBuffer("user", prompt);
    }

    // 2. Determine System Logic based on ProMode
    let modeInstruction = "";
    let forceReasoning = false;
    let forceSearch = useSearch;

    switch (proMode) {
      case ProMode.STANDARD:
        break;
      case ProMode.REASONING:
        forceReasoning = true;
        modeInstruction =
          "You are in DEEP REASONING mode. Think deeply, analyze the problem step-by-step before answering.";
        break;
      case ProMode.THINKING:
        forceReasoning = true;
        modeInstruction =
          "You are in THINKING mode. Break down the user's query into logical components.";
        break;
      case ProMode.RESEARCH:
        forceSearch = true;
        modeInstruction =
          "You are in RESEARCH mode. Provide a highly detailed report with extensive citations.";
        break;
      case ProMode.LEARNING:
        modeInstruction =
          "You are in LEARNING mode. Act as a Socratic tutor. Guide the user.";
        break;
      case ProMode.SHOPPING:
        forceSearch = true;
        modeInstruction =
          "You are in SHOPPING RESEARCH mode. Find products, compare prices, and look for reviews.";
        break;
    }

    // 3. Build the System Context (Used by all providers)
    // We pass the provider type so we can inject specific instructions (like <thinking> tags for Generic models)

    // --- SMART CONTEXT RETRIEVAL: Handle large workspace files ---
    const MAX_DIRECT_FILES = 3;
    const MAX_DIRECT_SIZE = 15000; // characters

    let directAttachments = [...attachments];
    let virtualFiles: Attachment[] = [];
    let kbSummary = "";

    // Identify text files that are part of the workspace
    const textFiles = attachments.filter((a) => a.type === "text");

    // Always populate workspaceFiles for tool usage, even if they are also in direct context
    this.workspaceFiles = textFiles;

    const totalSize = textFiles.reduce(
      (sum, a) => sum + (a.content?.length || 0),
      0,
    );

    if (textFiles.length > MAX_DIRECT_FILES || totalSize > MAX_DIRECT_SIZE) {
      // Move large/many files to virtual storage
      virtualFiles = textFiles;

      // Keep only images and non-text attachments in direct
      directAttachments = attachments.filter((a) => a.type !== "text");

      // Build a summary for the model
      kbSummary = "\n\n**AVAILABLE WORKSPACE FILES (Knowledge Base):**\n";
      virtualFiles.forEach((f) => {
        const sizeKb = Math.round((f.content?.length || 0) / 1024);
        kbSummary += `- ${f.name} (${sizeKb} KB)\n`;
      });
      kbSummary +=
        "\n**IMPORTANT:** The full content of these files is NOT currently in your context to save tokens. If you need to read a specific file to answer the user's question accurately, you **MUST** use the `workspace_tool` with action `read_files`. Do not guess the content.";
    } else {
      // Keep files in direct context, but also available in workspaceFiles for tools
    }

    const systemInstruction =
      systemInstructionOverride ||
      (await this.buildSystemContext(
        prompt,
        modeInstruction + kbSummary,
        enableMemory,
        userProfile,
        aiProfile,
        spaceSystemInstruction,
        provider === ModelProvider.GEMINI ? false : forceReasoning, // Only force XML thinking for non-Gemini
        provider !== ModelProvider.GEMINI &&
          (forceSearch || virtualFiles.length > 0), // Force explicit tool instruction for generics
      ));

    let result: {
      text: string;
      citations: Citation[];
      relatedQuestions: string[];
      pendingAction?: PendingAction;
      reasoning?: string;
    } = {
      text: "",
      citations: [] as Citation[],
      relatedQuestions: [] as string[],
    };

    // 4. Route to Provider
    if (provider === ModelProvider.LOCAL) {
      if (!activeLocalModel) throw new Error("No local model configured.");
      const { localLlmService } = await import("./localLlmService");

      // Auto-initialize if needed
      if (
        !localLlmService.isReady() ||
        localLlmService.getLoadedModelId() !== activeLocalModel.modelId
      ) {
        if (onChunk)
          onChunk(
            "Initializing local model... (this may take a moment if it's the first time)",
          );
        await localLlmService.initModel(activeLocalModel.modelId);
      }

      const localResult = await localLlmService.generateResponse(
        history,
        prompt,
        systemInstruction,
        onChunk,
      );
      result = {
        text: localResult.text,
        citations: [],
        relatedQuestions: [],
      };
    } else if (provider === ModelProvider.GEMINI) {
      result = await this.generateGeminiResponse(
        history,
        prompt,
        directAttachments,
        forceSearch,
        forceReasoning,
        proMode,
        enableMemory,
        systemInstruction,
        geminiApiKey,
        onChunk,
        virtualFiles.length > 0, // Enable readFiles tool
      );
    } else {
      // Generic Providers (OpenAI, OpenRouter)
      let endpoint = "";
      let apiKey = "";
      let modelName = "";

      if (provider === ModelProvider.OPENAI) {
        endpoint = "https://api.openai.com/v1/chat/completions";
        apiKey = openAiKey;
        modelName = openAiModel || "gpt-4o";
      } else if (provider === ModelProvider.OPENROUTER) {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = openRouterKey;
        modelName = openRouterModel || "openai/gpt-4o";
      }

      // Determine correct search key
      const activeSearchKey =
        searchProvider === "brave" ? braveApiKey : tavilyApiKey;

      result = await this.generateGenericResponse(
        history,
        prompt,
        directAttachments,
        endpoint,
        apiKey,
        modelName,
        systemInstruction,
        enableMemory,
        forceSearch,
        searchProvider,
        activeSearchKey,
        onChunk,
        virtualFiles.length > 0, // Enable readFiles tool
        proMode,
      );
    }

    return result;
  }

  // --- Helper: Extract JSON content ---
  private extractJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      let clean = text.trim();
      clean = clean.replace(/^```[a-z]*\s*/i, "");
      clean = clean.replace(/\s*```$/, "");
      try {
        return JSON.parse(clean);
      } catch (e2) {
        const firstOpen = text.indexOf("{");
        const lastClose = text.lastIndexOf("}");
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const candidate = text.substring(firstOpen, lastClose + 1);
          try {
            return JSON.parse(candidate);
          } catch (e3) {}
        }
        throw e;
      }
    }
  }

  // --- Helper: Extract Related Questions ---
  private extractRelatedQuestions(text: string): {
    cleanText: string;
    questions: string[];
  } {
    // Look for "Întrebări sugerate:" or "Related Questions:" at the end
    const markerRegex = /(?:Întrebări sugerate:|Related Questions:)\s*\n?((?:[-*•]\s*.*(?:\n|$)){1,5})/i;
    const match = text.match(markerRegex);
    let questions: string[] = [];
    let cleanText = text;

    if (match) {
      const questionsText = match[1];
      questions = questionsText
        .split("\n")
        .map((q) => q.replace(/^[-*•]\s*/, "").trim())
        .filter((q) => q.length > 0);
      cleanText = text.replace(match[0], "").trim();
    }
    return { cleanText, questions };
  }

  // --- Helper: Extract XML Reasoning (For Generic Models) ---
  private extractXmlThinking(text: string): {
    cleanText: string;
    reasoning?: string;
  } {
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/i;
    const match = text.match(thinkingRegex);

    if (match && match[1]) {
      const reasoning = match[1].trim();
      const cleanText = text.replace(thinkingRegex, "").trim();
      return { cleanText, reasoning };
    }

    return { cleanText: text };
  }

  // --- Synthesis Engine (Consolidation) ---
  private async runConsolidation(customApiKey?: string) {
    console.log("[Memory] Starting Consolidation...");
    this.notifyLearningState(true);

    try {
      const buffer = await MemoryService.getBuffer();
      if (buffer.length === 0) return;

      let clientToUse = this.ai;
      if (customApiKey) {
        try {
          clientToUse = new GoogleGenAI({ apiKey: customApiKey });
        } catch (e) {}
      }
      if (!clientToUse) return;

      const currentMemories = await MemoryService.getMemories();
      const currentProjects = await MemoryService.getProjects();

      const consolidationPrompt = `
        You are the Memory Manager. Your goal is to keep the Long-Term Memory clean, concise, and useful.
        
        RULES:
        1. IGNORE casual conversation, greetings, simple questions, and transient thoughts.
        2. ONLY extract *permanent* facts: User preferences, specific project details/status, learned skills, or important life events.
        3. DO NOT save "User asked about..." or "User wants to know...". Save the underlying interest ONLY if it seems like a long-term hobby/goal.
        4. If the buffer contains only noise, return empty arrays.
        5. CRITICAL: The "category" string in new_facts MUST BE EXACTLY one of the following 10 values:
           - "about_me": Basic personal info, identity, general details.
           - "preferences": Rules for AI interaction, style, formatting choices, moral values.
           - "work": Career, job specifics, professional life.
           - "coding_projects": Tech stack, programming, bug solutions, active development projects.
           - "learning_goals": Things the user is currently learning, roadmaps, personal/professional goals.
           - "relationships": Family, friends, mentions of other people.
           - "health_lifestyle": Diet, sleep, workouts, physical/mental wellbeing tracking.
           - "hobbies_interests": Travel, movies, books, games, free-time activities.
           - "finance": Money, budgets, investments, SafeDigital portfolio assets, holdings.
           - "other": General facts that strictly do not fit any of the above.
        
        BUFFER (Recent Conversation):
        ${buffer.map((b) => `${b.role.toUpperCase()}: ${b.content}`).join("\n")}

        EXISTING CONTEXT (Do not duplicate these):
        - Projects: ${currentProjects.map((p) => p.title).join(", ")}
        - Facts: ${currentMemories
          .slice(0, 20)
          .map((m) => m.content)
          .join(", ")}...

        Return JSON ONLY:
        {
            "new_facts": [{ "category": "see_allowed_values", "content": "string", "type": "fact|goal" }],
            "new_skills": ["string"],
            "project_updates": [{ "title": "string", "status": "active|completed", "progress": "string", "nextStep": "string", "techStack": ["string"] }]
        }
        `;

      const response = await clientToUse.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: consolidationPrompt }] }],
        config: { responseMimeType: "application/json" },
      });

      let jsonText = "";
      try {
        jsonText = response.text || "";
      } catch (e) {
        // Fallback if text getter fails (e.g. mixed content warning)
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) jsonText += part.text;
          }
        }
      }

      if (jsonText) {
        try {
          const updates = this.extractJson(jsonText);
          await MemoryService.applyConsolidation(updates);
        } catch (jsonError) {
          console.error("[Memory] JSON Parse failed during consolidation");
        }
      }
    } catch (e) {
      console.error("[Memory] Consolidation failed", e);
    } finally {
      this.notifyLearningState(false);
    }
  }

  // --- Gemini Implementation ---
  private async generateGeminiResponse(
    history: Message[],
    prompt: string,
    attachments: Attachment[],
    useSearch: boolean,
    enableReasoning: boolean,
    proMode: ProMode,
    _enableMemory: boolean,
    systemInstruction: string,
    customApiKey?: string,
    onChunk?: (text: string, reasoning?: string) => void,
    useReadFiles: boolean = false,
  ): Promise<{
    text: string;
    citations: Citation[];
    relatedQuestions: string[];
    pendingAction?: PendingAction;
    reasoning?: string;
  }> {
    let clientToUse = this.ai;
    if (customApiKey) {
      try {
        clientToUse = new GoogleGenAI({ apiKey: customApiKey });
      } catch (e) {
        return {
          text: "Error: Invalid Gemini API Key.",
          citations: [],
          relatedQuestions: [],
        };
      }
    }

    if (!clientToUse) {
      return {
        text: "Eroare: API Key pentru Gemini nu este configurat.",
        citations: [],
        relatedQuestions: [],
      };
    }

    const modelId =
      enableReasoning ||
      proMode === ProMode.REASONING ||
      proMode === ProMode.THINKING
        ? "gemini-3.1-pro-preview"
        : "gemini-3-flash-preview";

    const tools: Tool[] = [];
    if (useSearch) {
      tools.push({ googleSearch: {} });
    }
    
    const dynamicSkills = skillManager.getAvailableSkills().map(skill => skillManager.getGeminiTool(skill));
    
    const allFunctionDeclarations = [
      libraryToolGemini,
      calendarToolGemini,
      getCurrentTimeToolGemini,
      getCalendarHolidaysToolGemini,
      portfolioToolGemini,
      safeDigitalToolGemini,
      ...dynamicSkills
    ];

    if (useReadFiles) {
      allFunctionDeclarations.push(workspaceToolGemini);
    }

    tools.push({
      functionDeclarations: allFunctionDeclarations,
    });

    let thinkingConfig = undefined;
    if (
      enableReasoning ||
      proMode === ProMode.REASONING ||
      proMode === ProMode.THINKING
    ) {
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const geminiHistory: Content[] = history.map((msg) => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          if (att.type === "image") {
            const cleanBase64 = att.content.split(",")[1] || att.content;
            parts.push({
              inlineData: { mimeType: att.mimeType, data: cleanBase64 },
            });
          }
        });
      }
      return {
        role: msg.role === Role.USER ? "user" : "model",
        parts: parts,
      };
    });

    const currentParts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => {
        if (att.type === "image") {
          const cleanBase64 = att.content.split(",")[1] || att.content;
          currentParts.push({
            inlineData: { mimeType: att.mimeType, data: cleanBase64 },
          });
        } else if (att.type === "text") {
          currentParts.push({
            text: `\n[Attached File: ${att.name}]\n${att.content}\n`,
          });
        }
      });
    }

    try {
      const chat = clientToUse.chats.create({
        model: modelId,
        history: geminiHistory,
        config: {
          tools: tools,
          thinkingConfig: thinkingConfig,
          systemInstruction: systemInstruction,
          httpOptions:
            tools.length > 0
              ? ({
                  extraBody: {
                    tool_config: {
                      include_server_side_tool_invocations: true,
                    },
                  },
                } as any)
              : undefined,
        },
      });

      let finalResponseText = "";
      let citations: Citation[] = [];
      let pendingAction: PendingAction | undefined = undefined;
      let reasoning = "";
      let turns = 0;
      const maxTurns = 3;
      let currentMessage: any = currentParts;

      while (turns < maxTurns) {
        const fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController.abort(), 120000); // 120s timeout per turn
        
        const onUserAbort = () => fetchController.abort();
        if (this.abortController) {
          this.abortController.signal.addEventListener('abort', onUserAbort);
        }

        try {
          const result = await chat.sendMessageStream({
            message: currentMessage,
            config: {
              // @ts-ignore
              signal: fetchController.signal
            }
          });
          let turnText = "";
          let functionCalls: any[] = [];

          for await (const chunk of result) {
            if (!this.abortController || this.abortController.signal.aborted) break;

            // Extract Function Calls
            const fc = chunk.candidates?.[0]?.content?.parts
              ?.filter((p: any) => !!p.functionCall)
              .map((p: any) => p.functionCall);
            if (fc && fc.length > 0) functionCalls = [...functionCalls, ...fc];

          // Extract Text and Reasoning
          let text = "";
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.text) {
                text += part.text;
              }
              // Handle Gemini 2.0/3.0 Thinking models
              if ((part as any).thought) {
                const thought = (part as any).thought;
                reasoning += thought;
                if (onChunk) onChunk("", thought);
              }
            }
          }

          if (text) {
            turnText += text;

            // Check if we are inside a thinking block or if this chunk contains thinking tags
            const hasThinkingStart = text.includes("<thinking>");
            const hasThinkingEnd = text.includes("</thinking>");

            if (
              hasThinkingStart ||
              hasThinkingEnd ||
              (reasoning.length > 0 &&
                !finalResponseText.endsWith("</thinking>"))
            ) {
              // Complex logic to separate thinking from response
              // Simplified for stream:
              if (hasThinkingStart) {
                const parts = text.split("<thinking>");
                if (parts[0]) {
                  finalResponseText += parts[0];
                  if (onChunk) onChunk(parts[0], undefined);
                }
                if (parts[1]) {
                  reasoning += parts[1];
                  if (onChunk) onChunk("", parts[1]);
                }
              } else if (hasThinkingEnd) {
                const parts = text.split("</thinking>");
                if (parts[0]) {
                  reasoning += parts[0];
                  if (onChunk) onChunk("", parts[0]);
                }
                if (parts[1]) {
                  finalResponseText += parts[1];
                  if (onChunk) onChunk(parts[1], undefined);
                }
                // Reset reasoning flag implicitly by structure, but we track it via 'reasoning' var
              } else {
                // If we are in reasoning mode (started but not ended)
                // This is tricky because we don't have a strict state flag here other than 'reasoning' length
                // But 'reasoning' length > 0 doesn't mean we are currently *in* a thinking block if it was closed previously.
                // However, the prompt usually generates thinking at the start.

                // Let's rely on a simpler heuristic: if we haven't seen </thinking> yet, it's reasoning.
                // But wait, what if we have multiple thinking blocks? (Rare for this model)

                // Better approach: maintain a state 'isThinking' across chunks
                // But for this hotfix, let's assume standard behavior: <thinking>... </thinking> Response.

                if (
                  reasoning.length > 0 &&
                  !reasoning.includes("</thinking>")
                ) {
                  reasoning += text;
                  if (onChunk) onChunk("", text);
                } else {
                  finalResponseText += text;
                  if (onChunk) onChunk(text, undefined);
                }
              }
            } else {
              finalResponseText += text;
              if (onChunk) onChunk(text, undefined);
            }
          }

          // Grounding Metadata
          const chunks =
            chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks) {
            chunks.forEach((c: any) => {
              if (c.web?.uri && c.web?.title) {
                citations.push({ title: c.web.title, uri: c.web.uri });
              }
            });
          }
        }

        if (functionCalls.length > 0) {
          const toolResponses: any[] = [];

          for (const fc of functionCalls) {
            if (fc.name === "library_tool") {
              const action = fc.args.action;
              const payload = fc.args.payload || {};
              
              if (action === "save_page") {
                pendingAction = {
                  type: payload.action === "update" ? "update_page" : "create_page",
                  data: {
                    title: payload.title as string,
                    content: payload.content as string,
                  },
                  originalToolCallId: "gemini-fc",
                };
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: { content: "Action pending user confirmation." },
                  },
                });
              } else if (action === "get_structure") {
                const title = payload.pageTitle as string;
                const pageAttachment = attachments.find(
                  (a) => a.name === title || a.name === title + ".md",
                );
                if (pageAttachment && pageAttachment.content) {
                  const page = BlockService.fromMarkdown(
                    pageAttachment.content,
                    title,
                  );
                  const structure = page.blocks
                    .map((b, idx) => {
                      let context = "";
                      if (b.type === "table") {
                        context = `[TABLE] Rows: ${b.content.split("\n").length}`;
                      } else {
                        context =
                          b.content.length > 60
                            ? b.content.substring(0, 60) + "..."
                            : b.content;
                      }
                      return `Block ${idx + 1}: [ID: ${b.id}] (${b.type}) -> ${context}`;
                    })
                    .join("\n");
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: {
                        content: `STRUCTURE OF PAGE "${title}":\n${structure}`,
                      },
                    },
                  });
                } else {
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: {
                        content:
                          "Error: Page not found in current context. Please ask user to open the page first.",
                      },
                    },
                  });
                }
              } else if (
                action === "insert_block" ||
                action === "replace_block" ||
                action === "delete_block" ||
                action === "update_table_cell"
              ) {
                pendingAction = {
                  type: "block_operation",
                  data: {
                    operation: action,
                    args: payload,
                  },
                  originalToolCallId: "gemini-fc",
                };
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: {
                      content: "Block operation pending user confirmation.",
                    },
                  },
                });
              }
            } else if (fc.name === "calendar_tool") {
              if (fc.args.action === "read_events") {
                const allEvents =
                  (await db.get<CalendarEvent[]>(
                    STORES.CALENDAR,
                    "all_events",
                  )) || [];

                // Default: Start from beginning of today, End 7 days from now
                let startDate = new Date();
                startDate.setHours(0, 0, 0, 0);

                let endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                endDate.setHours(23, 59, 59, 999);

                const payload = fc.args.payload || {};

                if (payload.startDate) {
                  const parsedStart = new Date(payload.startDate as string);
                  if (!isNaN(parsedStart.getTime())) {
                    startDate = parsedStart;
                  }
                }
                if (payload.endDate) {
                  const parsedEnd = new Date(payload.endDate as string);
                  if (!isNaN(parsedEnd.getTime())) {
                    endDate = parsedEnd;
                    // If startDate and endDate are the same day (or close), expand endDate to end of day
                    if (
                      endDate.getTime() <= startDate.getTime() + 86400000 &&
                      endDate.getHours() === 0
                    ) {
                      endDate.setHours(23, 59, 59, 999);
                    }
                  }
                }

                const relevantEvents = allEvents
                  .filter((e) => {
                    const eStart = new Date(e.startDate);
                    const eEnd = new Date(e.endDate);
                    return eStart <= endDate && eEnd >= startDate;
                  })
                  .sort((a, b) => a.startDate - b.startDate);

                let responseContent = `CALENDAR EVENTS (Range: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}):\n`;
                if (relevantEvents.length === 0) {
                  responseContent += "No events found in this range.";
                } else {
                  relevantEvents.forEach((e) => {
                    const startObj = new Date(e.startDate);
                    const endObj = new Date(e.endDate);

                    if (e.allDay) {
                      // For all-day events, show just the date
                      const dateStr = startObj.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      responseContent += `\n- [ID: ${e.id}] "${e.title}"\n  TYPE: All-day Event\n  DATE: ${dateStr}\n  Location: ${e.location || "N/A"}\n  Description: ${e.description || "N/A"}`;
                    } else {
                      const startStr = startObj.toLocaleString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      });
                      const endStr = endObj.toLocaleString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      });
                      responseContent += `\n- [ID: ${e.id}] "${e.title}"\n  SCHEDULED START: ${startStr}\n  SCHEDULED END: ${endStr}\n  Location: ${e.location || "N/A"}\n  Description: ${e.description || "N/A"}`;
                    }
                  });
                }
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: { content: responseContent },
                  },
                });
                if (onChunk)
                  onChunk(
                    "",
                    `\n📅 Checked calendar: ${relevantEvents.length} events found.\n`,
                  );
              } else {
                // Write actions
                pendingAction = {
                  type: "calendar_event",
                  data: {
                    operation: fc.args.action.replace("_event", ""),
                    args: fc.args.payload || {},
                  },
                  originalToolCallId: "gemini-fc",
                };
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: {
                      content: "Calendar action pending user confirmation.",
                    },
                  },
                });
              }
            } else if (fc.name === "get_calendar_holidays") {
              const year = (fc.args.year as number) || new Date().getFullYear();
              const holidays = getHolidays(year);
              let responseContent = `HOLIDAYS FOR ${year} (RO & DE):\n`;
              holidays.forEach((h: any) => {
                responseContent += `- ${h.date}: ${h.name} (${h.country}) [${h.isPublic ? "Non-working" : "Observance"}]\n`;
              });
              toolResponses.push({
                functionResponse: {
                  name: fc.name,
                  response: { content: responseContent },
                },
              });
              if (onChunk)
                onChunk("", `\n📅 Checked holidays for ${year}...\n`);
            } else if (fc.name === "portfolio_tool") {
              let data = null;
              try {
                if (fc.args.action.startsWith('read_')) {
                  switch (fc.args.action) {
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
                  }
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: { content: data ? JSON.stringify(data) : "No data found or error occurred." },
                    },
                  });
                  if (onChunk)
                    onChunk("", `\n🔍 Citit informații din portofoliu...\n`);
                } else {
                  let parsedPayload = fc.args.payload;
                  try {
                    if (typeof fc.args.payload === "string") {
                      parsedPayload = JSON.parse(fc.args.payload);
                    }
                  } catch(e) {
                    // fallback to string if parsing fails
                  }
                  pendingAction = {
                    type: "complex_module_action",
                    data: {
                      module: "portfolio",
                      action: fc.args.action,
                      data: parsedPayload,
                    },
                    originalToolCallId: "gemini-fc",
                  };
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: {
                        content: "Portfolio action pending user confirmation.",
                      },
                    },
                  });
                  if (onChunk)
                    onChunk("", `\n⚙️ Pregătit acțiune pentru portofoliu...\n`);
                }
              } catch (e) {
                console.error("Error executing portfolio tool:", e);
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: { content: "Error occurred." },
                  },
                });
              }
            } else if (fc.name === "safe_digital_tool") {
              let data = null;
              try {
                if (fc.args.action.startsWith('read_')) {
                  switch (fc.args.action) {
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
                  }
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: { content: data ? JSON.stringify(data) : "No data found or error occurred." },
                    },
                  });
                  if (onChunk)
                    onChunk("", `\n🔍 Citit informații din safe digital...\n`);
                } else {
                  let parsedPayload = fc.args.payload;
                  try {
                    if (typeof fc.args.payload === "string") {
                      parsedPayload = JSON.parse(fc.args.payload);
                    }
                  } catch(e) {
                    // fallback to string if parsing fails
                  }
                  pendingAction = {
                    type: "complex_module_action",
                    data: {
                      module: "safe_digital",
                      action: fc.args.action,
                      data: parsedPayload,
                    },
                    originalToolCallId: "gemini-fc",
                  };
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: {
                        content: "Safe Digital action pending user confirmation.",
                      },
                    },
                  });
                  if (onChunk)
                    onChunk("", `\n⚙️ Pregătit acțiune pentru safe digital...\n`);
                }
              } catch (e) {
                console.error("Error executing safe digital tool:", e);
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: { content: "Error occurred." },
                  },
                });
              }
            } else if (fc.name === "get_current_time") {
              const now = new Date();
              const timeString = now.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              toolResponses.push({
                functionResponse: {
                  name: fc.name,
                  response: { content: timeString },
                },
              });
              if (onChunk) onChunk("", `\n🕒 Time: ${timeString}...\n`);
            } else if (fc.name === "workspace_tool") {
              const action = fc.args.action;
              const payload = fc.args.payload || {};
              let responseContent = "";

              if (action === "read_files") {
                const filenames = (payload.filenames || []) as string[];
                const requestedFiles = this.workspaceFiles.filter((f) =>
                  filenames.includes(f.name),
                );

                if (requestedFiles.length > 0) {
                  requestedFiles.forEach((f) => {
                    responseContent += `\n[File: ${f.name}]\n${f.content}\n`;
                  });
                } else {
                  responseContent =
                    "Error: Requested files not found in workspace.";
                }
                if (onChunk)
                  onChunk("", `\n📖 Citit ${filenames.length} fișiere din workspace...\n`);
              } else if (action === "search_files") {
                const queries = ((payload.queries || []) as string[]).map((q) =>
                  q.toLowerCase(),
                );
                responseContent = `Search results for [${queries.join(", ")}] in workspace files:\n`;
                let foundCount = 0;

                this.workspaceFiles.forEach((f) => {
                  if (!f.content) return;
                  const lines = f.content.split("\n");
                  lines.forEach((line, idx) => {
                    const lowerLine = line.toLowerCase();
                    if (queries.some((q) => lowerLine.includes(q))) {
                      foundCount++;
                      const start = Math.max(0, idx - 1);
                      const end = Math.min(lines.length - 1, idx + 1);
                      responseContent += `\n[File: ${f.name}, Line ${idx + 1}]\n`;
                      for (let i = start; i <= end; i++) {
                        responseContent += `${i === idx ? ">> " : "   "}${lines[i]}\n`;
                      }
                    }
                  });
                });

                if (foundCount === 0)
                  responseContent = `No matches found for any of the queries in workspace files.`;
                if (onChunk)
                  onChunk(
                    "",
                    `\n🔍 Căutat ${queries.length} termeni în workspace...\n`,
                  );
              } else if (action === "get_map") {
                responseContent = "WORKSPACE KNOWLEDGE BASE MAP:\n";

                this.workspaceFiles.forEach((f) => {
                  const snippet = (f.content || "")
                    .substring(0, 500)
                    .replace(/\n/g, " ");
                  const sizeKb = Math.round((f.content?.length || 0) / 1024);

                  responseContent += `\n- FILE: ${f.name} (${sizeKb} KB)\n`;
                  responseContent += `  PREVIEW: ${snippet}...\n`;
                  responseContent += `  CONTEXT: This file appears to contain ${f.mimeType || "text"} data. Use search to find specific entities.\n`;
                });
                if (onChunk)
                  onChunk("", `\n🗺️ Mapat structura workspace-ului...\n`);
              } else if (action === "semantic_search") {
                const query = payload.query as string;
                responseContent = `Semantic search results for "${query}":\n`;

                const queryEmbedding = await this.generateEmbedding(query);

                if (!queryEmbedding) {
                  responseContent =
                    "Error: Could not generate embedding for query.";
                } else {
                  const results = await this.searchInWorkspace(queryEmbedding);

                  if (results.length > 0) {
                    results.forEach((res, idx) => {
                      responseContent += `\n[Result ${idx + 1} - File: ${res.filename} (Score: ${res.score.toFixed(2)})]\n${res.content}\n`;
                    });
                  } else {
                    responseContent =
                      "No semantically relevant information found.";
                  }
                }
                if (onChunk)
                  onChunk("", `\n🧠 Căutare semantică: "${query}"...\n`);
              }

              toolResponses.push({
                functionResponse: {
                  name: fc.name,
                  response: { content: responseContent },
                },
              });
            } else {
              // Check if it's a dynamic skill
              const availableSkills = skillManager.getAvailableSkills();
              const skill = availableSkills.find(s => s.name === fc.name);
              
              if (skill) {
                try {
                  if (onChunk) onChunk("", `\n⚙️ Executing skill: ${skill.name}...\n`);
                  const result = await skillManager.executeSkill(skill.id, fc.args);
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: { content: JSON.stringify(result) },
                    },
                  });
                } catch (error: any) {
                  toolResponses.push({
                    functionResponse: {
                      name: fc.name,
                      response: { content: `Error executing skill: ${error.message}` },
                    },
                  });
                }
              } else {
                console.warn(`Unknown function call: ${fc.name}`);
                toolResponses.push({
                  functionResponse: {
                    name: fc.name,
                    response: { content: "Error: Unknown function." },
                  },
                });
              }
            }
          }

          if (pendingAction) {
            break;
          }

          currentMessage = toolResponses;
          turns++;
          if (onChunk)
            onChunk(
              "",
              `\n⚙️ Executat ${functionCalls.length} operațiuni...\n`,
            );
        } else {
          break;
        }
        
        clearTimeout(timeoutId);
        if (this.abortController) {
          this.abortController.signal.removeEventListener('abort', onUserAbort);
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if (this.abortController) {
          this.abortController.signal.removeEventListener('abort', onUserAbort);
        }
        throw e;
      }
      }

      const { cleanText, questions } =
        this.extractRelatedQuestions(finalResponseText);
      return {
        text: cleanText || "",
        citations: Array.from(
          new Map(citations.map((c) => [c.uri, c])).values(),
        ),
        relatedQuestions: questions,
        pendingAction,
        reasoning,
      };
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return {
        text: `Error: ${(error as any).message || "Request Failed"}`,
        citations: [],
        relatedQuestions: [],
      };
    }
  }

  // --- Generic Implementation (Unified Agent Loop) ---
  private async generateGenericResponse(
    history: Message[],
    prompt: string,
    attachments: Attachment[],
    endpoint: string,
    apiKey: string,
    modelName: string,
    systemInstruction: string,
    _enableMemory: boolean,
    useSearch: boolean,
    searchProvider: "tavily" | "brave",
    searchApiKey?: string,
    onChunk?: (text: string, reasoning?: string) => void,
    useReadFiles: boolean = false,
    _proMode: ProMode = ProMode.STANDARD,
  ): Promise<{
    text: string;
    citations: Citation[];
    relatedQuestions: string[];
    pendingAction?: PendingAction;
    reasoning?: string;
  }> {
    // 1. Prepare Messages
    const messages: any[] = [];
    messages.push({ role: "system", content: systemInstruction });

    // Format History
    history.slice(-15).forEach((msg) => {
      // Increased context window
      // Remove reasoning from history sent to model to save tokens, or keep it if valuable context?
      // Usually cleaner to strip old thoughts.
      const content = msg.content;
      messages.push({
        role: msg.role === Role.MODEL ? "assistant" : "user",
        content: content,
      });
    });

    // Format Current Turn
    let finalPrompt = prompt;
    attachments.forEach((att) => {
      if (att.type === "text") {
        finalPrompt += `\n\n[Attached File: ${att.name}]\n${att.content}`;
      } else if (att.type === "image") {
        // For generic models that support vision (gpt-4o, claude-3), we need specific formatting
        // For simplicity in this "generic" handler, we append text indication.
        // A robust implementation would construct the array content block for OpenAI specs.
        finalPrompt += `\n[Image Attached: ${att.name}]`;
      }
    });

    // Handle Vision for OpenAI compatible endpoints properly
    const currentMessageContent: any[] = [{ type: "text", text: finalPrompt }];
    attachments.forEach((att) => {
      if (att.type === "image") {
        const cleanBase64 = att.content.split(",")[1] || att.content;
        currentMessageContent.push({
          type: "image_url",
          image_url: { url: `data:${att.mimeType};base64,${cleanBase64}` },
        });
      }
    });

    messages.push({ role: "user", content: currentMessageContent });

    // 2. Prepare Tools
    const tools = [];
    if (useSearch && searchApiKey) tools.push(searchToolGeneric);
    
    const dynamicSkillsGeneric = skillManager.getAvailableSkills().map(skill => skillManager.getGenericTool(skill));
    
    tools.push(
      libraryToolGeneric,
      calendarToolGeneric,
      getCurrentTimeToolGeneric,
      getCalendarHolidaysToolGeneric,
      portfolioToolGeneric,
      safeDigitalToolGeneric,
      ...dynamicSkillsGeneric
    );
    if (useReadFiles)
      tools.push(
        workspaceToolGeneric,
      );

    let finalContent = "";
    let finalReasoning = "";
    let turns = 0;
    const maxTurns = 5; // Allow up to 5 tool-use hops
    const collectedCitations: Citation[] = [];
    let collectedImages: string[] = [];
    let pendingAction: PendingAction | undefined = undefined;

    // --- MAIN AGENT LOOP ---
    while (turns < maxTurns) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey !== "not-needed") {
        headers["Authorization"] = `Bearer ${apiKey}`;
        if (endpoint.includes("openrouter")) {
          headers["HTTP-Referer"] = window.location.origin;
          headers["X-Title"] = "Perplex Clone";
        }
      }

      try {
        const body: any = {
          model: modelName,
          messages: messages,
          stream: true,
          temperature: 0.7,
        };

        // Handle OpenRouter specific reasoning features
        if (endpoint.includes("openrouter.ai")) {
          const isReasoningModel = LLMService.OPENROUTER_REASONING_MODELS.some(
            (m) => modelName.toLowerCase().includes(m.toLowerCase()),
          );
          if (isReasoningModel) {
            body.reasoning = { enabled: true };
          }
        }

        if (tools.length > 0) {
          body.tools = tools;
          body.tool_choice = "auto";
        }

        console.log(`[Generic] Turn ${turns + 1} Request:`, {
          model: modelName,
          toolCount: tools.length,
          useSearch,
          searchProvider,
        });

        let response: Response;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (true) {
          const fetchController = new AbortController();
          const timeoutId = setTimeout(() => fetchController.abort(), 120000); // 120s timeout per turn
          
          const onUserAbort = () => fetchController.abort();
          if (this.abortController) {
            this.abortController.signal.addEventListener('abort', onUserAbort);
          }

          response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            signal: fetchController.signal,
          });
          
          clearTimeout(timeoutId);
          if (this.abortController) {
            this.abortController.signal.removeEventListener('abort', onUserAbort);
          }

          if (response.status === 429 && retryCount < maxRetries) {
            retryCount++;
            console.warn(`[Generic] Rate limited (429). Retrying in ${2000 * retryCount}ms... (Attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
          break;
        }
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        let currentTurnContent = "";
        let toolCallMap: Record<number, { id: string; name: string; args: string }> = {};

        if (contentType.includes("application/json")) {
          // API returned a JSON object instead of a stream
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
          }
          
          const choice = data.choices?.[0];
          if (choice) {
            const msg = choice.message;
            if (msg) {
              if (msg.reasoning || msg.thought) {
                const reasoningChunk = msg.reasoning || msg.thought;
                finalReasoning += reasoningChunk;
                if (onChunk) onChunk("", reasoningChunk);
              }
              if (msg.content) {
                currentTurnContent = msg.content;
                if (onChunk) onChunk(currentTurnContent, undefined);
              }
              if (msg.tool_calls) {
                msg.tool_calls.forEach((tc: any, idx: number) => {
                  toolCallMap[idx] = {
                    id: tc.id,
                    name: tc.function?.name || "",
                    args: tc.function?.arguments || ""
                  };
                });
              }
            }
          }
        } else {
          // Streaming Parser
          const reader = response.body!.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          // XML Parsing State for Reasoning
          let inThinkingTag = false;

          while (true) {
            const { done, value } = await reader.read();

            if (value) {
              buffer += decoder.decode(value, { stream: true });
            }

            let lines = buffer.split("\n");
            if (!done) {
              buffer = lines.pop() || "";
            } else {
              buffer = ""; // Process all remaining lines
            }

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed === "data: [DONE]") continue;
              if (!trimmed.startsWith("data: ")) {
                // Some APIs might send error objects in the stream without 'data:' prefix
                if (trimmed.startsWith("{") && trimmed.includes('"error"')) {
                  try {
                    const errJson = JSON.parse(trimmed);
                    if (errJson.error) throw new Error(errJson.error.message || JSON.stringify(errJson.error));
                  } catch (e) {
                    // Ignore parse errors here
                  }
                }
                continue;
              }

              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.error) {
                  throw new Error(json.error.message || JSON.stringify(json.error));
                }
                const choice = json.choices?.[0];
                if (!choice) continue;
                const delta = choice.delta;

                // 1. Handle Reasoning (OpenRouter/OpenAI/DeepSeek)
                const reasoningChunk =
                  delta.reasoning ||
                  delta.thought ||
                  (delta as any).reasoning_content;
                if (reasoningChunk) {
                  finalReasoning += reasoningChunk;
                  if (onChunk) onChunk("", reasoningChunk);
                }

                // 2. Handle Content (Text)
                if (delta.content) {
                  const chunk = delta.content;
                  currentTurnContent += chunk;

                  // Streaming Logic for <thinking> tags
                  let remaining = chunk;
                  while (remaining.length > 0) {
                    if (!inThinkingTag) {
                      const startIdx = remaining.indexOf("<thinking>");
                      if (startIdx !== -1) {
                        const textPart = remaining.substring(0, startIdx);
                        if (textPart && onChunk) onChunk(textPart, undefined);

                        inThinkingTag = true;
                        remaining = remaining.substring(startIdx + 10);
                      } else {
                        if (onChunk) onChunk(remaining, undefined);
                        remaining = "";
                      }
                    } else {
                      const endIdx = remaining.indexOf("</thinking>");
                      if (endIdx !== -1) {
                        const thoughtPart = remaining.substring(0, endIdx);
                        finalReasoning += thoughtPart;
                        if (onChunk) onChunk("", thoughtPart);

                        inThinkingTag = false;
                        remaining = remaining.substring(endIdx + 11);
                      } else {
                        finalReasoning += remaining;
                        if (onChunk) onChunk("", remaining);
                        remaining = "";
                      }
                    }
                  }
                }

                // 2. Handle Tool Calls (Streaming)
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolCallMap[idx])
                      toolCallMap[idx] = { id: "", name: "", args: "" };

                    if (tc.id) toolCallMap[idx].id = tc.id;
                    if (tc.function?.name)
                      toolCallMap[idx].name += tc.function.name;
                    if (tc.function?.arguments)
                      toolCallMap[idx].args += tc.function.arguments;
                  }
                }
              } catch (e: any) {
                if (e.message && !e.message.includes("Unexpected token")) {
                  throw e; // Re-throw actual API errors parsed from JSON
                }
                // Ignore partial JSON parse errors
              }
            }
            if (done) break;
          }
        }

        // Turn Complete
        const toolCalls = Object.values(toolCallMap).map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.args },
        }));

        // If no tool calls, we are done
        if (toolCalls.length === 0) {
          // Strip thinking tags from final content for clean text
          const cleanContent = currentTurnContent
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
            .trim();
          if (cleanContent) {
            finalContent = cleanContent;
          } else if (!finalContent) {
            // If this turn is empty but we have no previous content, use what we have
            finalContent = currentTurnContent.trim();
          }
          break; // Exit loop
        }

        // If we have content in this turn but also tool calls, preserve it
        const turnCleanContent = currentTurnContent
          .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
          .trim();
        if (turnCleanContent) {
          finalContent += (finalContent ? "\n\n" : "") + turnCleanContent;
        }

        // Process Tool Calls
        // Add Assistant Message with Tool Calls to history
        messages.push({
          role: "assistant",
          content: currentTurnContent || null, // Some APIs require null if tool_calls present
          tool_calls: toolCalls,
        });

        console.log(`[Generic] Executing ${toolCalls.length} tools...`);

        for (const toolCall of toolCalls) {
          let toolResultContent = "";

          try {
            const args = JSON.parse(toolCall.function.arguments);

            if (toolCall.function.name === "perform_search") {
              if (!searchApiKey) {
                toolResultContent = "Error: Search disabled (Missing API Key).";
              } else {
                // Execute Search
                console.log(
                  `[Generic] Invoking Search via ${searchProvider}...`,
                );
                const searchData = await TavilyService.search(
                  args.query,
                  searchApiKey,
                  searchProvider,
                );

                if (
                  searchData &&
                  searchData.results &&
                  searchData.results.length > 0
                ) {
                  // Add to collections
                  searchData.results.forEach((res) =>
                    collectedCitations.push({ title: res.title, uri: res.url }),
                  );
                  if (searchData.images)
                    collectedImages = [
                      ...collectedImages,
                      ...searchData.images,
                    ];

                  // Format for Model
                  toolResultContent = TavilyService.formatContext(searchData);
                  console.log(
                    `[Generic] Search returned ${searchData.results.length} results.`,
                  );
                } else {
                  toolResultContent =
                    "No results found for query: " + args.query;
                  console.warn(`[Generic] Search returned no results.`);
                }
              }
            } else if (toolCall.function.name === "library_tool") {
              const action = args.action;
              const payload = args.payload || {};
              
              if (action === "save_page") {
                pendingAction = {
                  type: payload.action === "update" ? "update_page" : "create_page",
                  data: { title: payload.title, content: payload.content },
                  originalToolCallId: toolCall.id,
                };
                toolResultContent = "Action pending user confirmation.";
              } else if (action === "get_structure") {
                const title = payload.pageTitle as string;
                const pageAttachment = attachments.find(
                  (a) => a.name === title || a.name === title + ".md",
                );
                if (pageAttachment && pageAttachment.content) {
                  const page = BlockService.fromMarkdown(
                    pageAttachment.content,
                    title,
                  );
                  const structure = page.blocks
                    .map((b, idx) => {
                      let context = "";
                      if (b.type === "table") {
                        context = `[TABLE] Rows: ${b.content.split("\n").length}`;
                      } else {
                        context =
                          b.content.length > 60
                            ? b.content.substring(0, 60) + "..."
                            : b.content;
                      }
                      return `Block ${idx + 1}: [ID: ${b.id}] (${b.type}) -> ${context}`;
                    })
                    .join("\n");
                  toolResultContent = `STRUCTURE OF PAGE "${title}":\n${structure}`;
                } else {
                  toolResultContent =
                    "Error: Page not found in current context. Please ask user to open the page first.";
                }
              } else if (
                action === "insert_block" ||
                action === "replace_block" ||
                action === "delete_block" ||
                action === "update_table_cell"
              ) {
                pendingAction = {
                  type: "block_operation",
                  data: {
                    operation: action,
                    args: payload,
                  },
                  originalToolCallId: toolCall.id,
                };
                toolResultContent = "Block operation pending user confirmation.";
              }
            } else if (toolCall.function.name === "calendar_tool") {
              if (args.action === "read_events") {
                const payload = args.payload || {};
                let startDate = new Date();
                startDate.setHours(0, 0, 0, 0);

                let endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                endDate.setHours(23, 59, 59, 999);

                if (payload.startDate) {
                  const parsedStart = new Date(payload.startDate as string);
                  if (!isNaN(parsedStart.getTime())) {
                    startDate = parsedStart;
                  }
                }
                if (payload.endDate) {
                  const parsedEnd = new Date(payload.endDate as string);
                  if (!isNaN(parsedEnd.getTime())) {
                    endDate = parsedEnd;
                    // If startDate and endDate are the same day (00:00:00), expand endDate to end of day
                    if (endDate.getTime() === startDate.getTime()) {
                      endDate.setHours(23, 59, 59, 999);
                    }
                  }
                }

                const allEvents =
                  (await db.get<CalendarEvent[]>(
                    STORES.CALENDAR,
                    "all_events",
                  )) || [];

                const filteredEvents = allEvents.filter((e) => {
                  const eStart = new Date(e.startDate);
                  const eEnd = new Date(e.endDate);
                  return eStart <= endDate && eEnd >= startDate;
                });

                // Format events to be human-readable and avoid raw timestamps
                const formattedEvents = filteredEvents.map((e) => ({
                  ...e,
                  startDate: new Date(e.startDate).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  endDate: new Date(e.endDate).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }));

                toolResultContent = JSON.stringify(formattedEvents);
                if (onChunk)
                  onChunk(
                    "",
                    `\n📅 Checking calendar for ${startDate.toLocaleString()} to ${endDate.toLocaleString()}...\n`,
                  );
              } else {
                // Write actions
                pendingAction = {
                  type: "calendar_event",
                  data: {
                    operation: args.action.replace("_event", ""),
                    args: args.payload || {},
                  },
                  originalToolCallId: toolCall.id,
                };
                toolResultContent = "Action pending user confirmation.";
              }
            } else if (toolCall.function.name === "portfolio_tool") {
              let data = null;
              try {
                if (args.action.startsWith('read_')) {
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
                  }
                  toolResultContent = data ? JSON.stringify(data) : "No data found or error occurred.";
                  if (onChunk)
                    onChunk("", `\n🔍 Citit informații din portofoliu...\n`);
                } else {
                  pendingAction = {
                    type: "complex_module_action",
                    data: {
                      module: "portfolio",
                      action: args.action,
                      data: args.payload,
                    },
                    originalToolCallId: toolCall.id,
                  };
                  toolResultContent = "Portfolio action pending user confirmation.";
                  if (onChunk)
                    onChunk("", `\n⚙️ Pregătit acțiune pentru portofoliu...\n`);
                }
              } catch (e) {
                console.error("Error executing portfolio tool:", e);
                toolResultContent = "Error occurred.";
              }
            } else if (toolCall.function.name === "safe_digital_tool") {
              let data = null;
              try {
                if (args.action.startsWith('read_')) {
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
                  }
                  toolResultContent = data ? JSON.stringify(data) : "No data found or error occurred.";
                  if (onChunk)
                    onChunk("", `\n🔍 Citit informații din safe digital...\n`);
                } else {
                  pendingAction = {
                    type: "complex_module_action",
                    data: {
                      module: "safe_digital",
                      action: args.action,
                      data: args.payload,
                    },
                    originalToolCallId: toolCall.id,
                  };
                  toolResultContent = "Safe Digital action pending user confirmation.";
                  if (onChunk)
                    onChunk("", `\n⚙️ Pregătit acțiune pentru safe digital...\n`);
                }
              } catch (e) {
                console.error("Error executing safe digital tool:", e);
                toolResultContent = "Error occurred.";
              }
            } else if (toolCall.function.name === "get_current_time") {
              const now = new Date();
              const timeString = now.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              toolResultContent = timeString;
              if (onChunk) onChunk("", `\n🕒 Time: ${timeString}...\n`);
            } else if (toolCall.function.name === "workspace_tool") {
              const action = args.action;
              const payload = args.payload || {};
              toolResultContent = "";

              if (action === "read_files") {
                const filenames = (payload.filenames || []) as string[];
                const requestedFiles = this.workspaceFiles.filter((f) =>
                  filenames.includes(f.name),
                );

                if (requestedFiles.length > 0) {
                  requestedFiles.forEach((f) => {
                    toolResultContent += `\n[File: ${f.name}]\n${f.content}\n`;
                  });
                } else {
                  toolResultContent =
                    "Error: Requested files not found in workspace.";
                }
                if (onChunk)
                  onChunk(
                    "",
                    `\n📖 Citit ${filenames.length} fișiere din workspace...\n`,
                  );
              } else if (action === "search_files") {
                const queries = ((payload.queries || []) as string[]).map((q) =>
                  q.toLowerCase(),
                );
                let foundCount = 0;
                toolResultContent = `Search results for [${queries.join(", ")}] in workspace files:\n`;

                this.workspaceFiles.forEach((f) => {
                  if (!f.content) return;
                  const lines = f.content.split("\n");
                  lines.forEach((line, idx) => {
                    const lowerLine = line.toLowerCase();
                    if (queries.some((q) => lowerLine.includes(q))) {
                      foundCount++;
                      const start = Math.max(0, idx - 1);
                      const end = Math.min(lines.length - 1, idx + 1);
                      toolResultContent += `\n[File: ${f.name}, Line ${idx + 1}]\n`;
                      for (let i = start; i <= end; i++) {
                        toolResultContent += `${i === idx ? ">> " : "   "}${lines[i]}\n`;
                      }
                    }
                  });
                });

                if (foundCount === 0)
                  toolResultContent = `No matches found for any of the queries in workspace files.`;
                if (onChunk)
                  onChunk(
                    "",
                    `\n🔍 Căutat ${queries.length} termeni în workspace...\n`,
                  );
              } else if (action === "get_map") {
                toolResultContent = "WORKSPACE KNOWLEDGE BASE MAP:\n";
                this.workspaceFiles.forEach((f) => {
                  const snippet = (f.content || "")
                    .substring(0, 500)
                    .replace(/\n/g, " ");
                  const sizeKb = Math.round((f.content?.length || 0) / 1024);
                  toolResultContent += `\n- FILE: ${f.name} (${sizeKb} KB)\n`;
                  toolResultContent += `  PREVIEW: ${snippet}...\n`;
                  toolResultContent += `  CONTEXT: This file appears to contain ${f.mimeType || "text"} data. Use search to find specific entities.\n`;
                });
                if (onChunk)
                  onChunk("", `\n🗺️ Mapat structura workspace-ului...\n`);
              } else if (action === "semantic_search") {
                const query = payload.query as string;
                toolResultContent = `Semantic search results for "${query}":\n`;

                const queryEmbedding = await this.generateEmbedding(query);
                if (!queryEmbedding) {
                  toolResultContent =
                    "Error: Could not generate embedding for query.";
                } else {
                  const results = await this.searchInWorkspace(queryEmbedding);
                  if (results.length > 0) {
                    results.forEach((res, idx) => {
                      toolResultContent += `\n[Result ${idx + 1} - File: ${res.filename} (Score: ${res.score.toFixed(2)})]\n${res.content}\n`;
                    });
                  } else {
                    toolResultContent =
                      "No semantically relevant information found.";
                  }
                }
                if (onChunk)
                  onChunk("", `\n🧠 Căutare semantică: "${query}"...\n`);
              }
            } else {
              toolResultContent = "Unknown tool.";
            }
          } catch (err: any) {
            toolResultContent = `Error executing tool: ${err.message}`;
            console.error(`[Generic] Tool Execution Error:`, err);
          }

          // Add Tool Result to History
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResultContent,
          });
        }

        // If we found a pending action, stop the loop and return immediately
        if (pendingAction) break;

        turns++;
        // Loop continues to generate the answer based on tool results
      } catch (error: any) {
        if (error.name === "AbortError" || error.message?.includes("aborted")) {
          return {
            text: "Oprit de utilizator.",
            citations: [],
            relatedQuestions: [],
          };
        }
        console.error("Generic API Loop Error:", error);
        let errorMsg = error.message;
        if (
          errorMsg.includes("401") ||
          errorMsg.includes("User not found") ||
          errorMsg.includes("Invalid API key")
        ) {
          errorMsg =
            "Eroare de autentificare (401). Te rog să verifici dacă ai introdus o cheie API validă în Setări.";
        } else if (errorMsg.includes("429")) {
          errorMsg =
            "Ai atins limita de cereri (429). Te rog să încerci din nou mai târziu.";
        } else if (errorMsg.includes("Failed to fetch")) {
          errorMsg =
            "Nu m-am putut conecta la server. Verifică conexiunea la internet sau dacă serverul local rulează (pentru Ollama).";
        }
        return {
          text: `⚠️ **Eroare:**\n\n${errorMsg}`,
          citations: [],
          relatedQuestions: [],
        };
      }
    } // End While

    // --- Post-Processing ---

    // 1. Extract XML Thinking (Simulated Reasoning) - Fallback if streaming missed it
    if (!finalReasoning) {
      const { cleanText, reasoning } = this.extractXmlThinking(finalContent);
      finalContent = cleanText;
      finalReasoning = reasoning || "";
    } else {
      // Ensure final content is clean if we streamed reasoning
      finalContent = finalContent
        .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
        .trim();
    }

    // 2. Extract Related Questions (JSON)
    const extracted = this.extractRelatedQuestions(finalContent);
    finalContent = extracted.cleanText;

    // 3. Deduplicate Citations
    const uniqueCitations = Array.from(
      new Map(collectedCitations.map((item) => [item.uri, item])).values(),
    );

    return {
      text: finalContent || "",
      citations: uniqueCitations,
      relatedQuestions: extracted.questions,
      pendingAction,
      reasoning: finalReasoning,
    };
  }

  // --- TTS ---
  async generateSpeech(
    text: string,
    context: AudioContext,
    customApiKey?: string,
  ): Promise<AudioBuffer | null> {
    let clientToUse = this.ai;
    if (customApiKey) {
      try {
        clientToUse = new GoogleGenAI({ apiKey: customApiKey });
      } catch (e) {}
    }
    if (!clientToUse || !text.trim()) return null;

    try {
      const response = await clientToUse.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text.substring(0, 4000) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return null;
      return await this.decodeAudioData(
        this.decodeBase64(base64Audio),
        context,
        24000,
        1,
      );
    } catch (e: any) {
      const errorString = String(e?.message || e);
      if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
         // Silently fail for Quota limits, as App.tsx handles this gracefully 
         // with a fallback to the native browser TTS.
      } else {
         console.error("TTS Error:", e);
      }
      return null;
    }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  // --- Semantic Search Helpers ---
  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.ai) return null;
    try {
      const result = await this.ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text }] }],
      });
      return result.embeddings?.[0]?.values || null;
    } catch (e) {
      console.error("Embedding Error:", e);
      return null;
    }
  }

  private async searchInWorkspace(
    queryEmbedding: number[],
  ): Promise<{ filename: string; content: string; score: number }[]> {
    // Lazy chunking and embedding of workspace files (in a real app, this would be pre-computed)
    const chunks: { filename: string; content: string; embedding: number[] }[] =
      [];

    // Note: This is a simplified on-the-fly implementation.
    // For production, embeddings should be computed on file upload and stored.
    for (const file of this.workspaceFiles) {
      if (!file.content) continue;

      // Split file into chunks (approx 500 chars)
      const fileChunks = file.content.match(/.{1,500}/g) || [];

      // Limit to first 20 chunks per file for performance in this demo
      for (const chunkText of fileChunks.slice(0, 20)) {
        const embedding = await this.generateEmbedding(chunkText);
        if (embedding) {
          chunks.push({ filename: file.name, content: chunkText, embedding });
        }
      }
    }

    // Calculate Cosine Similarity
    const results = chunks.map((chunk) => {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { ...chunk, score };
    });

    // Sort by score and return top 5
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // --- Context Builder ---
  private async buildSystemContext(
    prompt: string,
    modeInstruction: string,
    enableMemory: boolean,
    userProfile: UserProfile,
    aiProfile: AiProfile,
    spaceSystemInstruction?: string,
    forceXmlThinking: boolean = false,
    forceExplicitToolUse: boolean = false,
  ): Promise<string> {
    const parts: string[] = [];

    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    parts.push(`\n**CURRENT SYSTEM TIME:** ${timeStr}`);
    parts.push(`**DATE INTERPRETATION RULES:**
1. Use the current system time above as your absolute reference.
2. Interpret "today", "tomorrow", "yesterday" relative to this date.
3. For dates without a year (e.g., "March 30th"):
   - If the date is in the future relative to today, use the current year.
   - If the date has already passed this year, use the NEXT year.
   - NEVER assume a past year unless explicitly stated.
4. ALWAYS confirm the calculated absolute date internally before calling a tool.
5. When adding events, if the user doesn't specify a year, apply the logic above.

**REAL-TIME INFORMATION PROTOCOL:**
1. If the user asks about "today", "recent", "news", "crypto", "stocks", or "current events", you **MUST** use the available search tool (e.g., \`perform_search\` or built-in Google Search).
2. Your internal knowledge is frozen in time. For any dynamic topic, the web is your source of truth.
3. When searching for "today's news", explicitly include the current date (${timeStr}) in your search queries to get the most relevant results.
4. If you are in a research loop, focus on gathering facts from the search results rather than your internal memory.`);

    parts.push(`\n**CALENDAR PROTOCOL (CRITICAL):**
1. **SOURCE OF TRUTH:** The user's calendar is the ONLY source of truth for events. Do NOT rely on your internal memory or previous conversation turns for event dates/times, as they may be outdated.
2. **ALWAYS VERIFY:** Before answering ANY question about the calendar (reading, updating, moving, deleting), you **MUST** first call \`list_calendar_events\` to get the current, real-time state of the calendar.
3. **SCHEDULED DATE VS CREATION DATE:** Users ALWAYS refer to the "Scheduled Date" (when the event happens), NEVER the "Creation Date". When you list events, pay attention to the \`startDate\` and \`endDate\` fields.
4. **RELATIVE DATES:** If the user says "tomorrow" or "next Friday", use \`get_current_time\` to calculate the exact date, then query \`list_calendar_events\` with that specific date range.
5. **MOVING EVENTS:** To move an event:
   a. Call \`list_calendar_events\` to find the event and its ID.
   b. Verify the *current* date of the event from the tool output.
   c. Calculate the *new* date based on the user's request.
   d. Call \`update_calendar_event\` with the event ID and the NEW start/end times.
   e. Do NOT ask the user to confirm if you have already verified the data. Just do it.
6. **CONFLICTS:** If a move creates a conflict, warn the user but proceed if they insisted, or ask for confirmation if ambiguous.`);

    parts.push(`\n**LIBRARY/SOURCE PROTOCOL (CRITICAL):**
1. **PRIORITY:** If the user has attached a file, page, or source (e.g., from the Library), this attachment is your **PRIMARY SOURCE OF TRUTH**.
2. **VERIFY FIRST:** Do NOT answer from your internal memory or assumptions about what the file *might* contain. You MUST read and analyze the actual content of the attachment provided in the context.
3. **NO HALLUCINATIONS:** If the attached file does not contain the answer, state that clearly. Do not invent information to fill the gap.
4. **TOOL USAGE:** If the file content is truncated or summarized (indicated by a system message), you **MUST** use the \`workspace_tool\` with action \`read_files\` to retrieve the full content before answering specific questions about it.
5. **ANALYSIS:** When asked about a source, first analyze its structure, key points, and details *before* formulating your response.`);

    if (aiProfile.systemInstructions) {
      parts.push(aiProfile.systemInstructions);
    } else {
      parts.push(
        "You are a helpful AI assistant. Answer concisely and accurately. Use Markdown formatting.",
      );
    }

    if (modeInstruction) {
      parts.push("\nMODE INSTRUCTION: " + modeInstruction);
    }

    // Simulate Reasoning via XML for non-Gemini models
    if (forceXmlThinking) {
      parts.push(
        "\nIMPORTANT: Before answering, you must output your internal thought process inside <thinking>...</thinking> tags. Analyze the request, plan your search strategy, and critique your findings inside these tags. The user will see this as a 'Thought Process'. Then provide your final answer outside the tags.",
      );
    }

    if (forceExplicitToolUse) {
      parts.push(`\n**CRITICAL INSTRUCTION: REAL-TIME SEARCH & KNOWLEDGE BASE & TOOLS**
1. **Real-Time Search:** You have access to search the web. If the user asks about current events, news, weather, or ANY information that might have changed since your training cutoff, you **MUST** use it.
2. **Workspace Knowledge Base:** You have access to workspace files via \`workspace_tool\`. If the user asks for specific data (ID numbers, tax codes, names, dates) that might be in these files, you **MUST** find it using actions like \`read_files\`, \`search_files\`, \`get_map\`, or \`semantic_search\`.
3. **Calendar Management:** You have full access to the user's calendar via \`calendar_tool\`. You can list, add, update, and delete events. ALWAYS check the current time using \`get_current_time\` before making any date-relative assumptions. Check for conflicts using \`read_events\` before adding new events.
4. **Library Management:** You have access to the user's library via \`library_tool\`. You can read page structures and modify pages.
5. **Portfolio & Safe Digital:** You have access to the user's portfolio (\`portfolio_tool\`) and safe digital documents (\`safe_digital_tool\`).
6. **Accuracy:** Never hallucinate or guess personal data. If you cannot find it after searching/reading, state that clearly.`);
    }

    // GLOBAL PROCESS INSTRUCTION (Enforces the Plan -> Execute -> Analyze -> Answer loop)
    parts.push(`\n**OPERATIONAL PROTOCOL:**
1. **PLAN:** Understand the user's goal. If information is missing (from web or workspace), use tools (Search/Read) to find it.
2. **EXECUTE:** Call necessary tools.
3. **ANALYZE:** Critically evaluate the tool results. Are they relevant? Are they sufficient? If not, search again with a better query.
4. **SYNTHESIZE:** Formulate a clear, comprehensive answer based *only* on the verified information.
5. **CITE:** Support your claims with [1], [2] citations from the search results.`);

    // Explicit Citation Instruction for Generic Models
    parts.push(
      "\nCITATION RULES: If you use the 'perform_search' tool, you must cite the results in your final answer. Use the format [1], [2], etc., corresponding to the order of the sources provided by the tool. Do NOT invent sources.",
    );

    if (userProfile.bio || userProfile.location || userProfile.name) {
      let userStr = "\n\nUser Profile:";
      if (userProfile.name) userStr += `\n- Name: ${userProfile.name}`;
      if (userProfile.location)
        userStr += `\n- Location: ${userProfile.location}`;
      if (userProfile.bio) userStr += `\n- Bio: ${userProfile.bio}`;
      parts.push(userStr);
    }

    if (enableMemory) {
      const memoryContext = await MemoryService.getContextString(prompt);
      if (memoryContext) {
        parts.push(memoryContext);
      }
    }

    // Add chart generation instructions
    parts.push(`\n**CHART GENERATION PROTOCOL:**
You have the ability to render interactive charts directly in the chat using Chart.js.
When the user asks for a chart, graph, or visualization, DO NOT try to draw it with text/ascii.
Instead, use a standard markdown code block with the language set to \`chart\` to generate a chart:

\`\`\`chart
{
  "type": "bar",
  "data": {
    "labels": ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    "datasets": [{
      "label": "# of Votes",
      "data": [12, 19, 3, 5, 2, 3],
      "borderWidth": 1
    }]
  },
  "options": {
    "scales": {
      "y": {
        "beginAtZero": true
      }
    }
  }
}
\`\`\`

The content inside the block MUST be a valid JSON object representing a Chart.js configuration.
You can use any valid Chart.js type (line, bar, pie, doughnut, radar, polarArea, bubble, scatter).

**DIAGRAM GENERATION PROTOCOL:**
To display diagrams, flowcharts, or state machines, use Mermaid.js via a \`\`\`mermaid code block.
Example:
\`\`\`mermaid
graph TD;
  A[Start] --> B{Is it working?};
  B -- Yes --> C[Great!];
  B -- No --> D[Fix it];
\`\`\`

**WIDGET GENERATION PROTOCOL:**
To display a professional portfolio dashboard widget, use:
\`\`\`widget
{ "type": "portfolio-dashboard" }
\`\`\``);

    if (spaceSystemInstruction) {
      parts.push(
        `\n\nCurrent Workspace Instructions:\n${spaceSystemInstruction}`,
      );
    }

    if (aiProfile.language && aiProfile.language !== "English") {
      parts.push(`\n\nPlease respond in ${aiProfile.language}.`);
    }

    // Add capabilities instruction for Saving
    parts.push(
      "\n\nCAPABILITIES: You can save information to the user's library. CRITICAL RULE: ONLY use `library_tool` with action `save_page` if the user EXPLICITLY and DIRECTLY commands you to 'save this', 'create a page', or 'remember this'. DO NOT call this tool automatically at the end of a research task or conversation. If the user just asks a question or asks for research, DO NOT save it.",
    );

    // Instruction to generate related questions
    parts.push(
      '\n\nIMPORTANT: After your main response (and after </thinking> if applicable), generate 3 relevant follow-up questions. Format them as a simple list at the very end, starting with "Întrebări sugerate:". Example:\nÎntrebări sugerate:\n- Question 1?\n- Question 2?\n- Question 3?',
    );

    return parts.join("\n");
  }
}
