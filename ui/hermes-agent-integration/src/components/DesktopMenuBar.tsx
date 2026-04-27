import React, { useState, useEffect } from "react";
import { Search, CalendarDays, Bell, LayoutDashboard, CheckCircle, Activity, Box, Wifi } from "lucide-react";
import { SidebarToggle } from "./SidebarToggle";
import { NotificationsPanel } from "./NotificationsPanel";
import { useAgentStore } from "../store/agentStore";

interface DesktopMenuBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({ activeView, setActiveView, sidebarOpen, onToggleSidebar, searchQuery, setSearchQuery }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const agentMode = useAgentStore((state) => state.mode);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('ro-RO', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute top-0 left-0 right-0 h-10 z-50 hidden md:flex items-center justify-between px-4 bg-pplx-primary border-transparent text-xs font-medium text-pplx-text group">
      {/* Left side: Sidebar Toggle & System Status */}
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <SidebarToggle
            onClick={onToggleSidebar}
            className="flex p-1 hover:bg-pplx-hover rounded text-pplx-muted transition-all"
            size={20}
          />
        )}
        
        {/* Agent Status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-pplx-secondary">
          <Activity size={12} className={agentMode === 'idle' ? 'text-pplx-muted' : 'text-green-500 animate-pulse'} />
          <span className="capitalize">{agentMode || 'Idle'}</span>
        </div>

        {/* Model Info */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-pplx-secondary text-pplx-muted">
          <Box size={12} />
          <span>Local Hermes</span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-pplx-secondary text-green-500">
          <Wifi size={12} />
          <span>Connected</span>
        </div>
      </div>

      {/* Right side: Search, Icons, Date, Time */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="bg-transparent hover:bg-pplx-hover border border-transparent hover:border-pplx-border/50 rounded flex items-center px-2 py-1 w-[120px] transition-all focus-within:w-40 focus-within:border-pplx-accent focus-within:bg-pplx-primary">
          <Search size={13} className="text-pplx-muted mr-1.5 shrink-0" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-pplx-text flex-1 w-full"
            onFocus={() => setActiveView("search")}
          />
        </div>

        {/* Separator */}
        <div className="w-[1px] h-3 bg-pplx-border opacity-50"></div>

        {/* Task Icon */}
        <button 
          className={`p-1 text-pplx-muted hover:text-pplx-text transition-colors rounded hover:bg-pplx-hover ${activeView === "tasks" ? "text-pplx-text" : ""}`}
          onClick={() => setActiveView("tasks")}
          title="Tasks"
        >
          <CheckCircle size={14} />
        </button>

        {/* Dashboard Icon */}
        <button 
          className={`p-1 text-pplx-muted hover:text-pplx-text transition-colors rounded hover:bg-pplx-hover ${activeView === "dashboard" ? "text-pplx-text" : ""}`}
          onClick={() => setActiveView("dashboard")}
          title="Dashboard"
        >
          <LayoutDashboard size={14} />
        </button>

        {/* Calendar Icon */}
        <button 
          className={`p-1 text-pplx-muted hover:text-pplx-text transition-colors rounded hover:bg-pplx-hover ${activeView === "calendar" ? "text-pplx-text" : ""}`}
          onClick={() => setActiveView("calendar")}
          title="Calendar"
        >
          <CalendarDays size={14} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            className={`p-1 text-pplx-muted hover:text-pplx-text transition-colors relative rounded hover:bg-pplx-hover ${showNotifications ? "text-pplx-text bg-pplx-hover" : ""}`}
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={14} />
          </button>
          <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>

        {/* Separator */}
        <div className="w-[1px] h-3 bg-pplx-border opacity-50"></div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 tabular-nums">
          <span className="text-pplx-muted group-hover:text-pplx-text transition-colors pointer-events-none capitalize">{formattedDate}</span>
          <span className="pointer-events-none">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
};

