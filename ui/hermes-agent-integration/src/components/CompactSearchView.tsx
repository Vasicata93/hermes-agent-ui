import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search as SearchIcon,
  MessageSquare,
  FileText,
  Calendar,
  LayoutGrid,
  X,
} from "lucide-react";
import { Thread, Note, CalendarEvent, Space } from "../types";
import { motion, AnimatePresence } from "framer-motion";

interface CompactSearchViewProps {
  threads: Thread[];
  notes: Note[];
  events: CalendarEvent[];
  spaces: Space[];
  onSelectThread: (id: string) => void;
  onSelectNote: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onSelectSpace: (id: string) => void;
  isCollapsed: boolean;
  externalQuery?: string;
  onQueryChange?: (query: string) => void;
  hideInput?: boolean;
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

export const CompactSearchView: React.FC<CompactSearchViewProps> = ({
  threads,
  notes,
  events,
  spaces,
  onSelectThread,
  onSelectNote,
  onSelectEvent,
  onSelectSpace,
  isCollapsed,
  externalQuery,
  onQueryChange,
  hideInput = false,
}) => {
  const [internalQuery, setInternalQuery] = useState("");
  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const setQuery = onQueryChange || setInternalQuery;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCollapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCollapsed]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
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
            t.messages[t.messages.length - 1]?.content.substring(0, 60) + "...",
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
          description: n.content.substring(0, 60).replace(/[#*`]/g, "") + "...",
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
          description: e.description?.substring(0, 60),
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
          description: s.description.substring(0, 60),
          date: s.createdAt,
          icon: s.emoji,
        });
      }
    });

    // Sort by date descending
    return allResults.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 8);
  }, [query, threads, notes, events, spaces]);

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
    setQuery("");
  };

  const getIcon = (type: ResultType, icon?: string) => {
    if (icon) return <span className="text-sm">{icon}</span>;
    switch (type) {
      case "chat":
        return <MessageSquare size={14} className="text-blue-400" />;
      case "note":
        return <FileText size={14} className="text-emerald-400" />;
      case "event":
        return <Calendar size={14} className="text-amber-400" />;
      case "space":
        return <LayoutGrid size={14} className="text-purple-400" />;
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <SearchIcon size={22} className="text-pplx-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-2 py-1">
      {!hideInput && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon
              size={16}
              className="text-pplx-muted group-focus-within:text-pplx-accent transition-colors"
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Research..."
            className="w-full bg-pplx-secondary/30 border border-pplx-border rounded-xl pl-10 pr-8 py-2 text-sm text-pplx-text placeholder-pplx-muted/50 outline-none focus:border-pplx-accent/30 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 inset-y-0 flex items-center p-1 text-pplx-muted hover:text-pplx-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {query.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {results.length > 0 ? (
              results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 p-2 hover:bg-pplx-hover rounded-lg text-left transition-colors group"
                >
                  <div className="w-8 h-8 shrink-0 bg-pplx-secondary/50 border border-pplx-border rounded-lg flex items-center justify-center group-hover:border-pplx-accent/30 transition-colors">
                    {getIcon(result.type, result.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-pplx-text truncate group-hover:text-pplx-accent transition-colors">
                      {result.title}
                    </h4>
                    {result.description && (
                      <p className="text-[10px] text-pplx-muted truncate font-light">
                        {result.description}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="py-4 text-center">
                <p className="text-[10px] text-pplx-muted">No results found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
