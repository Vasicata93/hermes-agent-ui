import { ISkill } from '../../types/integration';
import { useIntegrationStore } from '../../store/integrationStore';
import { Type, FunctionDeclaration } from '@google/genai';

class SkillManager {
  private static instance: SkillManager;

  private constructor() {}

  public static getInstance(): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager();
    }
    return SkillManager.instance;
  }

  /**
   * Registers a new skill in the system.
   */
  public registerSkill(skill: ISkill) {
    useIntegrationStore.getState().registerSkill(skill);
  }

  /**
   * Retrieves all skills that are currently active and whose required connectors are connected.
   */
  public getAvailableSkills(): ISkill[] {
    return useIntegrationStore.getState().getAvailableSkills();
  }

  /**
   * Converts a skill schema type to Gemini Type
   */
  private mapTypeToGemini(type: string): Type {
    switch (type.toLowerCase()) {
      case 'string': return Type.STRING;
      case 'number': return Type.NUMBER;
      case 'integer': return Type.INTEGER;
      case 'boolean': return Type.BOOLEAN;
      case 'array': return Type.ARRAY;
      case 'object': return Type.OBJECT;
      default: return Type.STRING;
    }
  }

  /**
   * Gets the Gemini FunctionDeclaration for a skill
   */
  public getGeminiTool(skill: ISkill): FunctionDeclaration {
    const properties: Record<string, any> = {};
    
    for (const [key, prop] of Object.entries(skill.schema.properties)) {
      properties[key] = {
        type: this.mapTypeToGemini(prop.type),
        description: prop.description,
      };
      if (prop.enum) properties[key].enum = prop.enum;
      if (prop.items) properties[key].items = { type: this.mapTypeToGemini(prop.items.type) };
    }

    return {
      name: skill.name,
      description: skill.description,
      parameters: {
        type: Type.OBJECT,
        properties,
        required: skill.schema.required || [],
      }
    };
  }

  /**
   * Gets the generic OpenAI-style tool format for a skill
   */
  public getGenericTool(skill: ISkill): any {
    return {
      type: "function",
      function: {
        name: skill.name,
        description: skill.description,
        parameters: {
          type: "object",
          properties: skill.schema.properties,
          required: skill.schema.required || [],
          additionalProperties: false,
        },
        strict: true,
      }
    };
  }

  /**
   * Executes a skill by ID with the given parameters.
   */
  public async executeSkill(skillId: string, params: any, context?: any): Promise<any> {
    const state = useIntegrationStore.getState();
    const skill = state.skills[skillId];
    
    if (!skill) {
      throw new Error(`Skill with ID ${skillId} not found.`);
    }

    if (!skill.isActive) {
      throw new Error(`Skill ${skillId} is not active.`);
    }

    // Verify connectors
    for (const connId of skill.requiredConnectors) {
      const connector = state.connectors[connId];
      if (!connector || connector.status !== 'connected') {
        throw new Error(`Skill ${skillId} requires connector ${connId} which is not connected.`);
      }
    }

    // Execute the skill
    try {
      return await skill.execute(params, context);
    } catch (error) {
      console.error(`Error executing skill ${skillId}:`, error);
      throw error;
    }
  }
}

export const skillManager = SkillManager.getInstance();
