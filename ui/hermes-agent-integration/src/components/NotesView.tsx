import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
  Tag,
  X,
  Quote,
  GripVertical,
  CheckSquare,
  List,
  Minus,
  Code,
  Sparkles,
  Wand2,
  Smile,
  AlignLeft,
  Upload,
  Palette,
  Table as TableIcon,
  BarChart,
  ListChecks,
  Briefcase,
  Edit3,
  CalendarDays,
  Layers,
  ListOrdered,
} from "lucide-react";
import { Note } from "../types";
import { EMOJI_LIST } from "../constants";
import {
  Block,
  BlockType,
  AutoResizeTextarea,
  TableBlock,
  CalendarBlock,
  ChartBlock,
  TOCBlock,
  ButtonBlock,
  SyncedBlock,
  EquationBlock,
  MentionPageBlock,
  MentionPersonBlock,
  NewPageBlock,
  WidgetBlock,
} from "./BlockRenderers";
import { MessageRenderer } from "./MessageRenderer";

interface NotesViewProps {
  activeNoteId: string | null;
  notes: Note[];
  onSaveNote: (
    note: Note,
    addToHistory?: boolean,
    forceSnapshot?: boolean,
  ) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  onAiEdit: (text: string, instruction: string) => Promise<string>;
  onSelectNote: (id: string) => void;
  isSideChatOpen?: boolean;
}

const COVERS = [
  "linear-gradient(to right, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
  "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)",
  "linear-gradient(to right, #434343 0%, black 100%)",
  "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  "linear-gradient(to right, #b92b27, #1565c0)",
];

const uid = () => Math.random().toString(36).substr(2, 9);

// --- Table of Contents Component (Floating Sidebar Notion Style) ---
const TableOfContents = ({ blocks }: { blocks: Block[] }) => {
  const headings = blocks.filter(
    (b) => ["h1", "h2", "h3"].includes(b.type) && b.content.trim().length > 0,
  );

  if (headings.length < 2 && blocks.length < 15) return null;

  const scrollToBlock = (id: string) => {
    const el = document.querySelector(`[data-block-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 hidden lg:flex flex-col gap-1 group/toc bg-transparent hover:bg-pplx-bg/80 hover:backdrop-blur-xl hover:border hover:border-pplx-border hover:shadow-premium hover:py-10 hover:px-6 rounded-3xl transition-all duration-500 delay-0 hover:delay-[200ms] max-h-[80vh] overflow-y-auto no-scrollbar w-12 hover:w-[220px] items-end border border-transparent overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-4 pointer-events-none opacity-30 group-hover/toc:opacity-0 transition-opacity duration-500 delay-0 group-hover/toc:delay-[200ms] py-8 w-12">
        {headings.map((h) => (
          <div
            key={h.id + "_line"}
            className={`bg-pplx-accent rounded-full transition-all duration-500 ${h.type === "h1" ? "w-6 h-1" : h.type === "h2" ? "w-4 h-1 opacity-70" : "w-2 h-1 opacity-50"}`}
          />
        ))}
      </div>
      <div className="w-[172px] opacity-0 group-hover/toc:opacity-100 transition-opacity duration-500 delay-0 group-hover/toc:delay-[200ms] flex flex-col gap-2">
        <div className="text-[10px] font-display font-bold text-pplx-muted uppercase tracking-[0.2em] mb-4 px-1 pb-3 border-b border-pplx-border/50 whitespace-nowrap">
          Contents
        </div>
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => scrollToBlock(h.id)}
            className={`text-left w-full py-2.5 px-3 rounded-xl hover:bg-pplx-bg-secondary transition-all text-xs leading-relaxed flex flex-col justify-center min-h-[44px] group/item ${
              h.type === "h1"
                ? "font-bold text-pplx-text mt-2"
                : h.type === "h2"
                  ? "font-medium text-pplx-text/90 pl-4"
                  : "text-pplx-text-secondary pl-7"
            }`}
          >
            <span className="line-clamp-2 break-words group-hover/item:text-pplx-accent transition-colors">
              {h.content}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper for Mobile List Items
const MobileBlockRow = ({
  icon: Icon,
  label,
  onClick,
  isDestructive = false,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pplx-bg-secondary active:bg-pplx-secondary/50 transition-colors text-left rounded-lg mx-1 ${isDestructive ? "text-red-400" : "text-pplx-text"}`}
  >
    <div
      className={`flex items-center justify-center ${isDestructive ? "text-red-400" : "text-pplx-muted"}`}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const AddBlockMenu = ({
  onSelectType,
  onClose,
  isMobile = false,
  onAiAction,
  showAiOnly = false,
  onDeletePage,
  onAddTag,
  onDeleteBlock,
}: {
  onSelectType: (type: BlockType) => void;
  onClose: () => void;
  isMobile?: boolean;
  onAiAction?: (action: string) => void;
  showAiOnly?: boolean;
  onDeletePage?: () => void;
  onAddTag?: () => void;
  onDeleteBlock?: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        onClose();
    };
    if (!isMobile) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, isMobile]);

  if (showAiOnly && onAiAction) {
    if (isMobile) {
      return (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div
            className="fixed left-0 right-0 z-[70] bg-pplx-card border-t border-pplx-border rounded-t-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-150"
            style={{
              bottom:
                document.body.classList.contains("dock-active") &&
                window.innerWidth < 640
                  ? "calc(72px + env(safe-area-inset-bottom))"
                  : "0px",
            }}
          >
            <div className="px-3 py-2 text-xs font-bold text-pplx-muted uppercase tracking-wider mb-2">
              AI Assist
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onAiAction("fix")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pplx-text hover:bg-pplx-hover rounded-xl text-left"
              >
                <Wand2 size={18} className="text-pplx-accent" /> Fix Grammar &
                Spelling
              </button>
              <button
                onClick={() => onAiAction("shorten")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pplx-text hover:bg-pplx-hover rounded-xl text-left"
              >
                <Minus size={18} /> Shorten
              </button>
              <button
                onClick={() => onAiAction("longer")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pplx-text hover:bg-pplx-hover rounded-xl text-left"
              >
                <AlignLeft size={18} /> Make Longer
              </button>
              <button
                onClick={() => onAiAction("professional")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pplx-text hover:bg-pplx-hover rounded-xl text-left"
              >
                <Briefcase size={18} /> Professional Tone
              </button>
            </div>
          </div>
        </>
      );
    }
    return (
      <div
        ref={menuRef}
        className="absolute left-8 top-0 z-50 bg-pplx-card border border-pplx-border shadow-xl rounded-xl p-1 w-64 animate-fadeIn flex flex-col gap-1"
      >
        <div className="px-3 py-2 text-xs font-bold text-pplx-muted uppercase tracking-wider border-b border-pplx-border/50 mb-1">
          AI Assist
        </div>
        <button
          onClick={() => onAiAction("fix")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-pplx-text hover:bg-pplx-hover rounded-lg text-left"
        >
          <Wand2 size={16} className="text-pplx-accent" /> Fix Grammar &
          Spelling
        </button>
        <button
          onClick={() => onAiAction("shorten")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-pplx-text hover:bg-pplx-hover rounded-lg text-left"
        >
          <Minus size={16} /> Shorten
        </button>
        <button
          onClick={() => onAiAction("longer")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-pplx-text hover:bg-pplx-hover rounded-lg text-left"
        >
          <AlignLeft size={16} /> Make Longer
        </button>
        <button
          onClick={() => onAiAction("professional")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-pplx-text hover:bg-pplx-hover rounded-lg text-left"
        >
          <Briefcase size={16} /> Professional Tone
        </button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-transparent" onClick={onClose} />
        <div
          className="fixed right-4 z-[60] w-64 bg-pplx-card border border-pplx-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-150 max-h-[65vh] overflow-y-auto custom-scrollbar flex flex-col p-2"
          style={{
            bottom:
              document.body.classList.contains("dock-active") &&
              window.innerWidth < 640
                ? "calc(16px + 72px + env(safe-area-inset-bottom))"
                : "16px",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <MobileBlockRow
              icon={FileText}
              label="New Page"
              onClick={() => onSelectType("newpage")}
            />
            <MobileBlockRow
              icon={Type}
              label="Text"
              onClick={() => onSelectType("text")}
            />
            <MobileBlockRow
              icon={CheckSquare}
              label="To-do list"
              onClick={() => onSelectType("todo")}
            />
            <MobileBlockRow
              icon={Heading1}
              label="Heading 1"
              onClick={() => onSelectType("h1")}
            />
            <MobileBlockRow
              icon={Heading2}
              label="Heading 2"
              onClick={() => onSelectType("h2")}
            />
            <MobileBlockRow
              icon={List}
              label="Bulleted List"
              onClick={() => onSelectType("bullet")}
            />
            <MobileBlockRow
              icon={ListChecks}
              label="Numbered List"
              onClick={() => onSelectType("number")}
            />
            <MobileBlockRow
              icon={ImageIcon}
              label="Image"
              onClick={() => onSelectType("image")}
            />
            <MobileBlockRow
              icon={Upload}
              label="File"
              onClick={() => onSelectType("file")}
            />
            <MobileBlockRow
              icon={Code}
              label="Code"
              onClick={() => onSelectType("code")}
            />
            <MobileBlockRow
              icon={Quote}
              label="Quote"
              onClick={() => onSelectType("quote")}
            />
            <MobileBlockRow
              icon={TableIcon}
              label="Table"
              onClick={() => onSelectType("table")}
            />
            <MobileBlockRow
              icon={CalendarDays}
              label="Calendar"
              onClick={() => onSelectType("calendar")}
            />
            <MobileBlockRow
              icon={BarChart}
              label="Chart"
              onClick={() => onSelectType("chart_bar_v")}
            />
            <MobileBlockRow
              icon={ListOrdered}
              label="TOC"
              onClick={() => onSelectType("toc")}
            />
            <MobileBlockRow
              icon={Layers}
              label="Synced Block"
              onClick={() => onSelectType("block_synced")}
            />
            {onAddTag && (
              <MobileBlockRow icon={Tag} label="Add Tag" onClick={onAddTag} />
            )}
            {onDeleteBlock && (
              <MobileBlockRow
                icon={Trash2}
                label="Delete Block"
                onClick={onDeleteBlock}
                isDestructive
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop Menu
  return (
    <div
      ref={menuRef}
      className="absolute left-10 top-0 z-50 bg-pplx-bg/95 backdrop-blur-2xl border border-pplx-border shadow-premium rounded-2xl p-2 w-80 animate-in fade-in zoom-in duration-200 max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col gap-0.5">
        {onDeleteBlock && (
          <MobileBlockRow
            icon={Trash2}
            label="Delete Block"
            onClick={onDeleteBlock}
            isDestructive
          />
        )}
        <div className="px-4 py-2 text-[10px] font-display font-bold text-pplx-muted uppercase tracking-[0.2em] mb-1">
          Basic Blocks
        </div>
        <MobileBlockRow icon={FileText} label="New Page" onClick={() => onSelectType("newpage")} />
        <MobileBlockRow icon={Type} label="Text" onClick={() => onSelectType("text")} />
        <MobileBlockRow icon={Heading1} label="Heading 1" onClick={() => onSelectType("h1")} />
        <MobileBlockRow icon={Heading2} label="Heading 2" onClick={() => onSelectType("h2")} />
        <MobileBlockRow icon={Heading3} label="Heading 3" onClick={() => onSelectType("h3")} />

        <div className="px-4 py-2 text-[10px] font-display font-bold text-pplx-muted uppercase tracking-[0.2em] mt-4 mb-1">
          Lists & Media
        </div>
        <MobileBlockRow icon={CheckSquare} label="To-do List" onClick={() => onSelectType("todo")} />
        <MobileBlockRow icon={List} label="Bullet List" onClick={() => onSelectType("bullet")} />
        <MobileBlockRow icon={ImageIcon} label="Image" onClick={() => onSelectType("image")} />
        <MobileBlockRow icon={Upload} label="File / Video" onClick={() => onSelectType("file")} />
        <MobileBlockRow icon={Quote} label="Quote" onClick={() => onSelectType("quote")} />
        <MobileBlockRow icon={Code} label="Code Block" onClick={() => onSelectType("code")} />

        <div className="px-4 py-2 text-[10px] font-display font-bold text-pplx-muted uppercase tracking-[0.2em] mt-4 mb-1">
          Data & Advanced
        </div>
        <MobileBlockRow icon={TableIcon} label="Table" onClick={() => onSelectType("table")} />
        <MobileBlockRow icon={CalendarDays} label="Calendar View" onClick={() => onSelectType("calendar")} />
        <MobileBlockRow icon={BarChart} label="Chart" onClick={() => onSelectType("chart_bar_v")} />
        <MobileBlockRow icon={Layers} label="Widget" onClick={() => onSelectType("widget")} />

        {onAddTag && (
          <div className="mt-2 border-t border-pplx-border/30 pt-2">
            <MobileBlockRow icon={Tag} label="Add Tag" onClick={onAddTag} />
          </div>
        )}
        {onDeletePage && (
          <MobileBlockRow icon={Trash2} label="Delete Page" onClick={onDeletePage} isDestructive />
        )}
      </div>
    </div>
  );
};

const renderBlockContent = (
  block: Block,
  onChange: (val: string) => void,
  onCheck: (checked: boolean) => void,
  onEnter: () => void,
  onDelete: () => void,
  onPaste: (e: React.ClipboardEvent) => void,
  isFocused: boolean,
  onFocus: () => void,
  onNavigatePage: (id: string) => void,
  allBlocks: Block[],
  readOnly: boolean = false,
  updateBlockMetadata?: (data: any) => void,
  allNotes?: Note[],
) => {
  // Shared text props
  const textProps = {
    value: block.content,
    onChange,
    onEnter,
    onBackspace: () => {
      if (block.content === "") onDelete();
    },
    onPaste,
    autoFocus: isFocused,
    onFocus,
    readOnly,
    className: "",
  };

  const isEditing = isFocused && !readOnly;

  switch (block.type) {
    case "h1":
      return (
        <div className="flex items-center mt-10 mb-4">
          <Heading1
            size={24}
            className="mr-3 text-pplx-accent shrink-0 opacity-40"
          />
          <AutoResizeTextarea
            {...textProps}
            className="text-4xl font-display font-bold text-pplx-text placeholder-pplx-text-secondary/30 tracking-tight"
            placeholder="Heading 1"
          />
        </div>
      );
    case "h2":
      return (
        <div className="flex items-center mt-8 mb-3">
          <Heading2
            size={20}
            className="mr-3 text-pplx-accent shrink-0 opacity-40"
          />
          <AutoResizeTextarea
            {...textProps}
            className="text-3xl font-display font-bold text-pplx-text placeholder-pplx-text-secondary/30 tracking-tight"
            placeholder="Heading 2"
          />
        </div>
      );
    case "h3":
      return (
        <div className="flex items-center mt-6 mb-2">
          <Heading3
            size={18}
            className="mr-3 text-pplx-accent shrink-0 opacity-40"
          />
          <AutoResizeTextarea
            {...textProps}
            className="text-2xl font-display font-semibold text-pplx-text placeholder-pplx-text-secondary/30 tracking-tight"
            placeholder="Heading 3"
          />
        </div>
      );
    case "bullet":
      return (
        <div className="flex items-start my-1.5">
          <div className="mr-3 mt-2.5 w-2 h-2 bg-pplx-accent rounded-full shrink-0 shadow-[0_0_8px_rgba(32,184,205,0.4)]" />
          <AutoResizeTextarea
            {...textProps}
            className="text-base text-pplx-text leading-relaxed"
            placeholder="List item"
          />
        </div>
      );
    case "number":
      return (
        <div className="flex items-start my-1.5">
          <div className="mr-3 mt-1.5 w-6 text-right text-pplx-accent shrink-0 font-mono text-sm font-bold">
            1.
          </div>
          <AutoResizeTextarea
            {...textProps}
            className="text-base text-pplx-text leading-relaxed"
            placeholder="List item"
          />
        </div>
      );
    case "todo":
      return (
        <div className="flex items-start my-1.5">
          <button
            onClick={() => !readOnly && onCheck(!block.checked)}
            className={`mr-3 mt-1.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${block.checked ? "bg-pplx-accent border-pplx-accent scale-110" : "border-pplx-border hover:border-pplx-accent bg-pplx-bg-secondary"}`}
          >
            {block.checked && (
              <CheckSquare size={12} className="text-pplx-bg font-bold" />
            )}
          </button>
          <AutoResizeTextarea
            {...textProps}
            className={`text-base leading-relaxed transition-all duration-300 ${block.checked ? "text-pplx-text-secondary line-through opacity-50 italic" : "text-pplx-text"}`}
            placeholder="To-do"
          />
        </div>
      );
    case "quote":
      return (
        <div className="flex items-start my-6 pl-6 border-l-4 border-pplx-accent bg-pplx-bg-secondary/50 backdrop-blur-sm rounded-r-3xl p-6 shadow-premium">
          <AutoResizeTextarea
            {...textProps}
            className="text-lg italic text-pplx-text-secondary leading-relaxed font-medium"
            placeholder="Quote"
          />
        </div>
      );
    case "code":
      return (
        <div className="my-8 relative group/code">
          {!readOnly && (
            <div className="absolute top-[16px] right-4 z-20 opacity-0 group-hover/code:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/code:translate-y-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus();
                }}
                className="px-4 py-2 bg-pplx-bg/90 backdrop-blur-xl hover:bg-pplx-accent hover:text-pplx-bg rounded-xl border border-pplx-border text-[10px] flex items-center gap-2 font-bold uppercase tracking-[0.15em] shadow-premium transition-all"
              >
                <Edit3 size={12} /> {isEditing ? "Done" : "Edit Code"}
              </button>
            </div>
          )}
          {isEditing ? (
            <div className="bg-[#0F172A] border border-pplx-border rounded-2xl overflow-hidden font-mono text-sm shadow-premium">
              <div className="bg-[#1E293B] px-5 py-3 text-xs text-slate-400 flex justify-between border-b border-white/5 font-bold tracking-widest uppercase">
                <span>Editor</span>
              </div>
              <div className="p-6">
                <AutoResizeTextarea
                  {...textProps}
                  className="text-slate-200 leading-relaxed"
                  placeholder="// Code snippet"
                />
              </div>
            </div>
          ) : (
            <div className="py-2">
              <MessageRenderer content={`\`\`\`${block.content}\`\`\``} />
            </div>
          )}
        </div>
      );
    case "divider":
      return (
        <div className="py-8 cursor-default" onClick={onFocus}>
          <hr className="border-t border-pplx-border opacity-50" />
        </div>
      );
    case "image":
      return (
        <div className="my-8 relative group/media">
          <img
            src={block.content}
            alt="Block Media"
            className="rounded-3xl max-h-[600px] w-auto border border-pplx-border shadow-premium transition-transform duration-500 group-hover/media:scale-[1.01]"
          />
          {!readOnly && (
            <button
              onClick={onDelete}
              className="absolute top-4 right-4 bg-pplx-bg/80 backdrop-blur p-2 rounded-xl text-pplx-text opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-premium"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      );
    case "file":
      return (
        <div className="my-4 p-5 border border-pplx-border bg-pplx-bg-secondary/50 backdrop-blur-sm rounded-2xl flex items-center justify-between group/file shadow-premium hover:border-pplx-accent/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pplx-accent/10 rounded-xl text-pplx-accent">
              <FileText size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-pplx-text truncate max-w-[300px]">
                {block.metadata?.name || "File"}
              </span>
              <span className="text-xs font-medium text-pplx-text-secondary uppercase tracking-widest">
                {block.metadata?.mimeType || "Unknown Type"}
              </span>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={onDelete}
              className="p-2 text-pplx-text-secondary hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-all"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      );
    case "newpage":
      return (
        <NewPageBlock
          content={block.content}
          metadata={block.metadata}
          onNavigate={onNavigatePage}
          notes={allNotes}
        />
      );
    case "table":
      return (
        <TableBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "calendar":
      return (
        <CalendarBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "widget":
      return (
        <WidgetBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "chart_bar_v":
    case "chart_bar_h":
    case "chart_line":
    case "chart_donut":
      return (
        <ChartBlock
          type={block.type}
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "toc":
      return <TOCBlock allBlocks={allBlocks} />;
    case "button":
      return (
        <ButtonBlock
          content={block.content}
          onChange={onChange}
          onAction={onEnter}
          readOnly={readOnly}
        />
      );
    case "equation":
      return (
        <EquationBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "mention_person":
      return (
        <MentionPersonBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "mention_page":
      return (
        <MentionPageBlock
          content={block.content}
          metadata={block.metadata}
          notes={allNotes || []}
          onUpdate={updateBlockMetadata || (() => {})}
          onNavigate={onNavigatePage}
          readOnly={readOnly}
        />
      );
    case "block_synced":
      return (
        <SyncedBlock
          content={block.content}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    default:
      if (isEditing) {
        return (
          <div className="my-1">
            <AutoResizeTextarea
              {...textProps}
              className="text-base text-pplx-text leading-relaxed"
              placeholder="Type '/' for commands"
            />
          </div>
        );
      }
      if (!block.content.trim()) {
        return <div className="my-1 h-6" />;
      }
      return (
        <div className="my-1 py-1 min-h-[1.5rem] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:leading-normal">
          <MessageRenderer content={block.content} />
        </div>
      );
  }
};

// --- Sortable Block Components ---

interface SortableBlockItemProps {
  id: string;
  children: (dragHandleProps: any, isDragging: boolean) => React.ReactNode;
}

const SortableBlockItem = ({ id, children }: SortableBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as "relative",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners, isDragging)}
    </div>
  );
};

const BlockRow = ({
  block,
  activeNote,
  activeBlockId,
  setActiveBlockId,
  showAddMenu,
  setShowAddMenu,
  aiMenuBlockId,
  setAiMenuBlockId,
  thinkingBlockId,
  updateBlock,
  addBlock,
  deleteBlock,
  handlePaste,
  onSelectNote,
  notes,
  handleAiAction,
  onDeleteNote,
  setIsTagInputOpen,
  dragHandleProps,
  isOverlay,
  showBlockMenu,
  setShowBlockMenu,
}: any) => {
  const isFocused = activeBlockId === block.id;
  const isWideBlock = [
    "table",
    "chart_bar_v",
    "chart_bar_h",
    "chart_line",
    "chart_donut",
    "calendar",
    "db_list",
    "db_gallery",
    "widget",
  ].includes(block.type);

  // Helper for precise vertical alignment on desktop
  const getTopClass = () => {
    if (block.type === "h1") return "top-[30px]";
    if (block.type === "h2") return "top-[24px]";
    if (block.type === "h3") return "top-[18px]";
    if (block.type === "quote" || block.type === "code") return "top-[12px]";
    if (block.type === "divider") return "top-[16px]";
    if (
      [
        "image",
        "file",
        "table",
        "calendar",
        "widget",
        "chart_bar_v",
        "chart_bar_h",
        "chart_line",
        "chart_donut",
      ].includes(block.type)
    )
      return "top-[12px]";
    return "top-[4px]"; // default text, bullet, todo, number
  };

  const topClass = getTopClass();

  return (
    <div
      data-block-id={block.id}
      className={`group relative flex flex-col md:flex-row -mx-2 md:mx-0 group/row touch-manipulation min-h-[1.5rem] py-1 transition-all duration-300 ${isOverlay ? "bg-pplx-bg shadow-premium border border-pplx-accent/30 rounded-3xl opacity-90 scale-105" : ""}`}
      onClick={() => !isOverlay && setActiveBlockId(block.id)}
    >
      {!activeNote.isLocked && !isOverlay && (
        <div
          className={`hidden md:flex items-center gap-2 pr-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 absolute -left-28 ${topClass} select-none h-8 justify-end w-28 transform -translate-x-2 group-hover/row:translate-x-0`}
        >
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiMenuBlockId(aiMenuBlockId === block.id ? null : block.id);
              }}
              className={`p-1.5 text-pplx-accent hover:text-white hover:bg-pplx-accent rounded-xl transition-all shadow-premium ${thinkingBlockId === block.id ? "animate-pulse" : ""}`}
              title="AI Assist"
            >
              <Sparkles size={16} />
            </button>
            {aiMenuBlockId === block.id && (
              <AddBlockMenu
                onSelectType={() => {}}
                onClose={() => setAiMenuBlockId(null)}
                isMobile={false}
                onAiAction={(action) => handleAiAction(block.id, action)}
                showAiOnly={true}
              />
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(block.id);
              }}
              className="p-1.5 text-pplx-text-secondary hover:text-pplx-text hover:bg-pplx-bg-secondary rounded-xl transition-all shadow-premium"
            >
              <Plus size={16} />
            </button>
          </div>
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1.5 text-pplx-text-secondary hover:text-pplx-text hover:bg-pplx-bg-secondary rounded-xl transition-all shadow-premium"
          >
            <GripVertical size={16} />
          </div>
        </div>
      )}

      <div
        className={`flex-1 min-w-0 px-2 md:px-0 ${isWideBlock ? "pr-0 w-full" : "pr-4"} md:pr-0 transition-all duration-300 ${thinkingBlockId === block.id ? "opacity-40 blur-[1px] pointer-events-none" : "opacity-100"} ${isOverlay ? "max-h-[80px] overflow-hidden mask-image-b-fade" : ""}`}
      >
        {renderBlockContent(
          block,
          (content) => updateBlock(block.id, { content }),
          (checked) => updateBlock(block.id, { checked }),
          () => {
            if (activeNote.isLocked) return;
            const listTypes = ["bullet", "number", "todo"];
            const nextType = listTypes.includes(block.type)
              ? block.type
              : "text";
            addBlock(block.id, nextType);
          },
          () => deleteBlock(block.id),
          (e) => handlePaste(e, block.id),
          isFocused,
          () => setActiveBlockId(block.id),
          (pageId) => onSelectNote(pageId),
          notes,
          activeNote.isLocked,
          (updates) => updateBlock(block.id, updates),
          notes,
        )}
      </div>

      {!activeNote.isLocked && !isOverlay && (
        <div
          className={`md:hidden flex items-center justify-end gap-1 px-2 transition-all duration-200 overflow-hidden ${isFocused || showAddMenu === block.id || aiMenuBlockId === block.id ? "h-10 opacity-100 mt-1 mb-2" : "h-0 opacity-0"}`}
        >
          <div className="flex items-center bg-pplx-secondary/30 rounded-full px-2 py-1 gap-1 border border-pplx-border/50 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiMenuBlockId(aiMenuBlockId === block.id ? null : block.id);
              }}
              className={`p-1.5 rounded-full hover:bg-pplx-hover ${block.content.length > 0 ? "text-pplx-accent" : "text-pplx-muted opacity-50"}`}
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(block.id);
              }}
              className="p-1.5 text-pplx-muted hover:text-pplx-text rounded-full hover:bg-pplx-hover"
            >
              <Plus size={18} />
            </button>
            <div
              {...dragHandleProps}
              className="p-1.5 text-pplx-muted hover:text-pplx-text cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical size={18} />
            </div>
          </div>
          {aiMenuBlockId === block.id && (
            <AddBlockMenu
              onSelectType={() => {}}
              onClose={() => setAiMenuBlockId(null)}
              isMobile={true}
              onAiAction={(action) => handleAiAction(block.id, action)}
              showAiOnly={true}
            />
          )}
        </div>
      )}

      {(showAddMenu === block.id || showBlockMenu === block.id) && (
        <AddBlockMenu
          onSelectType={(type) => addBlock(block.id, type)}
          onClose={() => {
            setShowAddMenu(null);
            setShowBlockMenu(null);
          }}
          isMobile={showBlockMenu === block.id || window.innerWidth < 768}
          onDeletePage={() => onDeleteNote(activeNote.id)}
          onAddTag={() => setIsTagInputOpen(true)}
          onDeleteBlock={() => deleteBlock(block.id)}
        />
      )}
    </div>
  );
};

export const NotesView: React.FC<NotesViewProps> = ({
  activeNoteId,
  notes,
  onSaveNote,
  onDeleteNote,
  onAiEdit,
  onSelectNote,
}) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [aiMenuBlockId, setAiMenuBlockId] = useState<string | null>(null);
  const [thinkingBlockId, setThinkingBlockId] = useState<string | null>(null);
  const [pendingFileBlockId, setPendingFileBlockId] = useState<string | null>(
    null,
  );
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Refs for synchronization and undo/redo handling
  const lastSavedContentRef = useRef<string | null>(null);
  const lastNoteIdRef = useRef<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const blockFileInputRef = useRef<HTMLInputElement>(null);
  // const draggingTouchRef = useRef<string | null>(null); // Removed

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedBlockId(null);

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveBlocks(newItems, true);
        return newItems;
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (activeNote?.isLocked) return;
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setDraggedBlockId(event.active.id as string);
  };
  useEffect(() => {
    if (activeNote) {
      // Only re-parse if the note ID changed OR if the content is different from what we last saved.
      // This allows external updates (like Undo) to flow in, but prevents internal updates (Typing) from causing re-renders/cursor jumps.
      if (
        activeNote.id !== lastNoteIdRef.current ||
        activeNote.content !== lastSavedContentRef.current
      ) {
        const lines = activeNote.content
          ? activeNote.content.split("\n")
          : [""];
        const parsedBlocks: Block[] = [];

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];

          // Multi-line code block parser
          if (line.startsWith("```")) {
            let content = line.slice(3);
            if (!line.endsWith("```") || line === "```") {
              i++;
              while (i < lines.length) {
                if (lines[i].endsWith("```")) {
                  content += "\n" + lines[i].slice(0, -3);
                  break;
                }
                content += "\n" + lines[i];
                i++;
              }
            } else {
              content = content.slice(0, -3);
            }
            parsedBlocks.push({
              id: uid(),
              type: "code",
              content,
              checked: false,
            });
            continue;
          }

          // Multi-line widget parser
          if (line.startsWith(":::widget")) {
            let content = line;
            i++;
            while (i < lines.length) {
              content += "\n" + lines[i];
              if (
                lines[i].startsWith(":::") &&
                !lines[i].startsWith(":::widget")
              ) {
                break;
              }
              i++;
            }
            parsedBlocks.push({
              id: uid(),
              type: "widget",
              content,
              checked: false,
            });
            continue;
          }

          // Multi-line special blocks (JSON)
          const specialTags = [
            "[TABLE]",
            "[CALENDAR]",
            "[CHART_V]",
            "[CHART_H]",
            "[CHART_L]",
            "[CHART_D]",
            "[EQUATION]",
            "[SYNC]",
            "[BUTTON]",
          ];
          const foundTag = specialTags.find((tag) => line.startsWith(tag));
          if (foundTag) {
            let type: BlockType =
              foundTag === "[TABLE]"
                ? "table"
                : foundTag === "[CALENDAR]"
                  ? "calendar"
                  : foundTag === "[CHART_V]"
                    ? "chart_bar_v"
                    : foundTag === "[CHART_H]"
                      ? "chart_bar_h"
                      : foundTag === "[CHART_L]"
                        ? "chart_line"
                        : foundTag === "[CHART_D]"
                          ? "chart_donut"
                          : foundTag === "[EQUATION]"
                            ? "equation"
                            : foundTag === "[SYNC]"
                              ? "block_synced"
                              : "button";

            let content = line.replace(foundTag, "");
            if (
              content.trim().startsWith("{") &&
              !content.trim().endsWith("}")
            ) {
              i++;
              while (i < lines.length) {
                content += "\n" + lines[i];
                if (lines[i].trim().endsWith("}")) break;
                i++;
              }
            }
            parsedBlocks.push({ id: uid(), type, content, checked: false });
            continue;
          }

          // Single line blocks
          let type: BlockType = "text";
          let content = line;
          let checked = false;
          let metadata = undefined;

          if (line.startsWith("# ")) {
            type = "h1";
            content = line.replace("# ", "");
          } else if (line.startsWith("## ")) {
            type = "h2";
            content = line.replace("## ", "");
          } else if (line.startsWith("### ")) {
            type = "h3";
            content = line.replace("### ", "");
          } else if (line.startsWith("- [ ] ")) {
            type = "todo";
            content = line.replace("- [ ] ", "");
            checked = false;
          } else if (line.startsWith("- [x] ")) {
            type = "todo";
            content = line.replace("- [x] ", "");
            checked = true;
          } else if (line.startsWith("- ")) {
            type = "bullet";
            content = line.replace("- ", "");
          } else if (line.match(/^\d+\. /)) {
            type = "number";
            content = line.replace(/^\d+\. /, "");
          } else if (line.startsWith("> ")) {
            type = "quote";
            content = line.replace("> ", "");
          } else if (line === "---") {
            type = "divider";
            content = "";
          } else if (line.startsWith("[FILE:")) {
            type = "file";
            content = line.replace("[FILE:", "").replace("]", "");
          } else if (line.startsWith("[PAGE:")) {
            const parts = line.match(/\[PAGE:(.*?):(.*?)\]/);
            if (parts) {
              content = parts[2];
              metadata = { pageId: parts[1] };
            } else {
              content = "Untitled Page";
            }
            type = "newpage";
          } else if (line.startsWith("[TOC]")) {
            type = "toc";
            content = "";
          } else if (line.startsWith("[MENTION_P]")) {
            type = "mention_person";
            content = line.replace("[MENTION_P]", "");
          } else if (line.startsWith("[MENTION_D]")) {
            type = "mention_page";
            const complexMatch = line.match(/\[MENTION_D:(.*?)\](.*)/);
            if (complexMatch) {
              metadata = { pageId: complexMatch[1] };
              content = complexMatch[2];
            } else {
              content = line.replace("[MENTION_D]", "");
            }
          }

          parsedBlocks.push({ id: uid(), type, content, checked, metadata });
        }

        if (parsedBlocks.length === 0)
          parsedBlocks.push({ id: uid(), type: "text", content: "" });

        setBlocks(parsedBlocks);
        setThinkingBlockId(null);
        setIsTagInputOpen(false);

        // Sync refs to current state
        lastNoteIdRef.current = activeNote.id;
        lastSavedContentRef.current = activeNote.content;
      }
    }
  }, [activeNote?.id, activeNote?.content]);

  const saveBlocks = useCallback(
    (currentBlocks: Block[], forceSnapshot: boolean = false) => {
      if (!activeNote) return;
      const contentString = currentBlocks
        .map((b) => {
          switch (b.type) {
            case "h1":
              return `# ${b.content}`;
            case "h2":
              return `## ${b.content}`;
            case "h3":
              return `### ${b.content}`;
            case "bullet":
              return `- ${b.content}`;
            case "number":
              return `1. ${b.content}`;
            case "todo":
              return `- [${b.checked ? "x" : " "}] ${b.content}`;
            case "quote":
              return `> ${b.content}`;
            case "code":
              return `\`\`\`${b.content}\`\`\``;
            case "divider":
              return `---`;
            case "file":
              return `[FILE:${b.content}]`;
            case "newpage":
              return `[PAGE:${b.metadata?.pageId || ""}:${b.content}]`;
            case "table":
              return `[TABLE]${b.content}`;
            case "calendar":
              return `[CALENDAR]${b.content}`;
            case "widget":
              return b.content;
            case "chart_bar_v":
              return `[CHART_V]${b.content}`;
            case "chart_bar_h":
              return `[CHART_H]${b.content}`;
            case "chart_line":
              return `[CHART_L]${b.content}`;
            case "chart_donut":
              return `[CHART_D]${b.content}`;
            case "toc":
              return `[TOC]`;
            case "button":
              return `[BUTTON]${b.content}`;
            case "equation":
              return `[EQUATION]${b.content}`;
            case "block_synced":
              return `[SYNC]${b.content}`;
            case "mention_person":
              return `[MENTION_P]${b.content}`;
            case "mention_page":
              if (b.metadata?.pageId)
                return `[MENTION_D:${b.metadata.pageId}]${b.content}`;
              return `[MENTION_D]${b.content}`;
            default:
              return b.content;
          }
        })
        .join("\n");

      // Update the ref *before* calling onSaveNote.
      // This ensures that when the parent component updates and passes back the new content,
      // the useEffect knows that *we* caused this update, so it doesn't re-parse blocks.
      lastSavedContentRef.current = contentString;
      onSaveNote(
        { ...activeNote, content: contentString },
        true,
        forceSnapshot,
      );
    },
    [activeNote, onSaveNote],
  );

  const handlePaste = (e: React.ClipboardEvent, currentBlockId: string) => {
    if (activeNote?.isLocked) return;
    const text = e.clipboardData.getData("text/plain");

    // If it contains a widget or code block, don't split it into multiple blocks
    // This allows the whole widget to stay in one block and render correctly
    const hasSpecialTag =
      text.startsWith("[TABLE]") ||
      text.startsWith("[CALENDAR]") ||
      text.startsWith("[CHART_") ||
      text.startsWith("[EQUATION]") ||
      text.startsWith("[SYNC]") ||
      text.startsWith("[BUTTON]");

    if ((text.includes("\n") || text.includes("\r")) && !hasSpecialTag) {
      e.preventDefault();

      // Advanced parser for mixed content
      const lines = text.split(/\r?\n/);
      const newBlocks: Block[] = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim() && i === lines.length - 1) continue;

        // Widget parser in paste
        if (line.trim().startsWith(":::widget")) {
          let widgetContent = line;
          let j = i + 1;
          while (j < lines.length) {
            widgetContent += "\n" + lines[j];
            if (lines[j].trim() === ":::") {
              i = j;
              break;
            }
            j++;
          }
          newBlocks.push({
            id: uid(),
            type: "widget",
            content: widgetContent,
            checked: false,
          });
          continue;
        }

        // Code block parser in paste
        if (line.trim().startsWith("```")) {
          let codeContent = line;
          let j = i + 1;
          while (j < lines.length) {
            codeContent += "\n" + lines[j];
            if (lines[j].trim().endsWith("```")) {
              i = j;
              break;
            }
            j++;
          }
          // If it's a chart code block, we can keep it as code or convert to widget
          // MessageRenderer handles it either way, but 'code' block type is fine
          newBlocks.push({
            id: uid(),
            type: "code",
            content: codeContent.slice(3).replace(/\n?```$/, ""),
            checked: false,
          });
          continue;
        }

        // Basic blocks
        let type: BlockType = "text";
        let content = line;
        if (line.startsWith("# ")) {
          type = "h1";
          content = line.replace("# ", "");
        } else if (line.startsWith("## ")) {
          type = "h2";
          content = line.replace("## ", "");
        } else if (line.startsWith("### ")) {
          type = "h3";
          content = line.replace("### ", "");
        } else if (line.startsWith("- [ ] ")) {
          type = "todo";
          content = line.replace("- [ ] ", "");
        } else if (line.startsWith("- [x] ")) {
          type = "todo";
          content = line.replace("- [x] ", "");
        } else if (line.startsWith("- ")) {
          type = "bullet";
          content = line.replace("- ", "");
        }

        newBlocks.push({ id: uid(), type, content, checked: false });
      }

      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === currentBlockId);
        const finalBlocks = [...prev];
        const currentBlock = prev[index];
        if (currentBlock && currentBlock.content.trim() === "")
          finalBlocks.splice(index, 1, ...newBlocks);
        else finalBlocks.splice(index + 1, 0, ...newBlocks);
        saveBlocks(finalBlocks, true);
        return finalBlocks;
      });
    }
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    if (activeNote?.isLocked) return;
    setBlocks((prev) => {
      const newBlocks = prev.map((b) =>
        b.id === id ? { ...b, ...updates } : b,
      );
      // Typing updates use default debounce (false for forceSnapshot)
      saveBlocks(newBlocks, false);
      return newBlocks;
    });
  };

  const addBlock = (afterId: string, type: BlockType = "text") => {
    if (activeNote?.isLocked) return;
    if (["image", "video", "audio", "file"].includes(type)) {
      setPendingFileBlockId(afterId);
      if (blockFileInputRef.current) blockFileInputRef.current.click();
      setShowAddMenu(null);
      return;
    }
    if (type === "newpage") {
      const newPageId = uid();
      const newPageNote: Note = {
        id: newPageId,
        title: "Untitled",
        content: "",
        updatedAt: Date.now(),
        status: "Idea",
        tags: [],
        parentId: activeNoteId || undefined,
      };
      onSaveNote(newPageNote, true, true);
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === afterId);
        const newBlock: Block = {
          id: uid(),
          type: "newpage",
          content: "Untitled",
          checked: false,
          metadata: { pageId: newPageId },
        };
        const newBlocks = [...prev];
        newBlocks.splice(index + 1, 0, newBlock);
        saveBlocks(newBlocks, true); // Force snapshot for structural change
        return newBlocks;
      });
      setShowAddMenu(null);
      onSelectNote(newPageId);
      return;
    }

    const newId = uid();
    let initialContent = "";
    if (type === "table")
      initialContent = JSON.stringify([
        ["Header 1", "Header 2"],
        ["Cell 1", "Cell 2"],
      ]);
    if (
      type === "chart_bar_v" ||
      type === "chart_bar_h" ||
      type === "chart_line" ||
      type === "chart_donut"
    )
      initialContent = "Label,10\nLabel,20\nLabel,15";

    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === afterId);
      const newBlock: Block = {
        id: newId,
        type,
        content: initialContent,
        checked: false,
      };
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      saveBlocks(newBlocks, true); // Force snapshot for structural change
      return newBlocks;
    });
    setActiveBlockId(newId);
    setShowAddMenu(null);
    setShowBlockMenu(null);
  };

  const handleFileBlockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeNote?.isLocked) return;
    if (e.target.files && e.target.files[0] && pendingFileBlockId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newId = uid();
        let blockType: BlockType = "file";
        if (file.type.startsWith("image/")) blockType = "image";
        const newBlock: Block = {
          id: newId,
          type: blockType,
          content: reader.result as string,
          metadata: { name: file.name, mimeType: file.type },
        };
        setBlocks((prev) => {
          const index = prev.findIndex((b) => b.id === pendingFileBlockId);
          const newBlocks = [...prev];
          newBlocks.splice(index + 1, 0, newBlock);
          newBlocks.splice(index + 2, 0, {
            id: uid(),
            type: "text",
            content: "",
          });
          saveBlocks(newBlocks, true); // Force snapshot for file upload
          return newBlocks;
        });
        setActiveBlockId(newId);
        setPendingFileBlockId(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const deleteBlock = (id: string) => {
    if (activeNote?.isLocked) return;
    setBlocks((prev) => {
      if (prev.length <= 1) {
        const reset = prev.map((b) =>
          b.id === id ? { ...b, content: "", type: "text" as BlockType } : b,
        );
        saveBlocks(reset, true);
        return reset;
      }
      const newBlocks = prev.filter((b) => b.id !== id);
      saveBlocks(newBlocks, true); // Force snapshot for deletion
      return newBlocks;
    });
    setShowBlockMenu(null);
  };

  const handleAddTag = () => {
    if (tagInputValue.trim() && activeNote) {
      onSaveNote(
        {
          ...activeNote,
          tags: [...(activeNote.tags || []), tagInputValue.trim()],
        },
        true,
        true,
      );
      setTagInputValue("");
      setIsTagInputOpen(false);
    }
  };
  const removeTag = (tag: string) => {
    if (activeNote)
      onSaveNote(
        { ...activeNote, tags: activeNote.tags?.filter((t) => t !== tag) },
        true,
        true,
      );
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeNote) {
      const reader = new FileReader();
      reader.onload = () =>
        onSaveNote(
          { ...activeNote, cover: reader.result as string },
          true,
          true,
        );
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleRandomCover = () => {
    if (!activeNote) return;
    const available = COVERS.filter((c) => c !== activeNote.cover);
    onSaveNote(
      {
        ...activeNote,
        cover:
          available[Math.floor(Math.random() * available.length)] || COVERS[0],
      },
      true,
      true,
    );
  };

  const handleAiAction = async (blockId: string, action: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !block.content.trim()) return;
    setThinkingBlockId(blockId);
    setAiMenuBlockId(null);
    setShowBlockMenu(null);
    let instruction = "";
    switch (action) {
      case "fix":
        instruction = "Fix grammar and spelling, maintain tone.";
        break;
      case "shorten":
        instruction = "Make this shorter and more concise.";
        break;
      case "longer":
        instruction = "Expand on this idea, make it longer.";
        break;
      case "professional":
        instruction = "Rewrite in a professional, business tone.";
        break;
      default:
        instruction = action;
    }
    try {
      const newText = await onAiEdit(block.content, instruction);
      if (newText) updateBlock(blockId, { content: newText });
    } catch (e) {
      console.error("AI Edit Failed", e);
    } finally {
      setThinkingBlockId(null);
    }
  };

  const getFontClass = (style?: "sans" | "serif" | "mono") => {
    switch (style) {
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      default:
        return "font-sans";
    }
  };

  if (!activeNote) return null;

  return (
    <div className="flex flex-col flex-1 bg-pplx-primary text-pplx-text overflow-hidden relative">
      <TableOfContents blocks={blocks} />
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar relative ${getFontClass(activeNote.fontStyle)}`}
      >
        {activeNote.cover && (
          <div className="group relative w-full h-48 md:h-80 bg-pplx-bg-secondary border-b border-pplx-border transition-all duration-500 animate-in fade-in slide-in-from-top-4">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
              style={{
                background: activeNote.cover.includes("gradient")
                  ? activeNote.cover
                  : `url(${activeNote.cover})`,
              }}
            />
            {!activeNote.isLocked && (
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-3">
                <button
                  onClick={handleRandomCover}
                  className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl text-xs font-medium text-white hover:bg-black/80 border border-white/10 flex items-center gap-2 shadow-premium transition-all active:scale-95"
                >
                  <Palette size={14} /> Change Cover
                </button>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl text-xs font-medium text-white hover:bg-black/80 border border-white/10 flex items-center gap-2 shadow-premium transition-all active:scale-95"
                >
                  <Upload size={14} /> Upload
                </button>
                <button
                  onClick={() =>
                    onSaveNote({ ...activeNote, cover: undefined }, true, true)
                  }
                  className="p-2 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500/80 border border-white/10 shadow-premium transition-all active:scale-95"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleCoverUpload}
        />
        <input
          type="file"
          ref={blockFileInputRef}
          className="hidden"
          onChange={handleFileBlockUpload}
        />

        <div className="max-w-4xl mx-auto px-6 md:px-16 pb-40 pt-16 relative z-10">
          <div className="group relative mb-12">
            {!activeNote.isLocked && (
              <div
                className={`flex gap-6 text-xs font-bold text-pplx-muted opacity-0 group-hover:opacity-100 transition-all duration-300 mb-4 transform -translate-y-2 group-hover:translate-y-0 uppercase tracking-[0.15em]`}
              >
                {!activeNote.emoji && (
                  <button
                    onClick={() => {
                      onSaveNote({ ...activeNote, emoji: "📄" }, true, true);
                    }}
                    className="hover:text-pplx-accent flex items-center gap-2 transition-colors"
                  >
                    <Smile size={16} /> Add Icon
                  </button>
                )}
                {!activeNote.cover && (
                  <button
                    onClick={handleRandomCover}
                    className="hover:text-pplx-accent flex items-center gap-2 transition-colors"
                  >
                    <ImageIcon size={16} /> Add Cover
                  </button>
                )}
              </div>
            )}

            {activeNote.emoji && (
              <div className="relative mb-8 group/icon inline-block">
                <button
                  disabled={activeNote.isLocked}
                  className={`text-7xl md:text-8xl flex items-center justify-center select-none rounded-3xl p-4 transition-all -ml-4 ${activeNote.isLocked ? "cursor-default" : "cursor-pointer hover:bg-pplx-bg-secondary hover:shadow-premium"}`}
                  onClick={() =>
                    !activeNote.isLocked && setShowIconPicker(!showIconPicker)
                  }
                >
                  {activeNote.emoji}
                </button>
                {!activeNote.isLocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveNote({ ...activeNote, emoji: "" }, true, true);
                    }}
                    className="absolute -top-2 -right-2 bg-pplx-bg border border-pplx-border rounded-full p-1.5 text-pplx-muted hover:text-red-500 opacity-0 group-hover/icon:opacity-100 transition-all shadow-premium hover:scale-110"
                  >
                    <X size={12} />
                  </button>
                )}
                {showIconPicker && (
                  <>
                    <div className="absolute top-full left-0 mt-4 p-4 bg-pplx-bg/95 backdrop-blur-2xl border border-pplx-border rounded-3xl shadow-premium z-[200] w-80 h-80 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-6 gap-3">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onSaveNote({ ...activeNote, emoji }, true, true);
                              setShowIconPicker(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center hover:bg-pplx-bg-secondary rounded-xl text-2xl transition-all hover:scale-110 active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      className="fixed inset-0 z-[190]"
                      onClick={() => setShowIconPicker(false)}
                    />
                  </>
                )}
              </div>
            )}

            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Untitled"
                value={activeNote.title}
                readOnly={activeNote.isLocked}
                onChange={(e) =>
                  onSaveNote(
                    { ...activeNote, title: e.target.value },
                    false,
                    false,
                  )
                }
                className={`w-full text-5xl md:text-6xl font-display font-bold bg-transparent text-pplx-text placeholder-pplx-muted/30 outline-none leading-tight break-words border-none p-0 focus:ring-0 transition-all ${activeNote.isLocked ? "cursor-default" : "focus:placeholder-pplx-muted/10"}`}
              />
            </div>

            <div className="flex items-center gap-3 overflow-hidden flex-wrap min-h-[32px]">
              {activeNote.tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-pplx-accent/5 text-pplx-accent px-3.5 py-1.5 rounded-full whitespace-nowrap border border-pplx-accent/10 hover:border-pplx-accent/30 transition-all group/tag shadow-sm"
                >
                  <Tag size={12} className="opacity-70" />
                  {tag}
                  {!activeNote.isLocked && (
                    <button
                      onClick={() => removeTag(tag)}
                      className="w-0 overflow-hidden group-hover/tag:w-auto hover:text-red-400 transition-all pl-1.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {!activeNote.isLocked &&
                (isTagInputOpen ? (
                  <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                    <input
                      autoFocus
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag();
                        if (e.key === "Escape") setIsTagInputOpen(false);
                      }}
                      onBlur={() => setIsTagInputOpen(false)}
                      placeholder="New tag..."
                      className="bg-pplx-bg-secondary/50 border-b-2 border-pplx-accent text-xs font-bold text-pplx-text px-3 py-1.5 w-32 outline-none placeholder-pplx-muted rounded-t-lg"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsTagInputOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-widest text-pplx-muted hover:text-pplx-accent flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-pplx-bg-secondary transition-all opacity-0 group-hover:opacity-100 duration-300 border border-transparent hover:border-pplx-border"
                  >
                    <Plus size={14} /> Add Tag
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-1 relative">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks.map((block) => (
                  <SortableBlockItem key={block.id} id={block.id}>
                    {(dragHandleProps, isDragging) => (
                      <BlockRow
                        block={block}
                        activeNote={activeNote}
                        activeBlockId={activeBlockId}
                        setActiveBlockId={setActiveBlockId}
                        showAddMenu={showAddMenu}
                        setShowAddMenu={setShowAddMenu}
                        aiMenuBlockId={aiMenuBlockId}
                        setAiMenuBlockId={setAiMenuBlockId}
                        thinkingBlockId={thinkingBlockId}
                        updateBlock={updateBlock}
                        addBlock={addBlock}
                        deleteBlock={deleteBlock}
                        handlePaste={handlePaste}
                        onSelectNote={onSelectNote}
                        notes={notes}
                        handleAiAction={handleAiAction}
                        onDeleteNote={onDeleteNote}
                        setIsTagInputOpen={setIsTagInputOpen}
                        dragHandleProps={dragHandleProps}
                        isDragging={isDragging}
                        showBlockMenu={showBlockMenu}
                        setShowBlockMenu={setShowBlockMenu}
                      />
                    )}
                  </SortableBlockItem>
                ))}
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: "0.5" } },
                  }),
                }}
              >
                {draggedBlockId ? (
                  <BlockRow
                    block={blocks.find((b) => b.id === draggedBlockId)}
                    activeNote={activeNote}
                    activeBlockId={activeBlockId}
                    setActiveBlockId={setActiveBlockId}
                    showAddMenu={showAddMenu}
                    setShowAddMenu={setShowAddMenu}
                    aiMenuBlockId={aiMenuBlockId}
                    setAiMenuBlockId={setAiMenuBlockId}
                    thinkingBlockId={thinkingBlockId}
                    updateBlock={updateBlock}
                    addBlock={addBlock}
                    deleteBlock={deleteBlock}
                    handlePaste={handlePaste}
                    onSelectNote={onSelectNote}
                    notes={notes}
                    handleAiAction={handleAiAction}
                    onDeleteNote={onDeleteNote}
                    setIsTagInputOpen={setIsTagInputOpen}
                    dragHandleProps={{}}
                    isDragging={true}
                    isOverlay={true}
                    showBlockMenu={showBlockMenu}
                    setShowBlockMenu={setShowBlockMenu}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>

            {!activeNote.isLocked && (
              <div className="mt-12 mb-8 group/add-btn flex items-center justify-center">
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
