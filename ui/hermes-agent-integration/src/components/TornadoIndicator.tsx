import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, XCircle, Terminal, Brain, Search, FileText, Code, Check } from "lucide-react";
import { useAgentStore } from "../store/agentStore";
import { SubTaskLog } from "../types/agent";

interface TornadoIndicatorProps {
  isThinking: boolean;
  reasoning?: string;
  currentStep?: string; // Kept for backwards compatibility if passed, but unused internally
  agentPlan?: any[];
  agentActions?: any[];
}

const LogIcon = ({ type, toolName }: { type: string, toolName?: string }) => {
  if (type === 'thought') return <Brain size={12} className="text-pplx-muted" />;
  if (type === 'error') return <XCircle size={12} className="text-red-400" />;
  if (type === 'result') return <Check size={12} className="text-green-400" />;
  
  if (toolName) {
    if (toolName.includes('search')) return <Search size={12} className="text-blue-400" />;
    if (toolName.includes('file')) return <FileText size={12} className="text-emerald-400" />;
    if (toolName.includes('code')) return <Code size={12} className="text-purple-400" />;
  }
  return <Terminal size={12} className="text-pplx-accent" />;
};

export const TornadoIndicator: React.FC<TornadoIndicatorProps> = ({
  isThinking,
  reasoning,
  agentPlan,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  // Subscribe to store
  const storePlan = useAgentStore(state => state.planPanel);
  const storeArchitectureSteps = useAgentStore(state => state.architectureSteps);
  const storeStepDesc = useAgentStore(state => state.stepDescription);

  // Determine active data sources
  const isAgentModeActive = isThinking 
    ? (storeArchitectureSteps && storeArchitectureSteps.length > 0) 
    : (agentPlan && agentPlan.length > 0);
  const plan = isThinking ? storePlan : agentPlan;
  const architectureSteps = storeArchitectureSteps;
  
  // Combine reasoning from props with live agent steps
  const [liveReasoning, setLiveReasoning] = useState<string[]>([]);
  
  useEffect(() => {
    if (isThinking && storeStepDesc) {
      setLiveReasoning(prev => {
        if (prev[prev.length - 1] !== storeStepDesc) {
          return [...prev, storeStepDesc];
        }
        return prev;
      });
    }
    if (!isThinking) {
      setLiveReasoning([]);
    }
  }, [storeStepDesc, isThinking]);

  const displayReasoning = isThinking
    ? (liveReasoning.length > 0 ? liveReasoning.join('\n') : reasoning)
    : reasoning;

  // Only show if there is reasoning to show or if it's an agent message with a plan/actions
  if (!displayReasoning && !isThinking && !isAgentModeActive) return null;

  // Simplify step text for premium look
  const simplifyStep = (step: string) => {
    if (!step) return "";
    // Remove prefixes like "[1] Perception:", "Step 1:", "Action:", "Thought:"
    let clean = step.replace(/^(\[\d+\]|Step \d+:|Action:|Thought:)\s*/i, "");
    // Also remove things like "[1] Perception: " if it matches
    clean = clean.replace(/^\[\d+\]\s*[^:]+:\s*/i, ""); 
    
    if (clean.toLowerCase().includes("searching for")) {
      return clean;
    }
    return clean.length > 70 ? `${clean.substring(0, 70)}...` : clean;
  };

  // Generate a stable summary for non-agent modes to prevent rapid flickering
  const [stageSummary, setStageSummary] = useState("Analyzing request...");

  useEffect(() => {
    if (!isThinking) return;

    if (isAgentModeActive && storeStepDesc) {
      setStageSummary(simplifyStep(storeStepDesc));
      return;
    }

    // For Chat Mode (raw reasoning stream)
    if (reasoning) {
      const lowerReasoning = reasoning.toLowerCase();
      // Use the last 200 characters to determine the current stage
      const recentReasoning = lowerReasoning.slice(-200);
      
      if (recentReasoning.includes("synthesiz") || recentReasoning.includes("final") || recentReasoning.includes("conclu")) {
        setStageSummary("Synthesizing response...");
      } else if (recentReasoning.includes("search") || recentReasoning.includes("http") || recentReasoning.includes("find")) {
        setStageSummary("Searching for information...");
      } else if (recentReasoning.includes("evaluat") || recentReasoning.includes("consider") || recentReasoning.includes("compar")) {
        setStageSummary("Evaluating options...");
      } else if (reasoning.length > 150) {
        setStageSummary("Processing information...");
      } else {
        setStageSummary("Analyzing request...");
      }
    }
  }, [reasoning, storeStepDesc, isThinking, isAgentModeActive]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div className="flex flex-col my-2 w-full font-sans">
      {/* DEBUG INFO */}
      <div className="hidden">
        DEBUG: isThinking={String(isThinking)}, isAgentModeActive={String(isAgentModeActive)}, planLength={plan?.length}, agentPlanLength={agentPlan?.length}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative flex items-center gap-2.5 cursor-pointer transition-all w-fit py-1.5 px-4 rounded-full bg-pplx-secondary/40 hover:bg-pplx-secondary/60 overflow-hidden group shadow-sm"
      >
        {/* Sweeping Light Background Effect */}
        {isThinking && (
          <div className="absolute inset-0 z-0 bg-[linear-gradient(110deg,transparent,40%,rgba(32,184,205,0.15),60%,transparent)] dark:bg-[linear-gradient(110deg,transparent,40%,rgba(255,255,255,0.1),60%,transparent)] bg-[length:200%_100%] animate-shimmer" />
        )}
        
        <span className={`relative z-10 text-[13px] font-medium tracking-wide transition-colors ${isThinking ? "text-pplx-text" : "text-pplx-muted group-hover:text-pplx-text"}`}>
          {isThinking ? stageSummary : "Thought Process Completed"}
        </span>

        <ChevronDown
          size={14}
          className={`relative z-10 text-pplx-muted transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 w-full max-w-3xl flex flex-col pl-4 relative">
          
          {/* Vertical Timeline Line */}
          <div className="absolute left-[23px] top-2 bottom-2 w-[1px] bg-pplx-border/50 z-0" />

          {/* Agent Plan & Actions Container */}
          {isAgentModeActive && architectureSteps && architectureSteps.length > 0 ? (
            <div className="flex flex-col gap-2 relative z-10">
              {architectureSteps.map((step: any) => {
                const isStepExpanded = expandedTasks[step.id];
                const hasLogs = step.logs && step.logs.length > 0;
                const isToolsLayer = step.id === 'layer-7';
                const hasTasks = isToolsLayer && plan && plan.length > 0;
                const isExpandable = hasLogs || hasTasks;

                return (
                  <div key={step.id} className="flex flex-col relative">
                    {/* Step Header */}
                    <div 
                      className={`flex items-start gap-3 text-[12px] transition-colors ${isExpandable ? 'cursor-pointer' : ''}`}
                      onClick={() => isExpandable && toggleTask(step.id)}
                    >
                      <div className="mt-1.5 shrink-0 flex items-center justify-center w-4 h-4 bg-pplx-bg z-10">
                        {step.status === 'completed' && <CheckCircle2 size={13} className="text-green-500 bg-pplx-bg" />}
                        {step.status === 'in_progress' && (
                          <div className="relative flex items-center justify-center w-3 h-3">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-pplx-accent opacity-75 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pplx-accent"></span>
                          </div>
                        )}
                        {step.status === 'failed' && <XCircle size={13} className="text-red-500 bg-pplx-bg" />}
                        {step.status === 'pending' && <Circle size={11} className="text-pplx-muted bg-pplx-bg" />}
                      </div>
                      
                      <div className={`flex-1 flex flex-col px-3 py-1.5 rounded-r-md transition-all duration-500 ${step.status === 'in_progress' ? 'bg-pplx-accent/10 border-l-2 border-pplx-accent' : 'border-l-2 border-transparent hover:bg-pplx-secondary/30'}`}>
                        <span className={`font-semibold leading-snug transition-colors duration-300 ${step.status === 'completed' ? 'text-pplx-muted' : step.status === 'in_progress' ? 'text-pplx-accent' : 'text-pplx-muted/70'}`}>
                          {step.name}
                        </span>
                        <span className={`italic text-[11px] leading-snug transition-colors duration-300 ${step.status === 'completed' ? 'text-pplx-muted/70' : step.status === 'in_progress' ? 'text-pplx-accent/80' : 'text-pplx-muted/50'}`}>
                          {step.description}
                        </span>
                        
                        {/* Subtasks / Logs Drill-down */}
                        {isStepExpanded && isExpandable && (
                          <div className="mt-3 flex flex-col gap-2.5 font-mono text-[11px]">
                            {/* Render Logs */}
                            {hasLogs && step.logs.map((log: SubTaskLog, idx: number) => (
                              <div key={log.id || idx} className="flex items-start gap-2 group/log">
                                <div className="mt-0.5 opacity-60 group-hover/log:opacity-100 transition-opacity">
                                  <LogIcon type={log.type} toolName={log.toolName} />
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <span className={`${log.type === 'thought' ? 'text-pplx-muted italic' : log.type === 'error' ? 'text-red-400' : 'text-pplx-text/80'}`}>
                                    {log.content}
                                  </span>
                                  {log.toolName && log.type === 'action' && (
                                    <span className="text-[10px] text-pplx-accent/70 mt-0.5">
                                      {log.toolName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Render Tasks for Tools Layer */}
                            {hasTasks && (
                              <div className="mt-2 flex flex-col gap-2 border-l border-pplx-border/50 pl-3">
                                {plan.map((task: any) => {
                                  const isTaskExpanded = expandedTasks[task.id];
                                  const taskHasLogs = task.logs && task.logs.length > 0;
                                  return (
                                    <div key={task.id} className="flex flex-col relative">
                                      <div 
                                        className={`flex items-start gap-2 text-[11px] transition-colors ${taskHasLogs ? 'cursor-pointer' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); taskHasLogs && toggleTask(task.id); }}
                                      >
                                        <div className="mt-1 shrink-0 flex items-center justify-center w-3 h-3">
                                          {task.status === 'completed' && <CheckCircle2 size={11} className="text-green-500" />}
                                          {task.status === 'in_progress' && <Circle size={9} className="text-pplx-accent animate-pulse" />}
                                          {task.status === 'failed' && <XCircle size={11} className="text-red-500" />}
                                          {task.status === 'pending' && <Circle size={9} className="text-pplx-muted" />}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                          <span className={`italic ${task.status === 'completed' ? 'text-pplx-muted' : task.status === 'in_progress' ? 'text-pplx-accent' : 'text-pplx-muted/70'}`}>
                                            {task.description}
                                          </span>
                                          {isTaskExpanded && taskHasLogs && (
                                            <div className="mt-2 flex flex-col gap-2">
                                              {task.logs.map((log: SubTaskLog, idx: number) => (
                                                <div key={log.id || idx} className="flex items-start gap-2 group/log">
                                                  <div className="mt-0.5 opacity-60 group-hover/log:opacity-100 transition-opacity">
                                                    <LogIcon type={log.type} toolName={log.toolName} />
                                                  </div>
                                                  <div className="flex-1 flex flex-col">
                                                    <span className={`${log.type === 'thought' ? 'text-pplx-muted italic' : log.type === 'error' ? 'text-red-400' : 'text-pplx-text/80'}`}>
                                                      {log.content}
                                                    </span>
                                                    {log.toolName && log.type === 'action' && (
                                                      <span className="text-[10px] text-pplx-accent/70 mt-0.5">
                                                        {log.toolName}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {taskHasLogs && (
                                          <ChevronRight size={12} className={`text-pplx-muted mt-0.5 transition-transform ${isTaskExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isExpandable && (
                        <ChevronRight size={14} className={`text-pplx-muted mt-0.5 transition-transform ${isStepExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Fallback for old reasoning format if not using Agent Mode */}
          {!isAgentModeActive && displayReasoning && (
            <div className="flex flex-col gap-2 mt-2 ml-6">
              <div className="text-[12px] text-pplx-muted italic leading-relaxed whitespace-pre-wrap font-mono">
                {displayReasoning}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
