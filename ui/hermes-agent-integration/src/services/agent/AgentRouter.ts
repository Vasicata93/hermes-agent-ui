import { ExtendedPerception } from './AgentPerception';

export type ComplexityLevel = 'SIMPLU' | 'MEDIU' | 'COMPLEX' | 'AMBIGUU';
export type PriorityLevel = 'URGENT_IMPORTANT' | 'IMPORTANT' | 'RUTINA' | 'OPTIONAL';
export type ToolState = 'idle' | 'writing' | 'confirming' | 'error';
export type SituationalSkill = 'coding_skill' | 'research_skill' | 'finance_skill' | 'writing_skill' | 'data_analysis_skill';

export interface RoutingDecision {
  complexity: ComplexityLevel;
  priority: PriorityLevel;
  toolState: ToolState;
  injectedSkills: SituationalSkill[];
  reasoning: string;
}

export class AgentRouter {
  /**
   * Evaluates the incoming message and context to determine the routing strategy LOCALLY.
   * This implements Layer 4 of the Perplex Agent Architecture using 100% heuristics + Semantic Embeddings.
   */
  static async evaluate(
    currentMessage: string,
    perception: ExtendedPerception
  ): Promise<RoutingDecision> {
    const text = currentMessage.toLowerCase();
    
    const semanticIntent = perception.semanticCategory;
    let reasoning = `Routing applied (Semantic: ${semanticIntent || 'None'}).`;
    
    // HEURISTIC 1: COMPLEXITY (Blended Semantic & Heuristic)
    let complexity: ComplexityLevel = 'SIMPLU';
    const actionWords = ['cauta', 'search', 'find', 'write', 'creeaza', 'adauga', 'save', 'citeste', 'verifica', 'build', 'fa', 'rezolva', 'fix'];
    const hasAction = actionWords.some(w => text.includes(w));
    const isLong = text.split(' ').length > 20;
    const hasMultipleClauses = text.includes(' si ') && text.includes(' apoi ');

    // Use semantic vector if available
    if (semanticIntent) {
      if (semanticIntent === 'ANALYSIS' || semanticIntent === 'CODING' || hasMultipleClauses) {
         complexity = 'COMPLEX';
      } else if (semanticIntent === 'ACTION' || semanticIntent === 'RESEARCH' || semanticIntent === 'FINANCE') {
         complexity = 'MEDIU';
      } else if (semanticIntent === 'AMBIGUOUS' || (text.length < 5 && text.includes('?'))) {
         complexity = 'AMBIGUU';
      } else {
         complexity = 'SIMPLU'; // CONVERSATION
      }
    } else {
      // Fallback heuristics
      if (hasMultipleClauses || (isLong && hasAction)) {
         complexity = 'COMPLEX';
      } else if (hasAction) {
         complexity = 'MEDIU';
      } else if (text.length < 5 && text.includes('?')) {
         complexity = 'AMBIGUU';
      }
    }
    
    if (perception.urgency === 'critical' && complexity === 'SIMPLU') {
       complexity = 'MEDIU';
       reasoning += ` Urgency is critical, forced complexity to MEDIU.`;
    }
    
    if (perception.tone === 'frustrated' && complexity === 'COMPLEX') {
       reasoning += ` User is frustrated, remember to simplify response.`;
    }
    
    if (perception.eventDetection.blocks.includes("Low semantic confidence — heuristics only")) {
       reasoning += ` Warning: Low semantic confidence, routing based heavily on heuristics.`;
    }
    
    // HEURISTIC 2: PRIORITY
    let priority: PriorityLevel = 'RUTINA';
    
    if (perception.urgency === 'critical') {
       priority = 'URGENT_IMPORTANT';
    } else if (perception.urgency === 'high') {
       priority = 'IMPORTANT';
    } else if (text.includes('urgent') || text.includes('acum') || text.includes('rapid')) {
       priority = 'URGENT_IMPORTANT';
    } else if (text.includes('important')) {
       priority = 'IMPORTANT';
    }
    
    if (perception.tone === 'frustrated' && priority !== 'URGENT_IMPORTANT') {
       priority = 'IMPORTANT';
    }

    // HEURISTIC 3: SKILLS (Blended)
    const skills: SituationalSkill[] = [];
    
    if (semanticIntent === 'CODING') skills.push('coding_skill');
    if (semanticIntent === 'RESEARCH') skills.push('research_skill');
    if (semanticIntent === 'FINANCE') skills.push('finance_skill');
    if (semanticIntent === 'ANALYSIS') skills.push('data_analysis_skill');
    
    // Heuristic fallbacks for skills
    if (['cod', 'programare', 'bug', 'react', 'typescript', 'eroare', 'fix', 'script'].some(w => text.includes(w)) && !skills.includes('coding_skill')) skills.push('coding_skill');
    if (['cauta', 'cine', 'cand', 'istorie', 'informatii', 'cercetare'].some(w => text.includes(w)) && !skills.includes('research_skill')) skills.push('research_skill');
    if (['bani', 'buget', 'finante', 'investitii', 'crypto', 'pret', 'cost'].some(w => text.includes(w)) && !skills.includes('finance_skill')) skills.push('finance_skill');
    if (['scrie', 'articol', 'text', 'compune', 'email', 'mesaj'].some(w => text.includes(w)) && !skills.includes('writing_skill')) skills.push('writing_skill');
    if (['analizeaza', 'date', 'statistica', 'grafic', 'tabel'].some(w => text.includes(w)) && !skills.includes('data_analysis_skill')) skills.push('data_analysis_skill');

    let toolState: ToolState = 'idle';
    if (semanticIntent === 'ACTION' || skills.includes('coding_skill') || skills.includes('writing_skill')) {
       toolState = 'writing';
    } else if (complexity === 'AMBIGUU') {
       toolState = 'confirming';
    }

    return {
       complexity,
       priority,
       toolState,
       injectedSkills: skills,
       reasoning: `${reasoning} Detected complexity: ${complexity}.`
    };
  }
}
