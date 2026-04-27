import React, { useState, useEffect, useRef } from "react";
import { ChatInterface } from "./ChatInterface";
import { Tooltip } from "./Tooltip";
import { Message, Attachment, Note, FocusMode } from "../types";
import {
  SquarePen,
  PanelRight,
  ChevronsRight,
  ChevronDown,
  Maximize2,
} from "lucide-react";

interface SideChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (
    text: string,
    focusModes: FocusMode[],
    attachments: Attachment[],
  ) => void;
  onStopGeneration: () => void;
  onRegenerate: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onCopyText: (id: string, text: string) => void;
  onShare: (text: string) => void;
  onTTS: (text: string) => void;
  isPlayingAudio: boolean;
  copiedId: string | null;
  activeNote?: Note;
  onNewChat?: () => void;
  mode?: "sidebar" | "floating";
  onModeChange?: (mode: "sidebar" | "floating") => void;
}

export const SideChatPanel: React.FC<SideChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  isThinking,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onEditMessage,
  onCopyText,
  onShare,
  onTTS,
  isPlayingAudio,
  copiedId,
  activeNote,
  onNewChat,
  mode: propMode,
  onModeChange,
}) => {
  const [width, setWidth] = useState(320);
  const [mobileHeight, setMobileHeight] = useState(50); // in vh

  // Floating Mode State
  const [internalMode, setInternalMode] = useState<"sidebar" | "floating">(
    "sidebar",
  );
  const mode = propMode || internalMode;
  const setMode = onModeChange || setInternalMode;

  const [floatSize, setFloatSize] = useState({ width: 450, height: 600 });
  const [floatPos, setFloatPos] = useState({
    x: window.innerWidth - 500,
    y: 100,
  });
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const isResizing = useRef(false);
  const isResizingMobile = useRef(false);
  const isDragging = useRef(false);
  const isResizingFloat = useRef(false);
  const isResizingFloatTL = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, posX: 0, posY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Sidebar Resize
      if (isResizing.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 320 && newWidth < 800) {
          setWidth(newWidth);
        }
      }
      // Mobile Resize
      if (isResizingMobile.current) {
        const newHeight =
          ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
        if (newHeight > 30 && newHeight < 95) {
          setMobileHeight(newHeight);
        }
      }
      // Floating Drag
      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setFloatPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
      // Floating Resize
      if (isResizingFloat.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        setFloatSize({
          width: Math.max(350, resizeStart.current.w + dx),
          height: Math.max(400, resizeStart.current.h + dy),
        });
      }

      // Floating Resize (Top-Left)
      if (isResizingFloatTL.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        const newWidth = Math.max(350, resizeStart.current.w - dx);
        const newHeight = Math.max(400, resizeStart.current.h - dy);

        setFloatSize({ width: newWidth, height: newHeight });
        setFloatPos({
          x: resizeStart.current.posX + (resizeStart.current.w - newWidth),
          y: resizeStart.current.posY + (resizeStart.current.h - newHeight),
        });
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      isResizingMobile.current = false;
      isDragging.current = false;
      isResizingFloat.current = false;
      isResizingFloatTL.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove as any); // Type assertion for simplicity
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove as any);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  const headerContent = (
    <div
      className={`flex items-center justify-between px-4 pt-0.5 pb-0 select-none ${mode === "floating" ? "cursor-move" : ""} z-20 relative`}
      onMouseDown={(e) => {
        if (mode === "floating") {
          isDragging.current = true;
          dragStart.current = { x: e.clientX, y: e.clientY };
        }
      }}
    >
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 text-[13px] font-medium text-pplx-text hover:bg-white/5 px-1.5 py-1 rounded-md transition-colors group"
      >
        <span>New AI chat</span>
        <ChevronDown
          size={12}
          className="text-pplx-muted group-hover:text-pplx-text"
        />
      </button>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onNewChat}
          onMouseEnter={() => setHoveredTooltip("new")}
          onMouseLeave={() => setHoveredTooltip(null)}
          className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-full transition-colors relative"
        >
          <SquarePen size={18} className="md:stroke-[2.2]" />
          {hoveredTooltip === "new" && (
            <Tooltip text="New Chat" position="bottom" />
          )}
        </button>
        <button
          onClick={() => setMode(mode === "sidebar" ? "floating" : "sidebar")}
          onMouseEnter={() => setHoveredTooltip("mode")}
          onMouseLeave={() => setHoveredTooltip(null)}
          className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-full transition-colors relative"
        >
          {mode === "sidebar" ? (
            <PanelRight size={18} className="md:stroke-[2.2]" />
          ) : (
            <Maximize2 size={18} className="md:stroke-[2.2]" />
          )}
          {hoveredTooltip === "mode" && (
            <Tooltip
              text={
                mode === "sidebar" ? "Switch to Floating" : "Switch to Sidebar"
              }
              position="bottom"
            />
          )}
        </button>
        <button
          onClick={onClose}
          onMouseEnter={() => setHoveredTooltip("hide")}
          onMouseLeave={() => setHoveredTooltip(null)}
          className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-full transition-colors relative"
        >
          <ChevronsRight size={18} className="md:stroke-[2.2]" />
          {hoveredTooltip === "hide" && (
            <Tooltip text="Hide Chat" position="bottom" />
          )}
        </button>
      </div>
    </div>
  );

  const chatContent = (
    <ChatInterface
      messages={messages}
      isThinking={isThinking}
      onSendMessage={onSendMessage}
      onStopGeneration={onStopGeneration}
      onRegenerate={onRegenerate}
      onEditMessage={onEditMessage}
      onCopyText={onCopyText}
      onShare={onShare}
      onTTS={onTTS}
      // onClose removed - handled by header
      isPlayingAudio={isPlayingAudio}
      copiedId={copiedId}
      isSidePanel={true}
      activeNote={activeNote}
    />
  );

  return (
    <>
      {/* Desktop Panel */}
      {mode === "sidebar" ? (
        <div
          className="hidden lg:flex flex-col border-l border-white/10 bg-pplx-card h-full shadow-2xl z-30 transition-[width] duration-150 relative"
          style={{ width: `${width}px` }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-pplx-accent/50 transition-colors z-40"
            onMouseDown={(e) => {
              e.preventDefault();
              isResizing.current = true;
              document.body.style.cursor = "col-resize";
            }}
          />

          {headerContent}

          <div className="flex-1 min-h-0">{chatContent}</div>
        </div>
      ) : (
        <div
          className="hidden lg:flex flex-col fixed bg-pplx-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{
            width: floatSize.width,
            height: floatSize.height,
            left: floatPos.x,
            top: floatPos.y,
          }}
        >
          {/* Resize Handle (Top-Left) */}
          <div
            className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center text-white/0 hover:text-white/30 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              isResizingFloatTL.current = true;
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                w: floatSize.width,
                h: floatSize.height,
                posX: floatPos.x,
                posY: floatPos.y,
              };
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              className="rotate-180"
            >
              <path d="M10 10L0 10L10 0L10 10Z" />
            </svg>
          </div>

          {headerContent}
          <div className="flex-1 min-h-0">{chatContent}</div>

          {/* Resize Handle (Corner) */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              isResizingFloat.current = true;
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                w: floatSize.width,
                h: floatSize.height,
                posX: floatPos.x,
                posY: floatPos.y,
              };
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M10 10L0 10L10 0L10 10Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Mobile Drawer - Optimized Height & Design */}
      <div
        className={`lg:hidden fixed left-0 right-0 bg-pplx-card/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-150 ease-out rounded-t-[32px] ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        style={{
          height: `${mobileHeight}vh`,
          bottom: document.body.classList.contains("dock-active")
            ? "calc(72px + env(safe-area-inset-bottom))"
            : "0px",
        }}
      >
        {/* Handle / Resize Trigger - Hidden/Overlay to maximize space */}
        <div
          className="w-full flex flex-col items-center py-1 cursor-row-resize touch-none relative opacity-0 hover:opacity-100 transition-opacity absolute top-0 z-40"
          onMouseDown={(event) => {
            event.preventDefault();
            isResizingMobile.current = true;
          }}
          onTouchStart={() => {
            isResizingMobile.current = true;
          }}
        >
          <div className="w-12 h-1 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
        </div>

        {/* Mobile Back Button (Overlay) - Moved Higher */}
        <button
          onClick={onClose}
          className="absolute top-2 left-2 p-2 text-pplx-muted hover:text-pplx-text bg-pplx-secondary/80 backdrop-blur-md rounded-full z-50"
        >
          <ChevronDown size={20} className="rotate-90" />
        </button>

        <div className="flex-1 min-h-0 pt-2">{chatContent}</div>
      </div>
    </>
  );
};
