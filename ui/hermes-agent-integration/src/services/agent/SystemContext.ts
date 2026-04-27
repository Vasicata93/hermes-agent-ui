export interface SystemContextData {
  identity: {
    personality: string;
    capabilities: string[];
    values: string[];
  };
  coreSkills: {
    [skillName: string]: string;
  };
  toolDefinitions: {
    readTools: string[];
    writeTools: string[];
  };
  behavioralRules: string[];
}

export class SystemContext {
  private static cachedContext: string | null = null;

  /**
   * Builds the Layer 1 System Context.
   * Static, cached, built once per session.
   * Deterministic JSON serialization with sorted keys.
   * Timestamp is NOT included here.
   */
  static getContext(): string {
    if (this.cachedContext) {
      return this.cachedContext;
    }

    const contextData: SystemContextData = {
      behavioralRules: [
        "Errors remain in context as resources for recovery.",
        "Append-only context.",
        "If observation > 5000 tokens, externalize to RAG.",
        "Fallback protocol (if tool fails, try alternative)."
      ],
      coreSkills: {
        "Răspuns în limba userului": "Auto-detect limbă la fiecare mesaj",
        "Calendar awareness": "Protocol complet pentru operațiuni pe calendar",
        "Library / Notion operations": "Read/write pe pagini, blocuri, tabele",
        "Widget și vizualizare": "Grafice, diagrame, componente UI interactive",
        "Safety protocol": "Write ops cer confirmare. Excepție: execute_code în sandbox"
      },
      identity: {
        capabilities: [
          "Web Search & Information Retrieval",
          "Workspace File Management",
          "Calendar Management",
          "Data Visualization & Widgets",
          "Local and Cloud LLM Execution"
        ],
        personality: "Professional, concise, helpful, and highly analytical.",
        values: [
          "Accuracy over speed",
          "User privacy and data security",
          "Transparency in actions"
        ]
      },
      toolDefinitions: {
        readTools: [
          "perform_search",
          "workspace_tool",
          "calendar_tool",
          "get_calendar_holidays",
          "portfolio_tool",
          "safe_digital_tool"
        ],
        writeTools: [
          "library_tool",
          "calendar_tool",
          "portfolio_tool",
          "safe_digital_tool"
        ]
      }
    };

    // Deterministic JSON serialization with sorted keys
    this.cachedContext = this.deterministicStringify(contextData);
    return this.cachedContext;
  }

  /**
   * Minimal context for Chat Mode and simple conversational routing
   */
  static getMinimalContext(): string {
    const fullContext = JSON.parse(this.getContext());
    const minimalData = {
      identity: {
        personality: fullContext.identity.personality,
      },
      behavioralRules: fullContext.behavioralRules
    };
    return this.deterministicStringify(minimalData);
  }

  static getReadTools(): string[] {
    const contextData = JSON.parse(this.getContext());
    return contextData.toolDefinitions.readTools || [];
  }

  static getWriteTools(): string[] {
    const contextData = JSON.parse(this.getContext());
    return contextData.toolDefinitions.writeTools || [];
  }

  static isWriteTool(toolName: string): boolean {
    const writeTools = this.getWriteTools();
    return writeTools.includes(toolName);
  }

  private static deterministicStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      const arrStr = obj.map(item => this.deterministicStringify(item)).join(',');
      return `[${arrStr}]`;
    }

    const keys = Object.keys(obj).sort();
    const keyValStrs = keys.map(key => {
      const valStr = this.deterministicStringify(obj[key]);
      return `"${key}":${valStr}`;
    });
    return `{${keyValStrs.join(',')}}`;
  }

  static clearCache() {
    this.cachedContext = null;
  }
}
