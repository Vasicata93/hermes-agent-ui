import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search as SearchIcon,
  MessageSquare,
  FileText,
  Calendar,
  LayoutGrid,
  ArrowRight,
  Clock,
  Tag,
  MapPin,
  X,
  History,
  Sparkles,
  Command,
  Filter,
} from "lucide-react";
import { Thread, Note, CalendarEvent, Space } from "../types";
import { motion } from "framer-motion";

interface SearchViewProps {
  threads: Thread[];
  notes: Note[];
  events: CalendarEvent[];
  spaces: Space[];
  onSelectThread: (id: string) => void;
  onSelectNote: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onSelectSpace: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

type ResultType = "chat" | "note" | "event" | "space";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  description?: string;
  date?: number;
  icon?: string;
  tags?: string[];
  location?: string;
}

export const SearchView: React.FC<SearchViewProps> = ({
  threads,
  notes,
  events,
  spaces,
  onSelectThread,
  onSelectNote,
  onSelectEvent,
  onSelectSpace,
  searchQuery,
  setSearchQuery,
}) => {
  const [activeFilter, setActiveFilter] = useState<ResultType | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search Threads
    threads.forEach((t) => {
      if (
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
      ) {
        allResults.push({
          id: t.id,
          type: "chat",
          title: t.title || "Untitled Chat",
          description:
            t.messages[t.messages.length - 1]?.content.substring(0, 100) +
            "...",
          date: t.updatedAt,
        });
      }
    });

    // Search Notes
    notes.forEach((n) => {
      if (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some((tag) => tag.toLowerCase().includes(q))
      ) {
        allResults.push({
          id: n.id,
          type: "note",
          title: n.title || "Untitled Page",
          description:
            n.content.substring(0, 100).replace(/[#*`]/g, "") + "...",
          date: n.updatedAt,
          icon: n.emoji,
          tags: n.tags,
        });
      }
    });

    // Search Events
    events.forEach((e) => {
      if (
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: e.id,
          type: "event",
          title: e.title,
          description: e.description,
          date: e.startDate,
          location: e.location,
        });
      }
    });

    // Search Spaces
    spaces.forEach((s) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: s.id,
          type: "space",
          title: s.title,
          description: s.description,
          date: s.createdAt,
          icon: s.emoji,
        });
      }
    });

    // Sort by date descending
    return allResults
      .filter((r) => activeFilter === "all" || r.type === activeFilter)
      .sort((a, b) => (b.date || 0) - (a.date || 0));
  }, [searchQuery, threads, notes, events, spaces, activeFilter]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case "chat":
        onSelectThread(result.id);
        break;
      case "note":
        onSelectNote(result.id);
        break;
      case "event":
        onSelectEvent(result.id);
        break;
      case "space":
        onSelectSpace(result.id);
        break;
    }
  };

  const getIcon = (type: ResultType, icon?: string) => {
    if (icon) return <span className="text-xl">{icon}</span>;
    switch (type) {
      case "chat":
        return <MessageSquare size={18} className="text-blue-400" />;
      case "note":
        return <FileText size={18} className="text-emerald-400" />;
      case "event":
        return <Calendar size={18} className="text-amber-400" />;
      case "space":
        return <LayoutGrid size={18} className="text-purple-400" />;
    }
  };

  const getTypeLabel = (type: ResultType) => {
    switch (type) {
      case "chat":
        return "Chat";
      case "note":
        return "Page";
      case "event":
        return "Event";
      case "space":
        return "Space";
    }
  };

  return (
    <div className="flex flex-col h-full bg-pplx-primary animate-fadeIn overflow-hidden">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-12 md:pt-20 pb-8 shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <SearchIcon
              size={24}
              className="text-pplx-muted group-focus-within:text-pplx-accent transition-colors"
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search through everything..."
            className="w-full bg-pplx-secondary/50 border border-pplx-border rounded-[32px] pl-16 pr-6 py-6 text-2xl font-serif text-pplx-text placeholder-pplx-muted/40 outline-none focus:border-pplx-accent/50 focus:ring-4 focus:ring-pplx-accent/5 transition-all shadow-2xl"
          />
          <div className="absolute right-6 inset-y-0 flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-pplx-hover/50 border border-pplx-border rounded-lg text-[10px] font-black text-pplx-muted uppercase tracking-widest">
              <Command size={10} /> K
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-2 hover:bg-pplx-hover rounded-full text-pplx-muted transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto no-scrollbar pb-2">
          <Filter size={14} className="text-pplx-muted mr-2 shrink-0" />
          {[
            { id: "all", label: "All Results", icon: <Sparkles size={14} /> },
            { id: "chat", label: "Chats", icon: <MessageSquare size={14} /> },
            { id: "note", label: "Pages", icon: <FileText size={14} /> },
            { id: "event", label: "Events", icon: <Calendar size={14} /> },
            { id: "space", label: "Spaces", icon: <LayoutGrid size={14} /> },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-pplx-text text-pplx-primary border-pplx-text shadow-lg"
                  : "bg-pplx-secondary/30 text-pplx-muted border-pplx-border hover:border-pplx-muted hover:text-pplx-text"
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20">
        <div className="max-w-4xl mx-auto w-full">
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-pplx-secondary/50 rounded-full flex items-center justify-center mb-6 border border-pplx-border shadow-inner">
                <History size={32} className="text-pplx-muted/40" />
              </div>
              <h3 className="text-xl font-serif font-bold text-pplx-text mb-2">
                Search your digital brain
              </h3>
              <p className="text-pplx-muted max-w-xs mx-auto text-sm leading-relaxed">
                Find any chat, document, or event by typing a keyword above.
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 animate-fadeIn">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[10px] font-black text-pplx-muted uppercase tracking-[0.2em]">
                  {results.length} {results.length === 1 ? "Result" : "Results"}{" "}
                  found
                </span>
              </div>
              {results.map((result, idx) => (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="group flex items-start gap-5 p-5 bg-pplx-secondary/20 hover:bg-pplx-secondary/40 border border-pplx-border rounded-[24px] text-left transition-all hover:shadow-xl hover:border-pplx-accent/20 active:scale-[0.99]"
                >
                  <div className="w-12 h-12 shrink-0 bg-pplx-primary border border-pplx-border rounded-2xl flex items-center justify-center shadow-sm group-hover:border-pplx-accent/30 transition-colors">
                    {getIcon(result.type, result.icon)}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[9px] font-black text-pplx-accent uppercase tracking-widest bg-pplx-accent/10 px-2 py-0.5 rounded-md">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.date && (
                        <span className="text-[10px] text-pplx-muted flex items-center gap-1.5">
                          <Clock size={10} />
                          {new Date(result.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-serif font-bold text-pplx-text group-hover:text-pplx-accent transition-colors truncate mb-1">
                      {result.title}
                    </h4>
                    {result.description && (
                      <p className="text-sm text-pplx-muted line-clamp-2 leading-relaxed font-light">
                        {result.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.location && (
                        <span className="flex items-center gap-1.5 text-[10px] text-pplx-muted bg-pplx-hover/30 px-2 py-1 rounded-lg">
                          <MapPin size={10} /> {result.location}
                        </span>
                      )}
                      {result.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 text-[10px] text-pplx-muted bg-pplx-hover/30 px-2 py-1 rounded-lg"
                        >
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                    <div className="w-10 h-10 rounded-full bg-pplx-accent text-pplx-primary flex items-center justify-center shadow-lg shadow-pplx-accent/20">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-pplx-secondary/50 rounded-full flex items-center justify-center mb-6 border border-pplx-border">
                <SearchIcon size={32} className="text-pplx-muted/40" />
              </div>
              <h3 className="text-xl font-serif font-bold text-pplx-text mb-2">
                No results found
              </h3>
              <p className="text-pplx-muted max-w-xs mx-auto text-sm leading-relaxed">
                We couldn't find anything matching "{searchQuery}". Try a different
                keyword.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
