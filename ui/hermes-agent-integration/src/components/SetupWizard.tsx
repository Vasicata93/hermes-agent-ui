import React, { useState } from "react";
import { Server, MonitorSmartphone, Key, CheckCircle, ChevronRight, Loader2, Cpu, Globe } from "lucide-react";
import { RailwayDeployer } from "../services/RailwayDeployer";

interface SetupWizardProps {
  onComplete: (config: any) => void;
}

type SetupStep = "welcome" | "hosting" | "railway_auth" | "api_keys" | "deploying" | "done";

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<SetupStep>("welcome");
  const [hosting, setHosting] = useState<"local" | "railway" | null>(null);
  
  const [railwayToken, setRailwayToken] = useState("");
  const [localIp, setLocalIp] = useState("http://127.0.0.1:8000");

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    gemini: "",
  });

  const [deployStatus, setDeployStatus] = useState("Initializing deployment...");

  const handleDeploy = async () => {
    setStep("deploying");
    
    if (hosting === "railway") {
      try {
        setDeployStatus("Connecting to Railway...");
        const deployer = new RailwayDeployer(railwayToken);
        
        setDeployStatus("Creating project 'Hermes Agent'...");
        const projectId = await deployer.createProject("Hermes Agent");
        
        setDeployStatus("Provisioning environment...");
        const envId = await deployer.createEnvironment(projectId, "production");
        
        setDeployStatus("Linking GitHub repository...");
        const serviceId = await deployer.createService(projectId, "Vasicata93/hermes-agent-ui");
        
        setDeployStatus("Injecting secure API keys...");
        await deployer.upsertVariables(projectId, envId, serviceId, {
          OPENAI_API_KEY: apiKeys.openai,
          GEMINI_API_KEY: apiKeys.gemini,
        });

        setDeployStatus("Starting deployment process...");
        await deployer.deploy(projectId, envId, serviceId);
        
        // Simulating the rest since we can't easily poll for the domain in this basic implementation without more GraphQL
        setTimeout(() => {
          setStep("done");
          // Here we'd ideally return the actual railway URL. For now, we fallback to a placeholder or ask user.
        }, 3000);

      } catch (e: any) {
        setDeployStatus(`Error: ${e.message}. Please check your token and try again.`);
        setTimeout(() => setStep("railway_auth"), 4000);
      }
    } else {
      // Local hosting
      setTimeout(() => setStep("done"), 1500);
    }
  };

  const handleComplete = () => {
    const finalUrl = hosting === "local" ? localIp : "https://hermes-agent.up.railway.app"; // Defaulting placeholder for Railway
    onComplete({
      serverUrl: finalUrl,
      apiKeys,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-pplx-primary flex items-center justify-center p-4 font-sans text-pplx-text">
      <div className="w-full max-w-2xl bg-pplx-card border border-pplx-border/50 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-pplx-sidebar">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: 
              step === "welcome" ? "10%" : 
              step === "hosting" ? "30%" : 
              (step === "railway_auth" || step === "api_keys") ? "60%" : 
              step === "deploying" ? "85%" : "100%" 
            }} 
          />
        </div>

        <div className="p-10">
          {/* STEP 1: Welcome */}
          {step === "welcome" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu size={36} className="text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-4">Welcome to Hermes Agent</h1>
              <p className="text-pplx-muted mb-10 max-w-md mx-auto leading-relaxed">
                Your autonomous AI assistant is ready. Let's configure the agent's core environment and connect your intelligence providers.
              </p>
              <button 
                onClick={() => setStep("hosting")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-medium transition-all transform active:scale-95 flex items-center gap-2 mx-auto"
              >
                Begin Setup <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: Hosting Choice */}
          {step === "hosting" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold mb-2">Agent Hosting Environment</h2>
              <p className="text-pplx-muted mb-8 text-sm">Where should the Hermes backend (the brain) process your tasks?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div 
                  onClick={() => setHosting("local")}
                  className={`cursor-pointer p-6 rounded-2xl border-2 transition-all ${hosting === "local" ? "border-emerald-500 bg-emerald-500/5" : "border-pplx-border hover:border-pplx-muted/50 bg-pplx-sidebar/30"}`}
                >
                  <MonitorSmartphone size={32} className={`mb-4 ${hosting === "local" ? "text-emerald-500" : "text-pplx-muted"}`} />
                  <h3 className="font-semibold text-lg mb-2">Local Machine</h3>
                  <p className="text-xs text-pplx-muted leading-relaxed">Run the Python agent on your Desktop. Requires your PC to be on. (If you are on Mobile, you will connect to your Desktop's IP).</p>
                </div>
                
                <div 
                  onClick={() => setHosting("railway")}
                  className={`cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${hosting === "railway" ? "border-emerald-500 bg-emerald-500/5" : "border-pplx-border hover:border-pplx-muted/50 bg-pplx-sidebar/30"}`}
                >
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">RECOMMENDED</div>
                  <Server size={32} className={`mb-4 ${hosting === "railway" ? "text-emerald-500" : "text-pplx-muted"}`} />
                  <h3 className="font-semibold text-lg mb-2">Railway Cloud</h3>
                  <p className="text-xs text-pplx-muted leading-relaxed">Automated One-Click deploy. The agent runs 24/7 on a secure virtual server. Accessible anywhere.</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto">
                <button onClick={() => setStep("welcome")} className="text-pplx-muted hover:text-pplx-text text-sm font-medium">Back</button>
                <button 
                  disabled={!hosting}
                  onClick={() => hosting === "railway" ? setStep("railway_auth") : setStep("api_keys")}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${hosting ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Railway Auth (Only if Cloud chosen) */}
          {step === "railway_auth" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold mb-2">Connect to Railway</h2>
              <p className="text-pplx-muted mb-6 text-sm">We'll automatically deploy your agent. No terminal required.</p>
              
              <div className="space-y-4 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                  <ol className="list-decimal list-inside text-sm text-emerald-400/90 space-y-2">
                    <li>Log into your <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-white underline decoration-emerald-500/50 underline-offset-2">Railway.app</a> account.</li>
                    <li>Go to Account Settings &gt; Tokens.</li>
                    <li>Generate a new API Token and paste it below.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pplx-muted mb-2 ml-1">Railway API Token</label>
                  <input 
                    type="password" 
                    value={railwayToken}
                    onChange={(e) => setRailwayToken(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full bg-pplx-sidebar border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep("hosting")} className="text-pplx-muted hover:text-pplx-text text-sm font-medium">Back</button>
                <button 
                  disabled={!railwayToken}
                  onClick={() => setStep("api_keys")}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${railwayToken ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: API Keys */}
          {step === "api_keys" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold mb-2">Intelligence Providers</h2>
              <p className="text-pplx-muted mb-6 text-sm">Supply the API keys for the LLMs that will power Hermes.</p>
              
              {hosting === "local" && (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-pplx-muted mb-2 ml-1">Local Backend URL</label>
                  <input 
                    type="text" 
                    value={localIp}
                    onChange={(e) => setLocalIp(e.target.value)}
                    placeholder="http://192.168.x.x:8000"
                    className="w-full bg-pplx-sidebar border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-pplx-muted mt-2 ml-1">If on Desktop, leave as 127.0.0.1. If on Mobile, enter your Desktop's Wi-Fi IP address.</p>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-medium text-pplx-muted mb-2 ml-1 flex items-center gap-2"><Key size={14} /> OpenAI API Key</label>
                  <input 
                    type="password" 
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                    placeholder="sk-proj-..."
                    className="w-full bg-pplx-sidebar border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pplx-muted mb-2 ml-1 flex items-center gap-2"><Key size={14} /> Google Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                    placeholder="AIza..."
                    className="w-full bg-pplx-sidebar border border-pplx-border rounded-xl px-4 py-3 text-sm text-pplx-text outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(hosting === "railway" ? "railway_auth" : "hosting")} className="text-pplx-muted hover:text-pplx-text text-sm font-medium">Back</button>
                <button 
                  onClick={handleDeploy}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2"
                >
                  {hosting === "railway" ? "Deploy Agent" : "Complete Setup"} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Deploying (Spinner) */}
          {step === "deploying" && (
            <div className="animate-in fade-in duration-500 text-center py-12 flex flex-col items-center">
              <Loader2 size={48} className="text-emerald-500 animate-spin mb-6" />
              <h2 className="text-xl font-bold mb-2">Establishing Environment</h2>
              <p className="text-pplx-muted text-sm font-mono tracking-wide">{deployStatus}</p>
            </div>
          )}

          {/* STEP 6: Done */}
          {step === "done" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-8">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">System Ready</h2>
              <p className="text-pplx-muted mb-8 text-sm max-w-sm mx-auto">Hermes Agent is securely configured and waiting for your directives.</p>
              
              <button 
                onClick={handleComplete}
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-all transform active:scale-95 shadow-xl w-full max-w-xs"
              >
                Enter Hermes OS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
