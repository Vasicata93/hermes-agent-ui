import React, { useState } from "react";
import { Search, CalendarDays, Bell, LayoutDashboard, CheckCircle } from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";

interface MobileHomeActionsProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const MobileHomeActions: React.FC<MobileHomeActionsProps> = ({
  activeView,
  setActiveView,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="md:hidden flex items-center gap-1.5 p-1 bg-pplx-secondary/60 backdrop-blur-xl border border-white/10 shadow-lg rounded-[20px] pointer-events-auto">
      {/* Search */}
      <button
        className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all ${activeView === "search" ? "bg-pplx-accent text-white" : "text-pplx-muted hover:bg-white/5 hover:text-pplx-text"}`}
        onClick={() => setActiveView("search")}
      >
        <Search size={16} />
      </button>

      {/* Task */}
      <button
        className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all ${activeView === "tasks" ? "bg-pplx-accent text-white shadow-md shadow-pplx-accent/20" : "text-pplx-text hover:bg-white/10"}`}
        onClick={() => setActiveView("tasks")}
      >
        <CheckCircle size={16} />
      </button>

      {/* Calendar */}
      <button
        className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all ${activeView === "calendar" ? "bg-pplx-accent text-white shadow-md shadow-pplx-accent/20" : "text-pplx-text hover:bg-white/10"}`}
        onClick={() => setActiveView("calendar")}
      >
        <CalendarDays size={16} />
      </button>

      {/* Bell */}
      <div className="relative">
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all ${showNotifications ? "bg-pplx-accent text-white shadow-md shadow-pplx-accent/20" : "text-pplx-text hover:bg-white/10"}`}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={16} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-pplx-primary"></span>
        </button>
        <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    </div>
  );
};
