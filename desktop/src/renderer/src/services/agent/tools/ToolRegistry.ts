export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  summary: string;
}

export type ToolFunction = (args: any, context?: any) => Promise<ToolResult>;

export class ToolRegistry {
  private static tools: Map<string, { definition: ToolDefinition; execute: ToolFunction }> = new Map();

  static register(definition: ToolDefinition, execute: ToolFunction) {
    this.tools.set(definition.name, { definition, execute });
  }

  static getTool(name: string) {
    return this.tools.get(name);
  }

  static getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  static async executeTool(name: string, args: any, context?: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found.`,
        summary: `Failed to find tool ${name}`
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        summary: `Error executing ${name}`
      };
    }
  }
}
