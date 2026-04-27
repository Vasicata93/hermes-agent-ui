import React, { useEffect, useState } from "react";
import { Activity, Square, RotateCw, Play, MessageSquare, Terminal } from "lucide-react";
import { useAgentStore } from "../../store/agentStore";
import { HermesWebSocketClient } from "../../services/hermes/hermesWebSocketClient";
import { ChatInterface } from "../ChatInterface";

export const AgentControlView: React.FC = () => {
  const { hermesConnectionStatus, mode } = useAgentStore();
  const [showTerminal, setShowTerminal] = useState(true);

  // Example simple local message state for the chat - might want to sync with a global message store if needed
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Optionally auto-connect on mount if desired
    // HermesWebSocketClient.connect();
    return () => {
      // Don't disconnect on unmount, we want it to stay alive in background
    };
  }, []);

  const handleStart = () => {
    HermesWebSocketClient.connect();
  };

  const handleStop = () => {
    HermesWebSocketClient.disconnect();
    useAgentStore.getState().setHermesConnectionStatus('disconnected');
    useAgentStore.getState().setMode('idle');
  };

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }]);
    // Send to Hermes API
    // HermesApiClient.sendMessage(text);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-pplx-primary flex flex-col pt-12 md:pt-6">
      <div className="max-w-4xl mx-auto w-full px-6 flex-shrink-0 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-pplx-text">Agent Control Center</h1>
              <p className="text-sm text-pplx-muted">Monitor and manage the Hermes Agent backend</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded-lg transition-colors ${showTerminal ? 'bg-pplx-accent/20 text-pplx-accent' : 'bg-transparent text-pplx-muted hover:bg-pplx-secondary'}`}
            title="Toggle Debug Terminal/Chat"
          >
            <Terminal size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-2xl bg-pplx-secondary/60 border border-pplx-border flex flex-col gap-2">
            <span className="text-sm text-pplx-muted">Connection Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${hermesConnectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : hermesConnectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              <span className="text-xl font-medium text-pplx-text capitalize">{hermesConnectionStatus}</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-pplx-secondary/60 border border-pplx-border flex flex-col gap-2">
            <span className="text-sm text-pplx-muted">Current Mode</span>
            <span className="text-xl font-medium text-pplx-text capitalize truncate">{mode}</span>
          </div>
          <div className="p-5 rounded-2xl bg-pplx-secondary/60 border border-pplx-border flex flex-col gap-2">
            <span className="text-sm text-pplx-muted">Active Tools</span>
            <span className="text-xl font-medium text-pplx-text text-pplx-muted">Unknown</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          {hermesConnectionStatus !== 'connected' ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl font-medium transition-colors"
            >
              <Play size={18} /> Connect to Hermes
            </button>
          ) : (
             <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-medium transition-colors"
            >
              <Square size={18} /> Disconnect
            </button>
          )}
         
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-xl font-medium transition-colors">
            <RotateCw size={18} /> Restart Agent
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-pplx-secondary/40 border border-pplx-border mb-8">
          <h2 className="text-lg font-medium text-pplx-text mb-4">Resource Usage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-pplx-muted">CPU</span>
                <span className="text-pplx-text">12%</span>
              </div>
              <div className="w-full bg-pplx-border h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[12%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-pplx-muted">RAM</span>
                <span className="text-pplx-text">840 MB</span>
              </div>
              <div className="w-full bg-pplx-border h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[40%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTerminal && (
        <div className="border-t border-pplx-border bg-pplx-secondary/20 h-[400px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
          <div className="p-2 border-b border-white/5 flex items-center justify-between text-xs font-mono text-pplx-muted bg-pplx-secondary/60">
            <div className="flex items-center gap-2 px-2">
              <MessageSquare size={14} /> Agent Interaction Terminal
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              isThinking={mode === 'agent'}
              onSendMessage={(text) => handleSendMessage(text)}
              onStopGeneration={() => {}}
              onRegenerate={() => {}}
              onEditMessage={() => {}}
              onCopyText={() => {}}
              onShare={() => {}}
              onTTS={() => {}}
              isPlayingAudio={false}
              copiedId={null}
            />
          </div>
        </div>
      )}
    </div>
  );
};
