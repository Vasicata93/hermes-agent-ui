import React from "react";
import { Trash2, RefreshCw, AlertTriangle, FileText, Bot, Calendar, Search } from "lucide-react";

export const TrashView: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full p-6 md:p-12 animate-fadeIn max-w-7xl mx-auto text-pplx-text font-sans">
      <div className="flex flex-col mb-8 md:flex-row justify-between items-start md:items-end border-b border-pplx-border/50 pb-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Trash2 className="text-red-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pplx-text to-pplx-muted">
              Recycle Bin
            </h1>
          </div>
          <p className="text-pplx-muted font-light tracking-wide flex items-center gap-2 text-sm">
            Items here will be permanently deleted after 30 days.
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0 font-mono text-xs">
           <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <AlertTriangle size={16} />
              <span className="font-sans font-medium">Empty Bin</span>
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 bg-pplx-card/80 border border-pplx-border px-3 py-1.5 rounded-lg w-full max-w-md focus-within:border-pplx-accent transition-colors shadow-sm">
              <Search size={16} className="text-pplx-muted shrink-0" />
              <input type="text" placeholder="Search deleted items..." className="bg-transparent border-none outline-none text-sm text-pplx-text flex-1" />
           </div>
           
           <div className="flex gap-2 text-sm text-pplx-muted px-4">
              <span>3 items</span>
           </div>
        </div>

        <div className="flex flex-col gap-3">
             {/* Deleted System Log */}
             <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex items-center justify-between hover:bg-pplx-card transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-pplx-sidebar flex items-center justify-center border border-pplx-border">
                      <FileText size={20} className="text-pplx-muted" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Q1 Review Draft</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-2">
                         <span className="flex items-center gap-1"><Calendar size={12}/> Deleted 2 days ago</span>
                         <span className="w-1 h-1 rounded-full bg-pplx-border"></span>
                         <span>Document</span>
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={14}/> Restore
                   </button>
                   <button className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Trash2 size={14}/> Delete Forever
                   </button>
                </div>
             </div>

             {/* Deleted Chat */}
             <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex items-center justify-between hover:bg-pplx-card transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-pplx-sidebar flex items-center justify-center border border-pplx-border">
                      <Bot size={20} className="text-blue-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Hermes Sub-Agent Trace #482</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-2">
                         <span className="flex items-center gap-1"><Calendar size={12}/> Deleted 4 days ago</span>
                         <span className="w-1 h-1 rounded-full bg-pplx-border"></span>
                         <span>Conversation</span>
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={14}/> Restore
                   </button>
                   <button className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Trash2 size={14}/> Delete Forever
                   </button>
                </div>
             </div>

              {/* Deleted Chat 2 */}
             <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex items-center justify-between hover:bg-pplx-card transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-pplx-sidebar flex items-center justify-center border border-pplx-border">
                      <Bot size={20} className="text-blue-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Code Refactoring Discussion</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-2">
                         <span className="flex items-center gap-1"><Calendar size={12}/> Deleted 6 days ago</span>
                         <span className="w-1 h-1 rounded-full bg-pplx-border"></span>
                         <span>Conversation</span>
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={14}/> Restore
                   </button>
                   <button className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Trash2 size={14}/> Delete Forever
                   </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
