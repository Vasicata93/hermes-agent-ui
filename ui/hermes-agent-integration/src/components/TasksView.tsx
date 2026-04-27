import React from "react";
import { CheckCircle, Clock, Calendar, MoreVertical, Search, Plus } from "lucide-react";

export const TasksView: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full p-6 md:p-12 animate-fadeIn max-w-7xl mx-auto text-pplx-text font-sans">
      <div className="flex flex-col mb-8 md:flex-row justify-between items-start md:items-end border-b border-pplx-border/50 pb-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-pplx-accent/20 flex items-center justify-center border border-pplx-accent/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <CheckCircle className="text-pplx-accent" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pplx-text to-pplx-muted">
              Tasks
            </h1>
          </div>
          <p className="text-pplx-muted font-light tracking-wide flex items-center gap-2 text-sm">
            Manage your daily tasks and productivity.
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0 font-mono text-xs">
           <button className="bg-pplx-accent hover:bg-pplx-accent/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus size={16} />
              <span className="font-sans font-medium">New Task</span>
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 bg-pplx-card/80 border border-pplx-border px-3 py-1.5 rounded-lg w-full max-w-md focus-within:border-pplx-accent transition-colors shadow-sm">
              <Search size={16} className="text-pplx-muted shrink-0" />
              <input type="text" placeholder="Search tasks..." className="bg-transparent border-none outline-none text-sm text-pplx-text flex-1" />
           </div>
           
           <div className="flex gap-2">
              <select className="bg-pplx-card border border-pplx-border rounded-lg px-3 py-1.5 text-sm text-pplx-text outline-none focus:border-pplx-accent transition-colors cursor-pointer appearance-none appearance-none font-medium">
                 <option value="all">All Tasks</option>
                 <option value="active">Active</option>
                 <option value="completed">Completed</option>
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2">
                <h3 className="font-medium text-sm flex items-center gap-2"><Clock size={16} className="text-blue-400"/> To Do</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">3</span>
             </div>
             
             {/* Task Items */}
             <div className="bg-pplx-card border border-pplx-border rounded-lg p-3 hover:border-pplx-accent/50 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Review Q2 Analytics Data</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1"><Calendar size={12}/> Today</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>

             <div className="bg-pplx-card border border-pplx-border rounded-lg p-3 hover:border-pplx-accent/50 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Update Project Documentation</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1"><Calendar size={12}/> Tomorrow</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>

             <div className="bg-pplx-card border border-pplx-border rounded-lg p-3 hover:border-pplx-accent/50 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Client meeting preparation</span>
                      <span className="text-xs text-red-400 mt-1 flex items-center gap-1"><Calendar size={12}/> Overdue</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>
          </div>

          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2">
                <h3 className="font-medium text-sm flex items-center gap-2"><Clock size={16} className="text-amber-400"/> In Progress</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">1</span>
             </div>
             
             <div className="bg-pplx-card border border-pplx-accent/30 rounded-lg p-3 hover:border-pplx-accent/80 transition-colors group cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.1)]">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">Design New Dashboard Elements</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1"><Calendar size={12}/> Needs review</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>
          </div>

          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2">
                <h3 className="font-medium text-sm flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Completed</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">2</span>
             </div>
             
             <div className="bg-pplx-card border border-pplx-border rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity group cursor-pointer">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium line-through">Fix navigation bug</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1">Completed today</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>

             <div className="bg-pplx-card border border-pplx-border rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity group cursor-pointer">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium line-through">Write tests for AI core</span>
                      <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1">Completed yesterday</span>
                   </div>
                   <button className="text-pplx-muted hover:text-pplx-text opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
