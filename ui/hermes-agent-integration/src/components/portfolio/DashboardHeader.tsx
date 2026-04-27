import React from "react";
import {
  Bell,
  Plus,
  TrendingUp,
  ArrowUpRight,
  Search,
} from "lucide-react";

export const PortfolioHeader: React.FC<{
  activeTab?: "portfolio" | "strategy" | "journal" | "research" | "settings";
  setActiveTab?: (
    tab: "portfolio" | "strategy" | "journal" | "research" | "settings",
  ) => void;
  hasDock?: boolean;
}> = ({ activeTab = "portfolio", setActiveTab, hasDock = false }) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white dark:bg-pplx-primary z-30 transition-colors duration-300">
      <div className="flex items-center flex-1">
        <button
          onClick={() => setActiveTab?.("portfolio")}
          className="text-lg sm:text-xl font-black text-gray-900 dark:text-zinc-100 tracking-tighter font-display hover:text-gray-600 dark:hover:text-zinc-300 transition-colors whitespace-nowrap"
        >
          Dashboard Portofoliu
        </button>
      </div>

      <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10 flex-1">
        {[
          { id: "strategy", label: "Strategii" },
          { id: "journal", label: "Jurnal" },
          { id: "research", label: "Research" },
          { id: "settings", label: "Setări" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab?.(tab.id as any)}
            className={`text-sm sm:text-base font-black transition-all relative py-1.5 font-display ${activeTab === tab.id ? "text-zinc-900 dark:text-zinc-100 after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-zinc-900 dark:after:bg-zinc-100 after:rounded-full" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
        <button className="p-2 sm:p-2.5 text-gray-400 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-pplx-hover rounded-xl sm:rounded-2xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 active:scale-95">
          <Bell size={20} className="sm:w-6 sm:h-6" />
        </button>
        
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-zinc-800 shadow-md shrink-0">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="User"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
          {/* Icons removed and moved to global header */}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className="flex md:hidden fixed left-0 right-0 bg-white dark:bg-pplx-primary border-t border-gray-100 dark:border-zinc-800 px-4 py-2.5 justify-around items-center z-50"
        style={{
          bottom: hasDock ? "calc(72px + env(safe-area-inset-bottom))" : "0px",
        }}
      >
        {[
          { id: "strategy", label: "Strategii" },
          { id: "journal", label: "Jurnal" },
          { id: "research", label: "Research" },
          { id: "settings", label: "Setări" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab?.(tab.id as any)}
            className={`text-[10px] font-black transition-all px-2 py-1.5 rounded-lg ${activeTab === tab.id ? "bg-zinc-100 dark:bg-pplx-card text-zinc-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export const StatsOverview: React.FC<{
  totalValue: number;
  ytd: number;
  lastMonth: number;
  onNewEntry: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}> = ({ totalValue, ytd, lastMonth, onNewEntry, searchQuery, setSearchQuery }) => {
  return (
    <div className="flex flex-col gap-3 py-2 sm:py-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-12 flex-1">
          {/* Net Worth Section */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Net Worth</span>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                €{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h1>
            </div>

            {/* Mobile Search/Plus (Visible only on mobile/tablet) */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-2 py-1.5 rounded-md border border-gray-200 dark:border-zinc-800 focus-within:ring-1 focus-within:ring-zinc-200 dark:focus-within:ring-zinc-700 transition-all">
                <Search size={12} className="text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] text-gray-900 dark:text-zinc-100 w-12 placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-medium"
                />
              </div>
              <button onClick={onNewEntry} className="flex items-center justify-center p-1.5 text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white rounded-md transition-all active:scale-95 shadow-sm">
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          {/* Stats Section (Percentages, YTD, 1M) - Positioned between on Desktop */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:mt-4">
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-[11px] font-black">
              <ArrowUpRight size={12} />
              <span>+2.4%</span>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block" />
            
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="space-y-0.5 flex items-center gap-2 sm:block">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">YTD</span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-lg">
                  <TrendingUp size={14} />
                  <span>+{ytd}%</span>
                </div>
              </div>
              <div className="space-y-0.5 flex items-center gap-2 sm:block">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">1M</span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-lg">
                  <TrendingUp size={14} />
                  <span>+{lastMonth}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Search/Plus (Visible only on desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-800 focus-within:ring-1 focus-within:ring-zinc-200 dark:focus-within:ring-zinc-700 transition-all">
            <Search size={14} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-zinc-100 w-32 placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-medium"
            />
          </div>
          <button onClick={onNewEntry} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white rounded-md transition-all active:scale-95 shadow-sm">
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>
      </div>
    </div>
  );
};
