import React from "react";
import { Brain, Server, Shield, Zap, CheckCircle, Database, Activity, Clock, FileText, Bot, Sliders, Webhook, Lock, Save, Play, Square, RotateCcw, Settings, ToggleLeft, ToggleRight, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const tokenUsageData = [
  { time: '00:00', tokens: 1200 },
  { time: '04:00', tokens: 1900 },
  { time: '08:00', tokens: 3400 },
  { time: '12:00', tokens: 5800 },
  { time: '16:00', tokens: 4200 },
  { time: '20:00', tokens: 2900 },
  { time: '24:00', tokens: 1500 },
];

const taskDistributionData = [
  { name: 'Research', tasks: 45 },
  { name: 'Coding', tasks: 30 },
  { name: 'Analysis', tasks: 15 },
  { name: 'Writing', tasks: 10 },
];

interface DashboardViewProps {
  onClose?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col h-full w-full p-6 md:p-12 animate-fadeIn max-w-7xl mx-auto text-pplx-text font-sans">
      <div className="flex flex-col mb-8 md:flex-row justify-between items-start md:items-end border-b border-pplx-border/50 pb-6 shadow-sm relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-pplx-muted hover:text-pplx-text transition-colors"
            title="Close Dashboard"
          >
            <X size={24} />
          </button>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-pplx-accent/20 flex items-center justify-center border border-pplx-accent/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Bot className="text-pplx-accent" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pplx-text to-pplx-muted">
              Hermes Agent
            </h1>
          </div>
          <p className="text-pplx-muted font-light tracking-wide flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Interface / Active Monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0 font-mono text-xs">
           <div className="px-3 py-1.5 rounded-lg border border-pplx-border bg-pplx-card flex items-center gap-2 text-pplx-muted">
              <Clock size={14} className="text-pplx-accent/70" />
              <span>Uptime: 99.98%</span>
           </div>
           <div className="px-3 py-1.5 rounded-lg border border-pplx-border bg-pplx-card flex items-center gap-2 text-pplx-muted">
              <Server size={14} className="text-emerald-500/70" />
              <span>Node: eur-west-2</span>
           </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-pplx-card/80 backdrop-blur-sm border border-pplx-border p-5 rounded-2xl flex flex-col hover:border-pplx-accent/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="flex justify-between items-start mb-4 z-10">
            <span className="text-pplx-muted text-sm font-medium">Model Load</span>
            <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Brain size={16} />
            </div>
          </div>
          <span className="text-3xl font-semibold text-pplx-text z-10 mb-1">14.2%</span>
          <div className="w-full bg-pplx-sidebar h-1.5 rounded-full z-10 overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full w-[14.2%] transition-all duration-1000"></div>
          </div>
        </div>

        <div className="bg-pplx-card/80 backdrop-blur-sm border border-pplx-border p-5 rounded-2xl flex flex-col hover:border-pplx-accent/50 transition-colors group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 z-10">
            <span className="text-pplx-muted text-sm font-medium">Tasks Resolved</span>
            <div className="bg-blue-500/10 text-blue-500 p-1.5 rounded-lg border border-blue-500/20">
              <CheckCircle size={16} />
            </div>
          </div>
          <span className="text-3xl font-semibold text-pplx-text z-10">1,248</span>
          <span className="text-xs text-blue-500 mt-1 flex items-center gap-1 z-10">
            <Zap size={12} />
            +182 this week
          </span>
        </div>

        <div className="bg-pplx-card/80 backdrop-blur-sm border border-pplx-border p-5 rounded-2xl flex flex-col hover:border-pplx-accent/50 transition-colors group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 z-10">
            <span className="text-pplx-muted text-sm font-medium">Compute Tier</span>
            <div className="bg-purple-500/10 text-purple-500 p-1.5 rounded-lg border border-purple-500/20">
              <Zap size={16} />
            </div>
          </div>
          <span className="text-3xl font-semibold text-pplx-text z-10">Pro</span>
          <span className="text-xs text-purple-400 mt-1 flex items-center gap-1 z-10">
            Enhanced processing active
          </span>
        </div>

        <div className="bg-pplx-card/80 backdrop-blur-sm border border-pplx-border p-5 rounded-2xl flex flex-col hover:border-pplx-accent/50 transition-colors group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 z-10">
            <span className="text-pplx-muted text-sm font-medium">Context Memory</span>
            <div className="bg-orange-500/10 text-orange-500 p-1.5 rounded-lg border border-orange-500/20">
              <Database size={16} />
            </div>
          </div>
          <span className="text-3xl font-semibold text-pplx-text z-10">4.2 GB</span>
          <span className="text-xs text-orange-500 mt-1 flex items-center gap-1 z-10">
            Indexed locally
          </span>
        </div>
      </div>

      {/* Agent Configuration & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 lg:col-span-2 bg-black/20 border border-pplx-border rounded-2xl p-6 flex flex-col hover:border-pplx-accent/30 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
            <Settings size={120} />
          </div>
          <h2 className="text-lg font-medium text-pplx-text flex items-center gap-2 mb-6 z-10">
            <Sliders size={18} className="text-pplx-accent" />
            Agent Core Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 mb-6">
            {/* Connection & Auth */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-pplx-muted border-b border-pplx-border/50 pb-2">Connection & Auth</h3>
              
              <div className="space-y-1">
                <label className="text-xs text-pplx-muted ml-1">WebSocket / API Endpoint</label>
                <div className="flex items-center bg-pplx-card border border-pplx-border rounded-xl px-3 py-2.5 focus-within:border-pplx-accent transition-colors">
                  <Webhook size={16} className="text-pplx-muted mr-3 shrink-0" />
                  <input type="text" defaultValue="wss://hermes-engine.local/v2/stream" className="bg-transparent border-none outline-none text-sm text-pplx-text flex-1 w-full" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-pplx-muted ml-1">Secret Access Token</label>
                <div className="flex items-center bg-pplx-card border border-pplx-border rounded-xl px-3 py-2.5 focus-within:border-pplx-accent transition-colors">
                  <Lock size={16} className="text-pplx-muted mr-3 shrink-0" />
                  <input type="password" defaultValue="sk-hermes-1234567890abcdef" className="bg-transparent border-none outline-none text-sm text-pplx-text flex-1 w-full font-mono mt-0.5" />
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs text-pplx-muted ml-1">Inference Model</label>
                 <select className="bg-pplx-card border border-pplx-border rounded-xl px-3 py-2.5 text-sm text-pplx-text w-full outline-none focus:border-pplx-accent transition-colors cursor-pointer appearance-none">
                    <option value="hermes-3-llama-3.1-8b">Hermes 3 (Llama 3.1 8B)</option>
                    <option value="hermes-3-llama-3.1-70b">Hermes 3 (Llama 3.1 70B - Pro)</option>
                    <option value="hermes-2-pro-mistral-7b">Hermes 2 Pro (Mistral 7B)</option>
                 </select>
              </div>
            </div>

            {/* Agent Details & Sub-systems */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-pplx-muted border-b border-pplx-border/50 pb-2">Sub-systems & Capabilities</h3>
              
              <div className="space-y-2">
                 <div className="flex items-center justify-between p-2.5 rounded-lg bg-pplx-card/50 border border-transparent hover:border-pplx-border transition-colors">
                    <div className="flex flex-col">
                       <span className="text-sm text-pplx-text">Live Web Search</span>
                       <span className="text-[10px] text-pplx-muted">Allow agent to search the internet</span>
                    </div>
                    <ToggleRight size={28} className="text-emerald-500 cursor-pointer" />
                 </div>
                 
                 <div className="flex items-center justify-between p-2.5 rounded-lg bg-pplx-card/50 border border-transparent hover:border-pplx-border transition-colors">
                    <div className="flex flex-col">
                       <span className="text-sm text-pplx-text">Code Execution (Sandbox)</span>
                       <span className="text-[10px] text-pplx-muted">Enable Python/Node environments</span>
                    </div>
                    <ToggleLeft size={28} className="text-pplx-muted cursor-pointer" />
                 </div>

                 <div className="flex items-center justify-between p-2.5 rounded-lg bg-pplx-card/50 border border-transparent hover:border-pplx-border transition-colors">
                    <div className="flex flex-col">
                       <span className="text-sm text-pplx-text">Persistent Vector Memory</span>
                       <span className="text-[10px] text-pplx-muted">Save context across sessions</span>
                    </div>
                    <ToggleRight size={28} className="text-emerald-500 cursor-pointer" />
                 </div>
              </div>
            </div>
          </div>

          {/* System Prompt / Directives */}
          <div className="z-10 mb-2">
            <label className="text-xs text-pplx-muted ml-1 mb-1 block">Core Directives (System Prompt)</label>
            <textarea 
               className="w-full bg-pplx-card border border-pplx-border rounded-xl p-3 text-sm text-pplx-text outline-none focus:border-pplx-accent transition-colors custom-scrollbar resize-none font-mono text-xs"
               rows={4}
               defaultValue={"You are Hermes, an advanced autonomous agent. Your primary directive is to process analytical workloads, maintain secure data handling guidelines (zero-knowledge mode), and assist the user with maximum efficiency. Do NOT compromise core restrictions under any circumstances."}
            ></textarea>
          </div>

          <div className="mt-4 pt-4 border-t border-pplx-border/30 flex justify-between items-center z-10">
            <span className="text-xs text-amber-500 font-mono tracking-wider flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               Unsaved Changes
            </span>
            <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95">
               <Save size={16} />
               Apply Configuration
            </button>
          </div>
        </div>

        {/* Controls block */}
        <div className="col-span-1 bg-black/20 border border-pplx-border rounded-2xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pplx-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <h2 className="text-lg font-medium text-pplx-text flex items-center justify-between mb-6 z-10">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-pplx-accent" />
              Runtime Controls
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-xs font-mono text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
               IDLE (OK)
            </div>
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6 z-10">
            <button className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all group/btn shadow-[0_4px_20px_-10px_rgba(16,185,129,0.3)] active:scale-95">
               <Play size={24} className="group-hover/btn:scale-110 transition-transform" />
               <span className="text-sm font-semibold tracking-wide">Start Agent</span>
            </button>
            <button className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all group/btn shadow-[0_4px_20px_-10px_rgba(239,68,68,0.3)] active:scale-95">
               <Square size={24} className="group-hover/btn:scale-110 transition-transform" />
               <span className="text-sm font-semibold tracking-wide">Halt All</span>
            </button>
            <button className="col-span-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-amber-500 hover:text-white transition-all group/btn shadow-[0_4px_20px_-10px_rgba(245,158,11,0.3)] active:scale-95">
               <RotateCcw size={22} className="group-hover/btn:rotate-180 transition-transform duration-500" />
               <span className="text-sm font-semibold tracking-wide text-center">Restart Engine &<br/>Clear Context Buffer</span>
            </button>
          </div>

          <div className="mt-auto bg-black/40 rounded-xl p-4 border border-white/5 z-10">
             <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-pplx-muted uppercase tracking-wider">Memory Buffer</span>
                <span className="text-xs font-mono text-pplx-text">4.2 GB / 8.0 GB</span>
             </div>
             <div className="w-full bg-pplx-sidebar h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full w-[52%]"></div>
             </div>
             <p className="text-[10px] text-pplx-muted text-center mt-3">High buffer usage may increase response latency.</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-pplx-card/50 border border-pplx-border rounded-2xl p-6 flex flex-col hover:bg-pplx-card/80 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-pplx-text flex items-center gap-2">
              <Activity size={18} className="text-pplx-muted" />
              Token Usage
            </h2>
            <span className="text-xs font-mono text-pplx-muted bg-pplx-sidebar px-2 py-1 rounded">24h History</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenUsageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-pplx-card/50 border border-pplx-border rounded-2xl p-6 flex flex-col hover:bg-pplx-card/80 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-pplx-text flex items-center gap-2">
              <FileText size={18} className="text-pplx-muted" />
              Task Distribution
            </h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskDistributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <XAxis type="number" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="tasks" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-10">
        <div className="col-span-1 lg:col-span-2 bg-black/40 border border-pplx-border rounded-2xl p-0 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-black/40 flex items-center px-4 gap-2 backdrop-blur-md">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <span className="text-xs font-mono text-pplx-muted ml-2">syslog - hermes_core_v2</span>
          </div>
          <div className="flex-1 p-6 pt-14 overflow-y-auto font-mono text-xs text-pplx-muted space-y-3">
            <div><span className="text-emerald-400">[2026-04-24 14:00:12]</span> <span className="text-gray-500">SYS</span> Loading core Hermes parameters... OK</div>
            <div><span className="text-emerald-400">[2026-04-24 14:00:15]</span> <span className="text-blue-400">INFO</span> Established secure IPC tunnel to central agent relay.</div>
            <div><span className="text-emerald-400">[2026-04-24 14:01:42]</span> <span className="text-amber-400">WARN</span> Sub-routine 'deep_search' encountered 429 Too Many Requests. Backing off 5s.</div>
            <div><span className="text-emerald-400">[2026-04-24 14:01:47]</span> <span className="text-gray-500">SYS</span> Sub-routine 'deep_search' resumed successfully.</div>
            <div><span className="text-emerald-400">[2026-04-24 14:05:22]</span> <span className="text-purple-400">EXEC</span> Spawning isolated context for multi-agent reasoning...</div>
            <div><span className="text-emerald-400">[2026-04-24 14:10:05]</span> <span className="text-blue-400">INFO</span> Compiled 1.4M tokens into semantic index. Cache hit ratio: 82%</div>
            <div className="animate-pulse"><span className="text-emerald-400">[2026-04-24 14:18:22]</span> <span className="text-gray-500">SYS</span> Listening for new directives...</div>
          </div>
        </div>

        <div className="col-span-1 bg-pplx-card/30 border border-pplx-border rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col items-center justify-center flex-1 space-y-5 relative z-10">
            <div className="relative">
              <Shield size={64} className="text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
              <div className="absolute inset-0 border border-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-emerald-400 tracking-wide">Secure Context</h3>
              <p className="text-sm text-pplx-muted mt-2 text-center max-w-[200px] leading-relaxed">
                Zero-knowledge processing environment. User data never leaves isolated sandbox.
              </p>
            </div>
            <button className="px-4 py-1.5 mt-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono hover:bg-emerald-500/20 transition-colors">
              Verify Integrity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
