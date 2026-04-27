import { Message, ModelProvider, LocalModelConfig } from '../../types';
import { LLMService } from '../geminiService';
import { RoutingDecision } from './AgentRouter';

export interface AgentPlan {
  tasks: {
    id: string;
    description: string;
    tool?: string;
    toolArgs?: any;
    dependencies?: string[];
    retried?: boolean;
  }[];
  reasoning: string;
}

export class AgentPlanner {
  private static parseJsonResponse(responseText: string): AgentPlan {
    let jsonString = responseText.trim();
    
    // Attempt standard parse first
    try {
      const parsed = JSON.parse(jsonString) as AgentPlan;
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    } catch (e) {
      // Ignore initial parse fail
    }

    // Attempt to extract using {} braces
    try {
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString) as AgentPlan;
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore fallback parse fail
    }

    // Ultimate fallback if parsing fails or structure is invalid
    return {
      reasoning: "Fallback plan due to evaluation or parsing error.",
      tasks: [
        { id: "fallback_task_1", description: "Answer directly from context without tools", tool: null as any }
      ]
    };
  }

  static async createSingleToolPlan(
    text: string,
    perceptionContextStr: string,
    activeToolsStr: string,
    llmService: LLMService,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ): Promise<AgentPlan> {
    const prompt = `
PERCEPTION CONTEXT:
${perceptionContextStr}

ACTIVE TOOLS (Prefix Masked):
${activeToolsStr}

You are the PLANNER layer of an advanced AI agent.
Your job is to generate EXACTLY ONE task based on the user's request.

User Request: "${text}"

CRITICAL INSTRUCTION:
Return a JSON object with EXACTLY ONE task in the "tasks" array. Do not generate more than one task.

Output ONLY a JSON object with the following structure:
{
  "reasoning": "Explanation of why this task is optimal",
  "tasks": [
    {
      "id": "task_1",
      "description": "Clear description of what needs to be done",
      "tool": "tool_name_if_applicable",
      "toolArgs": { "arg1": "value1" }
    }
  ]
}

Respond ONLY with valid JSON. Do not include markdown formatting.
`;

    try {
      const responseText = await llmService.generateSimpleText(
        prompt,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey,
        true // requireJson
      );
      return this.parseJsonResponse(responseText);
    } catch (error) {
      console.error("Single Planner evaluation failed:", error);
      return this.parseJsonResponse("");
    }
  }

  static async createFullPlan(
    text: string,
    history: Message[],
    routingDecision: RoutingDecision,
    systemContextStr: string,
    memoryContextStr: string,
    perceptionContextStr: string,
    injectedSkillsStr: string,
    activeToolsStr: string,
    accumulatedResults: any[],
    llmService: LLMService,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ): Promise<AgentPlan> {
    const prompt = `
SYSTEM CONTEXT:
${systemContextStr}

MEMORY CONTEXT:
${memoryContextStr}

PERCEPTION CONTEXT:
${perceptionContextStr}

INJECTED SKILLS:
${injectedSkillsStr}

ACTIVE TOOLS (Prefix Masked):
${activeToolsStr}

You are the PLANNER layer of an advanced AI agent.
Your job is to break down the user's request into a sequence of actionable tasks.

Recent History:
${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Accumulated Results from previous iterations:
${JSON.stringify(accumulatedResults, null, 2)}

User Request: "${text}"
Complexity: ${routingDecision.complexity}
Priority: ${routingDecision.priority}
Tool State: ${routingDecision.toolState}

CRITICAL INSTRUCTION:
Create an INTERNAL plan. Order subtasks by dependencies.
LANGUAGE: Always respond in the language of the user's last message.

Output ONLY a JSON object with the following structure:
{
  "reasoning": "Explanation of why this plan is optimal",
  "tasks": [
    {
      "id": "task_1",
      "description": "Clear description of what needs to be done",
      "tool": "tool_name_if_applicable",
      "toolArgs": { "arg1": "value1" },
      "dependencies": ["list_of_task_ids_that_must_complete_first"]
    }
  ]
}

Ensure the plan is logical, efficient, and directly addresses the user's request.
Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
`;

    try {
      const responseText = await llmService.generateSimpleText(
        prompt,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey,
        true // requireJson
      );
      return this.parseJsonResponse(responseText);
    } catch (error) {
      console.error("Full Planner evaluation failed:", error);
      return this.parseJsonResponse("");
    }
  }
}

