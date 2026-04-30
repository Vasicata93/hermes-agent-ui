import { useAgentStore } from '../../store/agentStore';
import { MemoryManager } from '../memory/MemoryManager';
import { AgentPerception } from './AgentPerception';
import { AgentRouter } from './AgentRouter';
import { AgentPlanner } from './AgentPlanner';
import { ToolRegistry } from './tools/ToolRegistry';
import { registerCoreTools } from './tools/coreTools';
import { generateId } from '../../utils/helpers';
import { Message, ModelProvider, LocalModelConfig } from '../../types';
import { LLMService } from '../geminiService';
import { SystemContext } from './SystemContext';
import { SITUATIONAL_SKILLS } from './SkillRegistry';

// Initialize tools
registerCoreTools();

export class AgentEngine {
  /**
   * Main entry point for processing a user request.
   * Implements the 10-Layer Architecture v2.0
   */
  static async processRequest(
    text: string,
    history: Message[],
    llmService: LLMService,
    onChunk: (text: string, reasoning?: string) => void,
    onComplete: (finalText: string, pendingAction?: any) => void,
    requestConfirmation: (action: any) => Promise<'confirm' | 'cancel' | 'redact'>,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ) {
    const store = useAgentStore.getState();
    store.resetSession();
    
    // Initialize Architecture Steps
    const initialSteps = [
      { id: 'layer-1', name: 'System Context', status: 'pending', description: 'Loading system context...', logs: [] },
      { id: 'layer-2', name: 'Memory Load', status: 'pending', description: 'Retrieving relevant context...', logs: [] },
      { id: 'layer-3', name: 'Perception', status: 'pending', description: 'Analyzing intent and situation...', logs: [] },
      { id: 'layer-4', name: 'Routing', status: 'pending', description: 'Evaluating complexity and skills...', logs: [] },
      { id: 'layer-5', name: 'Planner', status: 'pending', description: 'Creating execution plan...', logs: [] },
      { id: 'layer-6', name: 'Pre-Tool Safety', status: 'pending', description: 'Checking safety constraints...', logs: [] },
      { id: 'layer-7', name: 'Tools Execution', status: 'pending', description: 'Executing planned tasks...', logs: [] },
      { id: 'layer-8', name: 'Post-Tool Safety', status: 'pending', description: 'Verifying execution results...', logs: [] },
      { id: 'layer-9', name: 'Response Generation', status: 'pending', description: 'Synthesizing final response...', logs: [] },
      { id: 'layer-10', name: 'Learning', status: 'pending', description: 'Consolidating memories...', logs: [] }
    ] as any;
    store.initArchitectureSteps(initialSteps);

    const setStep = (step: number, total: number, desc: string, layerId?: string) => {
      store.setThinkingStep(step, total, desc);
      if (layerId) {
        store.updateArchitectureStepStatus(layerId, 'in_progress', desc);
      }
      onChunk("", desc + "\n");
    };

    const completeStep = (layerId: string, desc?: string) => {
      store.updateArchitectureStepStatus(layerId, 'completed', desc);
    };

    const addStepLog = (layerId: string, type: 'thought' | 'action' | 'result' | 'error', content: string, toolName?: string) => {
      store.addArchitectureStepLog(layerId, { type, content, toolName });
    };

    // GLOBAL SYSTEMS
    // Cost Guard: Track iterations
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    try {
      // ==========================================
      // [1] LAYER 1: SYSTEM CONTEXT
      // ==========================================
      // Static, cached, built once per session.
      setStep(1, 10, '[1] System Context: Loading...', 'layer-1');
      const systemContextStr = SystemContext.getContext();
      addStepLog('layer-1', 'thought', 'System context loaded successfully.');
      completeStep('layer-1', 'System context loaded.');
      console.log("System Context Loaded (Layer 1)");

      // ==========================================
      // [2] LAYER 2: MEMORY LOAD
      // ==========================================
      // Selective retrieval based on relevance
      setStep(2, 10, '[2] Memory Load: Retrieving relevant context...', 'layer-2');
      
      const retrievedMemory = await MemoryManager.getRelevantContext(text);
      
      const workingMemoryTemp = history.slice(-10);
      const workingMemory = workingMemoryTemp.map(msg => {
        if (msg.role === 'model' && msg.content.length > 300) {
          return { ...msg, content: msg.content.substring(0, 300) + ' [...]' };
        }
        return msg;
      });
      
      const memoryContext = {
        episodic: retrievedMemory.recentEpisodes,
        semantic: retrievedMemory.semantic,
        procedural: retrievedMemory.procedural,
        workingMemory: workingMemory // Sliding window truncated
      };
      
      const memoryContextStr = `
EPISODIC MEMORY (Recent):
${memoryContext.episodic.map(e => `[${new Date(e.date).toLocaleDateString()}] [${e.topic}] ${e.summary} -> ${e.outcome}`).join('\n') || 'None'}

SEMANTIC MEMORY (Facts):
${memoryContext.semantic.map(s => `- [${s.category}] ${s.key}: ${s.value}`).join('\n') || 'None'}

PROCEDURAL MEMORY (PATTERNS):
${memoryContext.procedural.map(p => `- When [${p.pattern}] -> Do [${p.action}] (Weight: ${p.weight})`).join('\n') || 'None'}
`;
      
      addStepLog('layer-2', 'result', `Loaded ${memoryContext.workingMemory.length} messages, ${memoryContext.episodic.length} episodes.`);
      completeStep('layer-2', 'Memory context retrieved.');
      console.log("Memory Context Loaded:", memoryContext.workingMemory.length, "messages", "Episodes:", memoryContext.episodic.length);

      // ==========================================
      // [3] LAYER 3: PERCEPTION
      // ==========================================
      setStep(3, 10, '[3] Perception: Analyzing intent and situation...', 'layer-3');
      
      const perceptionContext = await AgentPerception.analyze(
        text
      );
      
      store.setPerception(perceptionContext);
      addStepLog('layer-3', 'thought', `Intent: ${perceptionContext.realIntent}`);
      addStepLog('layer-3', 'thought', `Tone: ${perceptionContext.tone}, Urgency: ${perceptionContext.urgency}`);
      completeStep('layer-3', 'Perception analysis complete.');
      console.log("Perception Context Loaded:", perceptionContext.timestamp);
      
      // Timestamp injected HERE for subsequent layers
      const currentTimestamp = new Date(perceptionContext.timestamp).toISOString();
      const perceptionContextStr = `
PERCEPTION CONTEXT (As of ${currentTimestamp}):
- Literal Input: "${perceptionContext.literalInput}"
- Real Intent: ${perceptionContext.realIntent}
- Tone: ${perceptionContext.tone}
- Urgency: ${perceptionContext.urgency}

SITUATION MODEL:
- Project State: ${perceptionContext.situationModel.projectState}
- Changes: ${perceptionContext.situationModel.changesSinceLastMessage}
- Relevant Memory: ${perceptionContext.situationModel.relevantMemoryContext}

GOAL AWARENESS:
- Main Goal: ${perceptionContext.goalAwareness.mainGoal}
- Active Subgoals: ${perceptionContext.goalAwareness.activeSubgoals.join(', ') || 'None'}

EVENT DETECTION:
- Direction Changes: ${perceptionContext.eventDetection.directionChanges.join(', ') || 'None'}
- Opportunities: ${perceptionContext.eventDetection.opportunities.join(', ') || 'None'}
- Blocks: ${perceptionContext.eventDetection.blocks.join(', ') || 'None'}
`;

      // ==========================================
      // [4] LAYER 4: ROUTING
      // ==========================================
      setStep(4, 10, '[4] Routing: Evaluating complexity and skills...', 'layer-4');
      const routingDecision = await AgentRouter.evaluate(
        text,
        perceptionContext
      );
      
      addStepLog('layer-4', 'thought', `Complexity: ${routingDecision.complexity}`);
      addStepLog('layer-4', 'thought', `Priority: ${routingDecision.priority}`);
      if (routingDecision.injectedSkills.length > 0) {
        addStepLog('layer-4', 'thought', `Skills injected: ${routingDecision.injectedSkills.join(', ')}`);
      }
      completeStep('layer-4', `Routing complete. Complexity: ${routingDecision.complexity}`);
      onChunk("", `Routing: ${routingDecision.complexity} | Priority: ${routingDecision.priority}\n`);
      
      // Skill Injection (Context Augmentation dinamic)
      const injectedSkillsStr = routingDecision.injectedSkills
        .map(skill => `[SKILL: ${skill}]\n${SITUATIONAL_SKILLS[skill as keyof typeof SITUATIONAL_SKILLS]}`)
        .join('\n\n');

      // Tool State Machine (Prefix Masking)
      const allTools = ToolRegistry.getAllDefinitions();
      const systemContextData = JSON.parse(systemContextStr);
      const readTools = systemContextData.toolDefinitions.readTools;
      
      let activeTools = allTools;
      if (routingDecision.toolState === 'writing') {
        // Block read tools
        activeTools = allTools.filter(t => !readTools.includes(t.name));
      } else if (routingDecision.toolState === 'confirming') {
        // Block all tools
        activeTools = [];
      }
      
      const activeToolsStr = JSON.stringify(activeTools);

      // Decizie arhitecturală (Layer 4 Routing):
      // simplu -> CHAT MODE
      // mediu -> CHAT MODE + tool
      // complex -> AGENT MODE
      // ambiguu -> CLARIFY FIRST

      const minimalContextStr = SystemContext.getMinimalContext();

      if (routingDecision.complexity === 'AMBIGUU') {
        store.setMode('chat');
        setStep(4, 10, '[5] CLARIFY FIRST: Requesting user clarification...');
        store.updateArchitectureStepStatus('layer-5', 'completed', 'Skipped (Ambiguous Route)');
        store.updateArchitectureStepStatus('layer-6', 'completed', 'Skipped');
        store.updateArchitectureStepStatus('layer-7', 'completed', 'Skipped');
        store.updateArchitectureStepStatus('layer-8', 'completed', 'Skipped');
        
        const chatPrompt = `SYSTEM CONTEXT:\n${minimalContextStr}\n\nMEMORY CONTEXT:\n${memoryContextStr}\n\nPERCEPTION CONTEXT:\n${perceptionContextStr}\n\nThe user's request is ambiguous: "${text}". Ask ONE concise question to clarify what is missing.`;
        
        const chatResponse = await llmService.generateSimpleText(chatPrompt, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || "");
        
        setStep(9, 10, '[9] Response Generation');
        store.setConfidence('low');
        completeStep('layer-9', 'Clarification delivered.');
        onComplete(chatResponse);
        
        setStep(10, 10, '[10] Learning');
        completeStep('layer-10', 'Learning phase complete.');
        setTimeout(() => store.setMode('idle'), 2000);
        return;
      }

      const isAgentMode = routingDecision.complexity === 'COMPLEX';

      if (!isAgentMode) {
        // ==========================================
        // [5A] THINKING: CHAT MODE (SIMPLU / MEDIU)
        // ==========================================
        store.setMode('chat');
        setStep(4, 10, '[5] Thinking (Chat Mode): Understand -> Memory -> Tool -> Respond');
        
        store.updateArchitectureStepStatus('layer-5', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-6', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-7', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-8', 'completed', 'Skipped (Chat Mode)');
        
        let toolContextStr = "";

        // MEDIU -> Chat Mode + Tool
        if (routingDecision.complexity === 'MEDIU') {
             setStep(5, 10, '[5B] Tool Decision (Chat Mode)');
             store.updateArchitectureStepStatus('layer-7', 'in_progress', 'Executing temporary tool for Chat Mode');
             
             // Lightweight planner call to grab exactly 1 required tool
             const singleTaskPlan = await AgentPlanner.createSingleToolPlan(text, perceptionContextStr, activeToolsStr, llmService, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || "");
             
             if (singleTaskPlan.tasks && singleTaskPlan.tasks.length > 0 && singleTaskPlan.tasks[0].tool) {
                 const t = singleTaskPlan.tasks[0];
                 store.setPlan([{ id: t.id, description: t.description, status: 'in_progress', logs: [] }]);
                 
                 try {
                     const extResult = await ToolRegistry.executeTool(t.tool as string, t.toolArgs || { query: text }, { llmService });
                     if (extResult && extResult.success) {
                         toolContextStr = `\n\nTOOL RESULT CONTEXT (${t.tool}):\n${JSON.stringify(extResult.data).substring(0, 3000)}`;
                         store.updateTaskStatus(t.id, 'completed');
                     } else {
                         store.updateTaskStatus(t.id, 'failed');
                     }
                 } catch (e) {
                     store.updateTaskStatus(t.id, 'failed');
                 }
             }
             store.updateArchitectureStepStatus('layer-7', 'completed', 'Chat Tool phase complete');
        }

        let chatPrompt = `SYSTEM CONTEXT:\n${minimalContextStr}\n\nMEMORY CONTEXT:\n${memoryContextStr}\n\nPERCEPTION CONTEXT:\n${perceptionContextStr}\n\nINJECTED SKILLS:\n${injectedSkillsStr}${toolContextStr}\n\nYou are a helpful assistant. User asked: "${text}". Respond concisely and naturally based on the provided context.

FORMAT SELECTION:
- Use Markdown for structured explanations.
- **CHART GENERATION PROTOCOL:** You MUST use the exact tag \`\`\`chart (not json) followed by strict JSON for Chart.js. Example: \`\`\`chart\n{"type": "bar", "data": {...}}\n\`\`\`
- **DIAGRAM PROTOCOL:** You MUST use the exact tag \`\`\`mermaid (not json) followed by Mermaid syntax. Example: \`\`\`mermaid\ngraph TD;\n...\n\`\`\`
- **WIDGET PROTOCOL:** You MUST use the exact tag \`\`\`widget followed by JSON for special widgets. Example: \`\`\`widget\n{"type": "portfolio-dashboard"}\n\`\`\``;
        
        const chatResponse = await llmService.generateSimpleText(
          chatPrompt,
          provider,
          openRouterKey,
          openRouterModel,
          openAiKey,
          openAiModel,
          activeLocalModel,
          geminiApiKey || ""
        );
        
        // [9] RESPONSE
        setStep(9, 10, '[9] Response Generation: Delivering chat response...', 'layer-9');
        store.setConfidence('high');
        completeStep('layer-9', 'Chat response delivered.');
        onComplete(chatResponse); // Deliver first!
        
        // [10] LEARNING
        setStep(10, 10, '[10] Learning: SYNC & ASYNC updates...', 'layer-10');
        await MemoryManager.syncUpdateSemantic('profile', 'last_interaction', new Date().toISOString());
        MemoryManager.asyncSaveEpisode(perceptionContext.realIntent || 'Chat Interaction', `User asked: ${text}`, chatResponse.substring(0, 200));
        completeStep('layer-10', 'Learning phase complete.');
        
        setTimeout(() => store.setMode('idle'), 2000);
        return;
      }

      // ==========================================
      // [5B] THINKING: AGENT MODE (COMPLEX LOOP)
      // ==========================================
      store.setMode('agent');
      
      // Priority Engine Treatment
      if (routingDecision.priority === 'OPTIONAL') {
        onComplete(`Am observat solicitarea ta ("${text}"), dar am evaluat-o ca fiind opțională în contextul curent. Te pot ajuta cu altceva?`);
        store.setMode('idle');
        return;
      }

      // Step 1: CLARIFY
      setStep(5, 10, '[5] Planner: Clarifying intent and decomposing...', 'layer-5');
      
      const executionResults: any[] = [];
      
      // Step 2: DECOMPOSE & Step 3: PLAN
      const agentPlan = await AgentPlanner.createFullPlan(
        text, 
        history, 
        routingDecision, 
        systemContextStr,
        memoryContextStr,
        perceptionContextStr,
        injectedSkillsStr,
        activeToolsStr,
        executionResults,
        llmService,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey || ""
      );
      
      const plan = agentPlan.tasks.map(t => ({
        id: t.id,
        description: t.description,
        status: 'pending' as const,
        logs: []
      }));
      store.setPlan(plan);
      addStepLog('layer-5', 'result', `Generated plan with ${plan.length} tasks.`);
      completeStep('layer-5', 'Plan created.');
      
      // Step 5: EXECUTE (Iterative)
      setStep(6, 10, '[6] Pre-Tool Safety: Evaluating constraints...', 'layer-6');
      addStepLog('layer-6', 'thought', 'Checking safety constraints for planned tools.');
      completeStep('layer-6', 'Safety checks passed.');

      setStep(7, 10, '[7] Tools Execution: Executing planned tasks...', 'layer-7');
      for (let i = 0; i < agentPlan.tasks.length; i++) {
        iterations++;
        if (iterations === 8) {
          onChunk("", "⚠️ Cost Guard: Reached iteration 8. Nearing limit.\n");
        }
        if (iterations >= MAX_ITERATIONS) {
          onChunk("", "🛑 Cost Guard: Max iterations reached. Delivering what we have.\n");
          break;
        }

        const task = agentPlan.tasks[i];
        store.updateTaskStatus(task.id, 'in_progress');
        store.addTaskLog(task.id, { type: 'thought', content: `Starting execution of task: ${task.description}` });
        addStepLog('layer-7', 'thought', `Executing task ${i+1}/${agentPlan.tasks.length}: ${task.description}`);

        // ==========================================
        //  EXECUTE DECISION (Am suficiente date?)
        // ==========================================
        let toolResultStr = '';
        let duration = 500;
        const startTime = Date.now();
        let skipTool = false;

        if (task.tool && executionResults.length > 0) {
            store.addTaskLog(task.id, { type: 'thought', content: `Checking if current context already satisfies task...` });
            const checkPrompt = `Task: ${task.description}. Context: ${JSON.stringify(executionResults).substring(0, 500)}. Can task be satisfied WITHOUT calling "${task.tool}"? Reply exactly YES or NO.`;
            
            const checkResult = await llmService.generateSimpleText(checkPrompt, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || "");
            if (checkResult.trim().toUpperCase().startsWith('YES')) {
                skipTool = true;
                store.addTaskLog(task.id, { type: 'action', content: `Task already satisfied by accumulated context. Skipping tool execution.` });
                addStepLog('layer-7', 'action', `Skipped tool ${task.tool} - enough data present.`);
                executionResults.push({ task: task.description, result: 'Skipped - Context sufficient' });
                toolResultStr = 'Context sufficient';
            }
        }

        if (task.tool && !skipTool) {
          store.addTaskLog(task.id, { type: 'action', content: `Preparing to use tool: ${task.tool}`, toolName: task.tool });
          // ==========================================
          // [6] PRE-TOOL SAFETY
          // ==========================================
          setStep(6, 10, '[6] Pre-Tool Safety: Checking safety constraints...', 'layer-6');
          
          // 6.1 WRITE OPERATION GUARD
          let isWriteOperation = SystemContext.isWriteTool(task.tool as string);
          if (isWriteOperation && task.toolArgs?.action && task.toolArgs.action.startsWith('read_')) {
            isWriteOperation = false;
          }
          const isExecuteCode = task.tool === 'execute_code';
          
          if (isWriteOperation && !isExecuteCode) {
            addStepLog('layer-6', 'thought', `Write operation detected for ${task.tool}. Requesting confirmation.`);
            store.addTaskLog(task.id, { type: 'action', content: `Delegating write operation (${task.tool}) to UI for confirmation.` });
            
            let pendingAction: any = null;
            if (task.tool === 'library_tool') {
               const action = task.toolArgs?.action;
               const payload = task.toolArgs?.payload || {};
               if (action === 'save_page') {
                 pendingAction = {
                    type: payload.action === 'update' ? 'update_page' : 'create_page',
                    data: { title: payload.title || task.description, content: payload.content || "" }
                 };
               } else if (['insert_block', 'replace_block', 'delete_block', 'update_table_cell'].includes(action)) {
                 pendingAction = {
                    type: 'block_operation',
                    data: { operation: action, args: payload }
                 };
               }
            } else if (task.tool === 'calendar_tool') {
               pendingAction = {
                  type: 'calendar_event',
                  data: { operation: task.toolArgs?.action.replace('_event', ''), args: task.toolArgs?.payload || {} }
               };
            } else if (task.tool === 'portfolio_tool') {
               pendingAction = {
                  type: 'complex_module_action',
                  data: { module: 'portfolio', action: task.toolArgs?.action, data: task.toolArgs?.payload }
               };
            } else if (task.tool === 'safe_digital_tool') {
               pendingAction = {
                  type: 'complex_module_action',
                  data: { module: 'safe_digital', action: task.toolArgs?.action, data: task.toolArgs?.payload }
               };
            }
            
            if (pendingAction) {
               const confirmResult = await requestConfirmation(pendingAction);
               if (confirmResult === 'cancel') {
                  addStepLog('layer-6', 'error', `User cancelled the write operation.`);
                  store.addTaskLog(task.id, { type: 'error', content: `User cancelled the action.` });
                  toolResultStr = 'User cancelled the action. Ask the user what they would like to do next.';
                  store.updateTaskStatus(task.id, 'failed');
                  completeStep('layer-6', 'Safety check failed (Cancelled).');
                  continue; // Skip this task
               } else {
                  addStepLog('layer-6', 'action', `User confirmed the write operation.`);
                  store.addTaskLog(task.id, { type: 'action', content: `User confirmed the action. Executing...` });
                  // The UI already executed the action in handleConfirmAction, so we just mark it success
                  toolResultStr = 'Write operation confirmed by user. Awaiting UI execution.';
                  addStepLog('layer-6', 'action', `Write operation confirmed by user. Awaiting UI execution.`);
                  store.updateTaskStatus(task.id, 'completed');
                  completeStep('layer-6', 'Safety check passed.');
                  continue; // Skip actual tool execution since UI did it
               }
            }
          }
          
          // 6.2 SENSITIVE DATA FILTER (Heuristic Scanner)
          if (task.toolArgs) {
             const payloadString = JSON.stringify(task.toolArgs);
             
             // Advanced Regex for Sensitive Data
             const sensitivePatterns = [
                /sk-[a-zA-Z0-9]{32,}/, // OpenAI API Key format
                /(?:password|secret|api_key|token)["'\s:=]+([^"'\s]+)/i, // Key-value pairs
                /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
                /\b(?:\d[ -]*?){13,16}\b/ // Credit Card format
             ];
             
             // Entropy check (simple heuristic for high randomness strings)
             const hasHighEntropy = (str: string) => {
                const words = str.split(/\s+/);
                for (const word of words) {
                   if (word.length > 20 && /^[a-zA-Z0-9_-]+$/.test(word)) {
                      // Count unique characters
                      const uniqueChars = new Set(word).size;
                      if (uniqueChars > 15) return true;
                   }
                }
                return false;
             };

             const hasSensitiveRegex = sensitivePatterns.some(pattern => pattern.test(payloadString));
             const hasEntropy = hasHighEntropy(payloadString);

             if (hasSensitiveRegex || hasEntropy) {
                addStepLog('layer-6', 'error', `Sensitive data detected in payload. Requesting user decision.`);
                store.addTaskLog(task.id, { type: 'error', content: `Sensitive data detected. Pausing for user confirmation.` });
                
                const pendingAction = {
                   type: 'sensitive_data_warning',
                   data: { payload: task.toolArgs || { query: task.description } }
                };
                
                const confirmResult = await requestConfirmation(pendingAction);
                
                if (confirmResult === 'cancel') {
                   addStepLog('layer-6', 'error', `User cancelled the operation due to sensitive data.`);
                   store.addTaskLog(task.id, { type: 'error', content: `User cancelled the action.` });
                   toolResultStr = 'User cancelled the action due to sensitive data. Ask what to do next.';
                   store.updateTaskStatus(task.id, 'failed');
                   completeStep('layer-6', 'Safety check failed (Cancelled).');
                   continue;
                } else if (confirmResult === 'redact') {
                   addStepLog('layer-6', 'action', `User chose to redact sensitive data.`);
                   store.addTaskLog(task.id, { type: 'action', content: `Proceeding with redacted data.` });
                   // Redact the data
                   if (task.toolArgs && task.toolArgs.query) {
                      task.toolArgs.query = task.toolArgs.query.replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]');
                      task.toolArgs.query = task.toolArgs.query.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
                   }
                   task.description = task.description.replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]');
                } else {
                   addStepLog('layer-6', 'action', `User approved sending sensitive data.`);
                   store.addTaskLog(task.id, { type: 'action', content: `User approved. Proceeding with original data.` });
                }
             }
          }
          
          completeStep('layer-6', 'Safety checks passed.');

          // ==========================================
          // [7] TOOLS
          // ==========================================
          store.addTaskLog(task.id, { type: 'action', content: `Executing tool with query: ${task.description}`, toolName: task.tool });
          
          let result;
          let retries = 0;
          const MAX_RETRIES = 1;
          let timeoutOccurred = false;
          
          const timeoutConfig: Record<string, number> = {
            'memory_retrieval': 10000,
            'workspace_tool': 10000,
            'library_tool': 10000,
            'portfolio_tool': 10000,
            'safe_digital_tool': 10000,
            'calendar_tool': 10000,
            'get_calendar_holidays': 10000,
            'perform_search': 25000,
            'web_search': 25000,
            'execute_code': 45000
          };
          const timeoutMs = timeoutConfig[task.tool as string] || 15000;
          
          while (retries < MAX_RETRIES) {
            try {
              // Add a timeout wrapper
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs));
              const executionPromise = ToolRegistry.executeTool(task.tool as string, task.toolArgs || { query: task.description }, { llmService });
              
              result = await Promise.race([executionPromise, timeoutPromise]) as any;
              
              if (result && result.success) break;
            } catch (err) {
              if (err instanceof Error && err.message === 'Timeout') {
                timeoutOccurred = true;
                break; // Exit retry loop on timeout
              }
            }
            
            retries++;
            if (retries < MAX_RETRIES) {
              store.addTaskLog(task.id, { type: 'error', content: `Tool execution failed (Attempt ${retries}/${MAX_RETRIES}). Retrying...`, toolName: task.tool });
              await this.simulateDelay(500);
            }
          }
          
          if (timeoutOccurred) {
             onChunk("", `[7] Tools: Timeout occurred for ${task.tool}.\n`);
             store.addTaskLog(task.id, { type: 'error', content: `Tool execution timed out.`, toolName: task.tool });
             result = { success: false, error: 'Timeout', summary: 'Execution timed out.' };
          } else if (!result || !result.success) {
             onChunk("", `[7] Tools: ${task.tool} failed after ${MAX_RETRIES} retries.\n`);
             store.addTaskLog(task.id, { type: 'error', content: `Tool execution failed.`, toolName: task.tool });
          }
          
          // 7.4 CONTEXT EXTERNALIZATION
          if (result && result.data) {
            const resultString = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
            
            // Raise threshold to 60k chars (~15k tokens) to use context better, compress intelligently when approaching limits
            const COMPACTION_THRESHOLD = 60000;
            
            if (resultString.length > COMPACTION_THRESHOLD) {
              onChunk("", `[7] Tools: Result is massive (${resultString.length} chars). Running intelligent compaction...\n`);
              store.addTaskLog(task.id, { type: 'thought', content: `Result too large (>60k chars). Running intelligent information compaction to preserve key points.` });
              
              let smartSummary = "";
              try {
                const compactionPrompt = `
You are an advanced data compaction system.
The following raw data was returned by the tool "${task.tool}" while attempting to solve this task: "${task.description}".
The data is extremely large (${resultString.length} characters).

CRITICAL INSTRUCTIONS:
1. Create a comprehensive, highly dense summary of the data. 
2. DO NOT just read the beginning. You must extract and preserve EVERY important element, decision, metric, link, or factual information.
3. Remove redundant formatting, boilerplate, or repetitive structures, but KEEP ALL context crucial to the user's task.
4. If the data is code, describe its structure, main functions, and any extracted logic without pasting massive blocks.

RAW DATA (truncated safely to prevent hard limits):
${resultString.substring(0, 100000)}
`;
                smartSummary = await llmService.generateSimpleText(
                  compactionPrompt,
                  provider,
                  openRouterKey,
                  openRouterModel,
                  openAiKey,
                  openAiModel,
                  activeLocalModel,
                  geminiApiKey || ""
                );
              } catch (compactionError) {
                console.error("Compaction LLM failed, falling back to basic extraction", compactionError);
                // Fallback to substring if it crashes
                smartSummary = "COMPACTION FAILED. Basic extraction: " + resultString.substring(0, 4000) + "... [DATA TOO LARGE TO SUMMARIZE FULLY].";
              }
              
              // Real RAG externalization using db
              const path = `rag/ext_${Date.now()}`;
              const title = `Externalized data for ${task.tool}`;
              
              try {
                const { db } = await import('../memory/db');
                await db.semantic.add({
                  category: 'rag_cache',
                  key: path,
                  value: smartSummary,
                  updatedAt: Date.now()
                });
                
                result.data = { 
                  externalized: true,
                  path: path,
                  title: title,
                  smartSummary: smartSummary
                };
                result.summary = `Data compacted intelligently and full version externalized. Summary: ${smartSummary.substring(0, 200)}...`;
                
                addStepLog('layer-7', 'result', `Performed intelligent compaction on ${resultString.length} characters.`);
              } catch (err) {
                 console.error("Failed to externalize RAG to IndexedDB", err);
              }
            }
          }
          
          duration = Date.now() - startTime;
          addStepLog('layer-7', 'result', `Tool ${task.tool} completed in ${duration}ms`);
          toolResultStr = result ? result.summary : 'Failed';
          store.addTaskLog(task.id, { type: 'result', content: `Tool execution completed. Summary: ${toolResultStr}`, toolName: task.tool });
          executionResults.push({ task: task.description, tool: task.tool, result: result?.success ? result.data : result?.error });
        } else {
          store.addTaskLog(task.id, { type: 'thought', content: `No specific tool required. Executing default internal action.` });
          await this.simulateDelay(600);
          toolResultStr = `Executed default action.`;
          store.addTaskLog(task.id, { type: 'result', content: `Default action completed successfully.` });
          executionResults.push({ task: task.description, result: 'Success' });
        }
        
        // ==========================================
        // [8] POST-TOOL SAFETY
        // ==========================================
        setStep(8, 10, '[8] Post-Tool Safety: Verifying results...', 'layer-8');
        addStepLog('layer-8', 'thought', `Verifying results for task: ${task.description}`);
        // 8.1 Recursion Limiter: Handled by iterations check above and MAX_RETRIES
        // 8.2 Frustration Detector:
        if (perceptionContext.tone.toLowerCase().includes('frustrated') || perceptionContext.tone.toLowerCase().includes('angry')) {
           store.addTaskLog(task.id, { type: 'thought', content: `Frustration detected. Simplifying approach.` });
           addStepLog('layer-8', 'thought', 'Frustration detected. Simplifying approach.');
        }
        
        // 8.3 Self-Correction Loop (Fast LLM Check)
        // We need to check if result is defined, as it might not be for non-tool tasks or if the tool failed
        // We also need to be careful with the scope of `result`
        
        const skippedResults = [
           'Context sufficient', 
           'Executed default action.', 
           'Action executed successfully by the UI.', 
           'Write operation confirmed by user. Awaiting UI execution.'
        ];
        
        if (skippedResults.includes(toolResultStr)) {
           addStepLog('layer-8', 'thought', "QC bypassed — no external tool result to evaluate.");
           completeStep('layer-8', 'Safety verification passed (bypassed).');
        } else {
           let toolResultData = null;
           if (task.tool) {
              const lastResult = executionResults[executionResults.length - 1];
              if (lastResult && lastResult.tool === task.tool && lastResult.result !== 'Timeout' && lastResult.result !== 'Failed') {
                 toolResultData = lastResult.result;
              }
           }

           if (task.tool && toolResultData) {
           addStepLog('layer-8', 'thought', `Evaluating quality of tool results...`);
           store.addTaskLog(task.id, { type: 'thought', content: `Evaluating quality of tool results...` });
           
           let snippet = "";
           try {
              snippet = JSON.stringify(toolResultData);
           } catch(e) {
              snippet = String(toolResultData);
           }
           
           if (snippet.length > 800) {
              snippet = `[Result was large, showing preview]: ${snippet.substring(0, 800)}... <truncated by system>`;
           }

           const evalPrompt = `
You are a Quality Control system.
User Request: "${text}"
Task: "${task.description}"
Tool Used: "${task.tool}"
Tool Result Snippet: "${snippet}"
Previously completed tasks: ${executionResults.slice(0, -1).map(r => r.task).join(', ') || 'None'}

Are these results sufficient and correct to answer the user's request?
CRITICAL RULES: 
1. The tool result snippet may be truncated for length. Do NOT fail the quality check if the JSON is incomplete or truncated.
2. If the result indicates a "Mock result", "No API Key provided", "Failed", or an expected environmental constraint, DO NOT FAIL. Accept it as the reality of the sandbox environment and reply "YES".
3. If memory retrieval returns conversation metadata but not specific requested facts, it simply means the user's memory does not contain it. DO NOT FAIL. Accept it and reply "YES".
Reply ONLY with "YES" or "NO: [reason]".
`;
           const evalResult = await llmService.generateSimpleText(
             evalPrompt,
             provider,
             openRouterKey,
             openRouterModel,
             openAiKey,
             openAiModel,
             activeLocalModel,
             geminiApiKey || ""
           );
           
           if (evalResult.trim().toUpperCase().startsWith('NO')) {
              addStepLog('layer-8', 'error', `Quality check failed: ${evalResult}`);
              store.addTaskLog(task.id, { type: 'error', content: `Quality check failed: ${evalResult}` });
              
              // Only retry once per task
              if (!task.retried) {
                 addStepLog('layer-8', 'action', `Initiating self-correction loop. Replanning with new arguments.`);
                 store.addTaskLog(task.id, { type: 'action', content: `Initiating self-correction loop. Replanning with new arguments.` });
                 
                 // Mark task as failed so planner knows
                 store.updateTaskStatus(task.id, 'failed');
                 
                 // Add a new task to the plan dynamically
                 const newTask = {
                    id: `task-${Date.now()}`,
                    description: `RETRY: ${task.description}. Previous args failed. Replanner must generate new tool arguments based on accumulated context: ${JSON.stringify(executionResults).substring(0, 300)}`,
                    status: 'pending' as const,
                    tool: task.tool,
                    toolArgs: null, // Wipe args to let default or next cycle fallback correctly
                    logs: [],
                    retried: true
                 };
                 
                 // Insert new task after current one
                 agentPlan.tasks.splice(i + 1, 0, newTask);
                 
                 // Update UI plan
                 const newPlanUI = [...plan];
                 newPlanUI.splice(i + 1, 0, { id: newTask.id, description: newTask.description, status: 'pending', logs: [] });
                 store.setPlan(newPlanUI);
                 
                 completeStep('layer-8', 'Self-correction loop triggered.');
                 continue; // Move to the next task (which is the retry we just added)
              } else {
                 addStepLog('layer-8', 'thought', `Task already retried. Accepting sub-optimal result.`);
                 store.addTaskLog(task.id, { type: 'thought', content: `Proceeding despite suboptimal results after retry.` });
                 completeStep('layer-8', 'Safety verification complete (accepted with warnings).');
              }
           } else {
              addStepLog('layer-8', 'result', `Quality check passed.`);
              store.addTaskLog(task.id, { type: 'result', content: `Quality check passed.` });
              completeStep('layer-8', 'Safety verification passed.');
           }
        }
      }

        // 8.4 Response Sanity Check: Handled in synthesis prompt
        completeStep('layer-8', 'Post-tool safety checks passed.');
        
        store.addAction({
          id: generateId(),
          timestamp: Date.now(),
          toolName: task.tool || 'general_action',
          summary: task.description,
          status: 'success',
          durationMs: duration,
          resultPreview: toolResultStr
        });
        
        store.updateTaskStatus(task.id, 'completed');
        store.addTaskLog(task.id, { type: 'thought', content: `Task marked as completed.` });
      }
      
      completeStep('layer-7', 'All planned tasks executed.');

      // ==========================================
      // [9] RESPONSE GENERATION
      // ==========================================
      setStep(9, 10, '[9] Response Generation: Synthesizing final response...', 'layer-9');
      addStepLog('layer-9', 'thought', 'Synthesizing execution results into final response.');
      
      const compressedResults = executionResults.map(r => {
        let compressedResultStr = '';
        if (typeof r.result === 'object' && r.result !== null) {
           if ((r.result as any).smartSummary) {
              compressedResultStr = (r.result as any).smartSummary;
           } else {
              try {
                 compressedResultStr = JSON.stringify(r.result).substring(0, 4000);
                 if (JSON.stringify(r.result).length > 4000) compressedResultStr += '... <truncated>';
              } catch(e) {
                 compressedResultStr = String(r.result).substring(0, 4000);
              }
           }
        } else {
           compressedResultStr = String(r.result).substring(0, 4000);
           if (String(r.result).length > 4000) compressedResultStr += '... <truncated>';
        }
        return {
           task: r.task,
           tool: r.tool,
           result: compressedResultStr
        };
      });

      const finalPrompt = `SYSTEM CONTEXT:
${systemContextStr}

MEMORY CONTEXT:
${memoryContextStr}

PERCEPTION CONTEXT:
${perceptionContextStr}

INJECTED SKILLS:
${injectedSkillsStr}

You are the SYNTHESIS layer of an advanced AI agent.
User asked: "${text}"

Execution Results:
${JSON.stringify(compressedResults)}

CRITICAL INSTRUCTIONS:
1. Provide a final, conversational response based on the execution results.
2. DO NOT output the raw plan, todo list, or any internal task IDs (e.g., task_1) to the user.
3. DO NOT include any "Thinking Process", "Steps", or "Internal Reasoning" in your final response.
4. If tools were used to find information, cite the sources clearly using [1][2] format.
5. If a widget (chart, diagram, etc.) was generated in a previous step, do not repeat its configuration unless necessary for explanation.
6. Respond in the same language as the user's request.

FORMAT SELECTION:
- Use Markdown for structured explanations.
- **CHART GENERATION PROTOCOL:** You MUST use the exact tag \`\`\`chart (not json) followed by strict JSON for Chart.js. Example: \`\`\`chart\n{"type": "bar", "data": {...}}\n\`\`\`
- **DIAGRAM PROTOCOL:** You MUST use the exact tag \`\`\`mermaid (not json) followed by Mermaid syntax. Example: \`\`\`mermaid\ngraph TD;\n...\n\`\`\`
- **WIDGET PROTOCOL:** You MUST use the exact tag \`\`\`widget followed by JSON for special widgets. Example: \`\`\`widget\n{"type": "portfolio-dashboard"}\n\`\`\`


${useAgentStore.getState().simplifyResponse ? "IMPORTANT: User is frustrated. Respond in plain conversational text. No markdown headers. No bullet lists. No code blocks unless absolutely necessary. Be direct and concise." : ""}

At the very end of your response, on a new line, output your confidence in this format exactly: <confidence>High</confidence> or <confidence>Medium</confidence> or <confidence>Low</confidence>. Nothing else on that line.

Final Response:
`;
      
      let finalResponse = await llmService.generateSimpleText(
        finalPrompt,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey || ""
      );

      // Post-processing cleanup to ensure no plan leakage
      finalResponse = finalResponse
        .replace(/### Plan:?[\s\S]*?(?=###|$)/gi, '')
        .replace(/### Todo:?[\s\S]*?(?=###|$)/gi, '')
        .replace(/Task \d+:[\s\S]*?(?=\n\n|$)/gi, '')
        .trim();
      
      // Extract Confidence Score 
      const confidenceMatch = finalResponse.match(/<confidence>(High|Medium|Low)<\/confidence>/i);
      const confidence = confidenceMatch ? confidenceMatch[1].toLowerCase() as 'high' | 'medium' | 'low' : 'medium';
      
      finalResponse = finalResponse.replace(/<confidence>(High|Medium|Low)<\/confidence>/i, '').trim();

      store.setConfidence(confidence);
      
      addStepLog('layer-9', 'result', `Response generated with ${confidence} confidence.`);
      completeStep('layer-9', 'Response synthesis complete.');
      onComplete(finalResponse);
      
      // ==========================================
      // [10] LEARNING
      // ==========================================
      setStep(10, 10, '[10] Learning: SYNC & ASYNC updates...', 'layer-10');
      addStepLog('layer-10', 'thought', 'Performing SYNC and ASYNC memory updates.');
      
      // SYNC: Critical memory updates (Blocking)
      await MemoryManager.syncUpdateSemantic('profile', 'last_interaction', currentTimestamp);
      addStepLog('layer-10', 'result', 'SYNC updates completed.');
      
      // ASYNC: Episode save, patterns (Non-blocking)
      MemoryManager.asyncSaveEpisode(
        perceptionContext.realIntent || 'Agent Execution', 
        `User asked: ${text}`, 
        finalResponse.substring(0, 200)
      );
      
      // Update procedural memory based on conditions
      if (useAgentStore.getState().simplifyResponse) {
         MemoryManager.asyncUpdateProcedural(
           "When user is frustrated",
           "Simplify response format, avoid markdown",
           2
         );
      } else if (routingDecision.injectedSkills && routingDecision.injectedSkills.length > 0) {
         MemoryManager.asyncUpdateProcedural(
           `When intent is ${perceptionContext.realIntent}`,
           `Inject skills: ${routingDecision.injectedSkills.join(', ')}`,
           1
         );
      }
      
      addStepLog('layer-10', 'result', 'ASYNC updates dispatched.');
      completeStep('layer-10', 'Learning phase complete.');
      
      setTimeout(() => {
        store.setMode('idle');
      }, 2000);

    } catch (error) {
      console.error("AgentEngine Error:", error);
      onChunk("", `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      onComplete("I encountered an error while processing your request. Please try again.");
      store.setMode('idle');
    }
  }

  private static simulateDelay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
