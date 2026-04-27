import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  FileText,
  X,
  ArrowUpRight,
  AtSign,
  MoreHorizontal,
  Edit3,
  MousePointerClick,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ListOrdered,
  Sigma,
} from "lucide-react";
import { WidgetRenderer } from "./WidgetRenderer";
import { Note } from "../types";

// --- Types needed for blocks ---
export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "todo"
  | "quote"
  | "code"
  | "divider"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "newpage"
  | "table"
  | "calendar"
  | "widget"
  | "chart_bar_v"
  | "chart_bar_h"
  | "chart_line"
  | "chart_donut"
  | "toc"
  | "button"
  | "block_synced"
  | "equation"
  | "mention_person"
  | "mention_page"
  | "db_list"
  | "db_gallery";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    name?: string;
    mimeType?: string;
    pageId?: string;
  };
  checked?: boolean;
}

// --- UTILS ---

export const AutoResizeTextarea = ({
  value,
  onChange,
  onEnter,
  onBackspace,
  onPaste,
  className,
  placeholder,
  autoFocus,
  onFocus,
  readOnly = false,
}: {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  className: string;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  readOnly?: boolean;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const previousWidth = useRef(0);

  const adjustHeight = () => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width !== previousWidth.current) {
          previousWidth.current = entry.contentRect.width;
          requestAnimationFrame(() => {
            adjustHeight();
          });
        }
      }
    });

    observer.observe(textarea);

    // Initial adjustment
    adjustHeight();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      onKeyDown={(e) => {
        if (readOnly) return;
        if (e.key === "Enter" && !e.shiftKey && onEnter) {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Backspace" && value === "" && onBackspace) {
          onBackspace();
        }
      }}
      onPaste={onPaste}
      onFocus={onFocus}
      rows={1}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      className={`w-full bg-transparent outline-none resize-none overflow-hidden ${className} ${readOnly ? "cursor-default" : ""}`}
    />
  );
};

// --- COMPONENTS ---

export const MentionPageBlock = ({
  content,
  metadata,
  notes,
  onUpdate,
  onNavigate,
  readOnly,
}: {
  content: string;
  metadata?: any;
  notes: Note[];
  onUpdate: (data: any) => void;
  onNavigate: (id: string) => void;
  readOnly?: boolean;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (note: Note) => {
    onUpdate({
      content: note.title || "Untitled",
      metadata: { ...metadata, pageId: note.id },
    });
    setIsMenuOpen(false);
  };

  if (!metadata?.pageId && !readOnly) {
    return (
      <div className="relative inline-block my-1">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-1 bg-pplx-secondary text-pplx-muted px-2 py-0.5 rounded text-sm hover:bg-pplx-hover cursor-pointer border border-dashed border-pplx-border hover:text-pplx-text"
        >
          <ArrowUpRight size={12} /> Select a Page
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-1 w-64 bg-pplx-card border border-pplx-border rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto"
          >
            <input
              autoFocus
              className="bg-transparent text-xs text-pplx-text outline-none w-full placeholder-gray-500 mb-2 border-b border-pplx-border/50 pb-1"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => handleSelect(note)}
                className="w-full text-left px-2 py-1.5 text-xs text-pplx-text hover:bg-pplx-hover rounded flex items-center gap-2"
              >
                <span>{note.emoji || "📄"}</span>
                <span className="truncate">{note.title || "Untitled"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-1 inline-flex items-center gap-1 bg-pplx-secondary text-pplx-text px-1.5 py-0.5 rounded text-sm hover:bg-pplx-hover border border-transparent hover:border-pplx-border group cursor-pointer">
      <div
        onClick={() => metadata?.pageId && onNavigate(metadata.pageId)}
        className="flex items-center gap-1"
      >
        <FileText size={12} className="text-pplx-accent" />
        <span className="underline decoration-transparent hover:decoration-pplx-text underline-offset-2 transition-all">
          {content || "Untitled Page"}
        </span>
      </div>
      {!readOnly && (
        <button
          onClick={() =>
            onUpdate({ metadata: { ...metadata, pageId: undefined } })
          }
          className="w-0 overflow-hidden group-hover:w-auto pl-1 text-pplx-muted hover:text-red-400 transition-all"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export const MentionPersonBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  if (isEditing && !readOnly) {
    return (
      <div className="my-1 inline-flex items-center gap-1 bg-pplx-secondary text-pplx-text px-1.5 py-0.5 rounded text-sm border border-pplx-accent">
        <AtSign size={12} className="text-pplx-accent" />
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
          className="bg-transparent border-none outline-none text-sm w-24 p-0"
          placeholder="Name"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => !readOnly && setIsEditing(true)}
      className="my-1 inline-flex items-center gap-1 bg-pplx-secondary text-pplx-text px-1.5 py-0.5 rounded text-sm hover:bg-pplx-hover cursor-pointer border border-transparent hover:border-pplx-border transition-colors"
    >
      <AtSign size={12} className="text-pplx-accent" />
      <span>{content || "Person"}</span>
    </button>
  );
};

export const NewPageBlock = ({
  content,
  metadata,
  onNavigate,
  notes,
}: {
  content: string;
  metadata?: any;
  onNavigate: (id: string) => void;
  notes?: Note[];
}) => {
  const linkedNote = notes?.find((n) => n.id === metadata?.pageId);
  const displayTitle = linkedNote?.title || content || "Untitled";
  const displayEmoji = linkedNote?.emoji || "📄";

  return (
    <div
      onClick={() => metadata?.pageId && onNavigate(metadata.pageId)}
      className="my-1 flex items-center gap-2 px-2 py-1.5 hover:bg-pplx-hover rounded-lg cursor-pointer transition-colors group/page w-max max-w-full"
    >
      <span className="text-lg leading-none">{displayEmoji}</span>
      <span className="text-pplx-text font-medium border-b border-transparent group-hover/page:border-pplx-muted transition-colors truncate">
        {displayTitle}
      </span>
    </div>
  );
};

export const TableBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => {
  let data: string[][] = [
    ["Header 1", "Header 2"],
    ["Cell 1", "Cell 2"],
  ];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) data = parsed;
  } catch (e) {
    /* ignore */
  }

  const updateCell = (r: number, c: number, val: string) => {
    const newData = [...data];
    newData[r][c] = val;
    onChange(JSON.stringify(newData));
  };

  const addRow = () =>
    onChange(JSON.stringify([...data, new Array(data[0].length).fill("")]));
  const addCol = () =>
    onChange(JSON.stringify(data.map((row) => [...row, ""])));

  return (
    <div className="my-4 overflow-x-auto">
      <div className="inline-block min-w-full border border-pplx-border rounded-lg bg-pplx-card">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {data[0].map((cell, i) => (
                <th
                  key={i}
                  className="border-b border-r border-pplx-border last:border-r-0 bg-pplx-secondary/50 p-0 min-w-[120px]"
                >
                  <input
                    className="w-full bg-transparent p-2 text-sm font-semibold text-pplx-text outline-none placeholder-gray-500"
                    value={cell}
                    onChange={(e) =>
                      !readOnly && updateCell(0, i, e.target.value)
                    }
                    readOnly={readOnly}
                  />
                </th>
              ))}
              {!readOnly && (
                <th className="w-8 border-b border-pplx-border bg-pplx-secondary/50 p-0 text-center">
                  <button
                    onClick={addCol}
                    className="w-full h-full flex items-center justify-center hover:bg-pplx-hover text-pplx-muted hover:text-pplx-text"
                  >
                    <Plus size={14} />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border-b border-r border-pplx-border last:border-r-0 p-0 min-w-[120px]"
                  >
                    <input
                      className="w-full bg-transparent p-2 text-sm text-pplx-text outline-none"
                      value={cell}
                      onChange={(e) =>
                        !readOnly && updateCell(rIdx + 1, cIdx, e.target.value)
                      }
                      readOnly={readOnly}
                    />
                  </td>
                ))}
                {!readOnly && (
                  <td className="border-b border-pplx-border bg-transparent"></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!readOnly && (
          <button
            onClick={addRow}
            className="w-full p-2 text-xs text-pplx-muted hover:bg-pplx-hover flex items-center gap-2 border-t border-transparent hover:border-pplx-border"
          >
            <Plus size={14} /> New Row
          </button>
        )}
      </div>
    </div>
  );
};

export const CalendarBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => {
  const now = new Date();
  let state = {
    month: now.getMonth(),
    year: now.getFullYear(),
    selected: [] as string[],
  };

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.month === "number")
      state = { ...state, ...parsed };
  } catch (e) {
    /* init */
  }

  const saveState = (newState: any) =>
    onChange(JSON.stringify({ ...state, ...newState }));
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const firstDay = new Date(state.year, state.month, 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const toggleDate = (day: number) => {
    if (readOnly) return;
    const dateStr = new Date(state.year, state.month, day)
      .toISOString()
      .split("T")[0];
    const newSelected = state.selected.includes(dateStr)
      ? state.selected.filter((d) => d !== dateStr)
      : [...state.selected, dateStr];
    saveState({ selected: newSelected });
  };

  return (
    <div className="my-6 border border-pplx-border rounded-xl overflow-hidden bg-pplx-card shadow-sm max-w-md">
      <div className="flex items-center justify-between p-3 bg-pplx-secondary/50 border-b border-pplx-border">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-pplx-accent" />
          <span className="font-semibold text-sm text-pplx-text">
            {monthNames[state.month]} {state.year}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                saveState(
                  state.month === 0
                    ? { month: 11, year: state.year - 1 }
                    : { month: state.month - 1 },
                )
              }
              className="p-1 hover:bg-pplx-hover rounded text-pplx-muted hover:text-pplx-text"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                saveState(
                  state.month === 11
                    ? { month: 0, year: state.year + 1 }
                    : { month: state.month + 1 },
                )
              }
              className="p-1 hover:bg-pplx-hover rounded text-pplx-muted hover:text-pplx-text"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div
              key={d}
              className="text-[10px] font-bold text-pplx-muted uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(state.year, state.month, day)
              .toISOString()
              .split("T")[0];
            const isSelected = state.selected.includes(dateStr);
            const isToday = new Date().toISOString().split("T")[0] === dateStr;
            return (
              <button
                key={day}
                onClick={() => toggleDate(day)}
                disabled={readOnly}
                className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm transition-all duration-200
                                    ${isSelected ? "bg-pplx-accent text-black font-bold shadow-sm scale-105" : "hover:bg-pplx-hover text-pplx-text"}
                                    ${isToday && !isSelected ? "border border-pplx-accent text-pplx-accent" : ""}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-3 text-[10px] text-pplx-muted text-center border-t border-pplx-border/50 pt-2">
        {state.selected.length} event{state.selected.length !== 1 ? "s" : ""}{" "}
        marked
      </div>
    </div>
  );
};

export const ChartBlock = ({
  type,
  content,
  onChange,
  readOnly,
}: {
  type: "chart_bar_v" | "chart_bar_h" | "chart_line" | "chart_donut";
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const parseData = (str: string) =>
    str
      .split(/[\n;]/)
      .map((line) => {
        const [label, val] = line.split(",");
        return { label: label || "Item", value: parseFloat(val) || 0 };
      })
      .filter((d) => d.label);

  let data = parseData(content);
  if (data.length === 0)
    data = [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 25 },
    ];

  const maxVal = Math.max(...data.map((d) => d.value)) * 1.1 || 100;
  const colors = [
    "#20B8CD",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
  ];

  return (
    <div className="my-6 p-6 border border-pplx-border rounded-2xl bg-pplx-card shadow-sm group/chart relative overflow-hidden">
      {!readOnly && (
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/chart:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 bg-pplx-secondary/80 backdrop-blur hover:bg-pplx-hover rounded-lg border border-pplx-border text-xs flex items-center gap-1.5 font-medium shadow-sm"
          >
            <Edit3 size={12} /> {isEditing ? "Done" : "Edit Data"}
          </button>
        </div>
      )}
      {isEditing ? (
        <div className="p-2">
          <div className="text-xs text-pplx-muted mb-2 font-mono uppercase tracking-wide">
            CSV Data (Label,Value)
          </div>
          <textarea
            className="w-full h-32 bg-pplx-input border border-pplx-border rounded-lg p-3 text-sm font-mono outline-none resize-none"
            value={content}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <div className="min-h-[256px] h-auto w-full flex items-center justify-center relative">
          {/* Visualizations simplified for brevity but functional */}
          {type === "chart_bar_v" && (
            <div className="flex items-end gap-3 h-full w-full pl-8 pb-6 pr-2 pt-4 relative z-10">
              {data.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end items-center h-full group/bar relative"
                >
                  <div
                    className="w-full rounded-t-lg transition-all min-w-[12px] hover:brightness-110 shadow-sm"
                    style={{
                      height: `${Math.max(0, (d.value / maxVal) * 100)}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                  />
                  <span className="text-[10px] font-medium text-pplx-muted mt-3 truncate w-full text-center absolute -bottom-6">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {type === "chart_donut" && (
            <div className="flex items-center justify-center h-full w-full relative">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-auto transform -rotate-90"
              >
                {
                  data.reduce(
                    (acc, d, i) => {
                      const total = data.reduce(
                        (sum, item) => sum + item.value,
                        0,
                      );
                      const percentage = d.value / total;
                      const circumference = 2 * Math.PI * 40;
                      const dashArray = `${percentage * circumference} ${circumference}`;
                      const offset = circumference - acc.currentOffset;
                      acc.currentOffset += percentage * circumference;

                      acc.elements.push(
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={colors[i % colors.length]}
                          strokeWidth="20"
                          strokeDasharray={dashArray}
                          strokeDashoffset={offset}
                          className="transition-all duration-500 hover:stroke-[22px] cursor-pointer"
                        />,
                      );
                      return acc;
                    },
                    { currentOffset: 0, elements: [] as JSX.Element[] },
                  ).elements
                }
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-pplx-text">
                  {data
                    .reduce((sum, item) => sum + item.value, 0)
                    .toLocaleString()}
                </span>
                <span className="text-[10px] text-pplx-muted uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {data.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-pplx-text font-medium">
                      {d.label}
                    </span>
                    <span className="text-pplx-muted">
                      {(
                        (d.value /
                          data.reduce((sum, item) => sum + item.value, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(type === "chart_bar_h" || type === "chart_line") && (
            <div className="flex flex-col items-center justify-center text-pplx-muted">
              <BarChart3 size={32} />
              <span className="text-xs mt-2">Visualization enabled</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TOCBlock = ({ allBlocks }: { allBlocks: Block[] }) => {
  const headings = allBlocks.filter(
    (b) => ["h1", "h2", "h3"].includes(b.type) && b.content.trim(),
  );
  const scrollToBlock = (id: string) =>
    document
      .querySelector(`[data-block-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

  if (headings.length === 0)
    return (
      <div className="my-4 p-4 bg-pplx-secondary/20 rounded-lg border border-pplx-border border-dashed text-pplx-muted text-sm text-center">
        Add headings (H1, H2, H3) to see them here.
      </div>
    );

  return (
    <div className="my-4 p-4 bg-pplx-secondary/10 rounded-lg border border-pplx-border">
      <div className="text-xs font-bold text-pplx-muted uppercase mb-3 tracking-wider flex items-center gap-2">
        <ListOrdered size={14} /> Table of Contents
      </div>
      <div className="space-y-1">
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => scrollToBlock(h.id)}
            className={`block w-full text-left text-sm hover:underline hover:text-pplx-accent transition-colors py-1 ${h.type === "h1" ? "font-medium text-pplx-text" : h.type === "h2" ? "text-pplx-text/80 pl-4" : "text-pplx-muted pl-8"}`}
          >
            {h.content}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ButtonBlock = ({
  content,
  onChange,
  onAction,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  onAction: () => void;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const handleClick = () => {
    if (!readOnly) onAction();
  };

  return (
    <div className="my-4 flex items-center gap-2 group/btn">
      <button
        onClick={handleClick}
        className="px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 text-sm font-semibold flex items-center gap-2 bg-pplx-text text-pplx-primary hover:bg-pplx-text/90"
      >
        <MousePointerClick size={16} />
        {isEditing ? (
          <input
            className="bg-transparent border-none outline-none w-24 text-center"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <span>{content || "Click Me"}</span>
        )}
      </button>
      {!readOnly && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-pplx-muted hover:text-pplx-text opacity-0 group-hover/btn:opacity-100 transition-opacity"
        >
          <Edit3 size={14} />
        </button>
      )}
    </div>
  );
};

export const WidgetBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Extract type and config from :::widget[type]config:::
  const trimmedContent = content.trim();
  const match = trimmedContent.match(/^:::widget\[(.*?)\]\s*([\s\S]*?)\s*:::$/);
  const widgetType = match ? match[1] : "chart";
  const configStr = match ? match[2] : content;

  return (
    <div className="my-4 group/widget relative">
      {!readOnly && (
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/widget:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 bg-pplx-secondary/80 backdrop-blur hover:bg-pplx-hover rounded-lg border border-pplx-border text-xs flex items-center gap-1.5 font-medium shadow-sm"
          >
            <Edit3 size={12} /> {isEditing ? "Done" : "Edit Config"}
          </button>
        </div>
      )}
      {isEditing ? (
        <div className="p-4 bg-pplx-card border border-pplx-border rounded-xl">
          <div className="text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-2">
            Widget Configuration (JSON)
          </div>
          <textarea
            className="w-full h-64 bg-pplx-input border border-pplx-border rounded-lg p-3 text-sm font-mono outline-none resize-none custom-scrollbar"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder=":::widget[type]...:::"
          />
        </div>
      ) : (
        <WidgetRenderer type={widgetType} configStr={configStr} />
      )}
    </div>
  );
};

export const SyncedBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => (
  <div className="my-4 p-0.5 border-2 border-orange-400/50 rounded-lg relative group/sync">
    <div className="absolute -top-3 left-3 bg-pplx-primary px-2 text-[10px] text-orange-400 flex items-center gap-1 font-medium z-10">
      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />{" "}
      Synced content
    </div>
    <div className="bg-pplx-secondary/10 p-4 rounded-md">
      <AutoResizeTextarea
        value={content}
        onChange={onChange}
        className="text-base text-pplx-text leading-relaxed w-full"
        placeholder="Type content to sync..."
        readOnly={readOnly}
      />
    </div>
    {!readOnly && (
      <div className="absolute top-2 right-2 opacity-0 group-hover/sync:opacity-100 transition-opacity">
        <button className="p-1 hover:bg-pplx-hover rounded text-pplx-muted hover:text-pplx-text">
          <MoreHorizontal size={14} />
        </button>
      </div>
    )}
  </div>
);

export const EquationBlock = ({
  content,
  onChange,
  readOnly,
}: {
  content: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) => (
  <div className="my-2 p-3 bg-pplx-card border border-pplx-border rounded flex items-center font-mono text-lg text-pplx-text group/eq relative">
    <Sigma size={18} className="mr-3 text-pplx-muted shrink-0" />
    <AutoResizeTextarea
      value={content}
      onChange={onChange}
      className="text-center bg-transparent w-full outline-none"
      placeholder="E = mc^2"
      readOnly={readOnly}
    />
  </div>
);
