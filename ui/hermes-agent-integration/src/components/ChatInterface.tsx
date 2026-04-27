import React, { useRef, useEffect, useState } from "react";
import { Message, Role, Attachment, Note, FocusMode } from "../types";
import { InputArea } from "./InputArea";
import { MessageRenderer } from "./MessageRenderer";
import { TornadoIndicator } from "./TornadoIndicator";
import { Tooltip } from "./Tooltip";
import { PerplexityLogo } from "../constants";
import {
  User,
  BookOpen,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Volume2,
  FileText,
  Pencil,
} from "lucide-react";

interface ChatInterfaceProps {
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
  isSidePanel?: boolean;
  activeNote?: Note;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
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
  isSidePanel = false,
  activeNote,
}) => {
  console.log("ChatInterface isSidePanel:", isSidePanel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const toggleCitations = (msgId: string) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleEditSubmit = (id: string) => {
    onEditMessage(id, editValue);
    setEditingMessageId(null);
  };

  const filteredMessages = messages.filter((m) => m.role !== Role.SYSTEM);

  return (
    <div
      className={`flex flex-col h-full relative overflow-hidden ${isSidePanel ? "bg-pplx-card" : "bg-pplx-bg"}`}
    >
      {/* Top Gradient Fade */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-pplx-card to-transparent z-10 pointer-events-none ${isSidePanel ? "h-6 opacity-80" : "h-12"}`}
      />

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8 relative ${isSidePanel ? "pt-2" : "pt-12"}`}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-pplx-muted opacity-50">
            <PerplexityLogo className="w-12 h-12 mb-4" />
            <p className="text-sm font-serif italic">
              How can I help with this page?
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col space-y-3 animate-fadeIn"
            >
              <div
                className={`flex ${msg.role === Role.USER ? "justify-end" : "justify-start flex-col"} w-full group items-start`}
              >
                {/* Model Header */}
                {msg.role === Role.MODEL && (
                  <div className="flex items-center gap-3 mb-2 select-none">
                    <div className="w-8 h-8 rounded-full bg-pplx-accent/10 flex items-center justify-center border border-transparent shrink-0">
                      <PerplexityLogo
                        className={`w-5 h-5 text-pplx-accent ${msg.isThinking ? "animate-spin-y" : ""}`}
                      />
                    </div>
                    <TornadoIndicator
                      isThinking={!!msg.isThinking}
                      reasoning={msg.reasoning}
                      currentStep={
                        msg.reasoning
                          ? msg.reasoning.split("\n").filter(Boolean).pop()
                          : undefined
                      }
                      agentPlan={msg.agentPlan}
                      agentActions={msg.agentActions}
                    />
                  </div>
                )}

                {/* Content Container */}
                <div
                  className={`flex flex-col min-w-0 ${msg.role === Role.USER ? "items-end max-w-[90%]" : "items-start w-full"} group`}
                >
                  {/* User Label */}
                  {msg.role === Role.USER && (
                    <div className="flex items-center gap-2 mb-2 mr-1 justify-end w-full group">
                      {/* User Actions (Visible on hover) */}
                      <div
                        className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2 ${editingMessageId === msg.id ? "opacity-100" : ""}`}
                      >
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditValue(msg.content);
                          }}
                          className="p-1 text-pplx-muted hover:text-pplx-text rounded hover:bg-pplx-hover transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => onCopyText(msg.id, msg.content)}
                          className="p-1 text-pplx-muted hover:text-pplx-text rounded hover:bg-pplx-hover transition-colors relative"
                          title="Copy"
                        >
                          {copiedId === msg.id ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] font-bold text-pplx-text/50 uppercase tracking-widest">
                        You
                      </span>
                      <div className="w-6 h-6 rounded-full bg-pplx-secondary border border-pplx-border flex items-center justify-center">
                        <User size={12} className="text-pplx-text/70" />
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div
                      className={`mt-2 mb-2 grid grid-cols-2 gap-2 ${msg.role === Role.USER ? "justify-items-end" : ""}`}
                    >
                      {msg.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-xl border border-pplx-border overflow-hidden bg-pplx-secondary w-20 h-20"
                        >
                          {att.type === "image" ? (
                            <img
                              src={att.content}
                              alt="attachment"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <FileText
                                className="text-pplx-muted mb-1"
                                size={20}
                              />
                              <span className="text-[10px] text-pplx-text truncate w-full px-1">
                                {att.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content Bubble OR Edit Mode */}
                  {editingMessageId === msg.id ? (
                    <div className="w-full bg-pplx-secondary border border-pplx-border rounded-2xl p-4 mt-1 animate-fadeIn">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-transparent text-pplx-text outline-none resize-none text-[15px] leading-7 font-sans min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditSubmit(msg.id)}
                          className="px-4 py-1.5 text-xs font-bold text-black bg-pplx-accent hover:bg-cyan-400 rounded-lg transition-colors"
                        >
                          Save & Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`font-normal leading-7 transition-all relative ${
                        msg.role === Role.USER
                          ? "text-[13px] bg-pplx-card px-4 py-3 rounded-3xl rounded-tr-sm text-pplx-text text-right whitespace-pre-wrap shadow-md backdrop-blur-md"
                          : "text-[16px] w-full text-pplx-text"
                      }`}
                    >
                      {msg.role === Role.USER ? (
                        msg.content
                      ) : (
                        <MessageRenderer content={msg.content} />
                      )}
                    </div>
                  )}

                  {/* Sources */}
                  {msg.role === Role.MODEL &&
                    msg.citations &&
                    msg.citations.length > 0 &&
                    expandedCitations[msg.id] && (
                      <div className="mt-4 w-full pt-2 border-t border-pplx-border/20">
                        <div className="grid grid-cols-2 gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {msg.citations.map((cit, idx) => (
                            <a
                              key={idx}
                              href={cit.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1.5 bg-pplx-card hover:bg-pplx-hover border border-pplx-border/50 rounded-md transition-all group overflow-hidden"
                            >
                              <Globe
                                size={8}
                                className="text-pplx-muted shrink-0"
                              />
                              <span className="text-[9px] font-medium text-pplx-text truncate leading-none">
                                {cit.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  {msg.role === Role.MODEL && !msg.isThinking && (
                    <div className="flex items-center gap-1 mt-4 border-t border-pplx-border/30 pt-2 w-full flex-nowrap overflow-x-auto no-scrollbar">
                      {msg.citations && msg.citations.length > 0 && (
                        <button
                          onClick={() => toggleCitations(msg.id)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] transition-colors rounded-lg border ${expandedCitations[msg.id] ? "bg-pplx-accent/10 border-pplx-accent/30 text-pplx-accent" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover border-transparent"}`}
                        >
                          <BookOpen
                            size={12}
                            className={expandedCitations[msg.id] ? "text-pplx-accent" : ""}
                          />
                          <span className="font-bold uppercase tracking-tight">
                            Surse
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => onRegenerate(msg.id)}
                        onMouseEnter={() => setHoveredTooltip("rewrite")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} /> <span>Rewrite</span>
                        {hoveredTooltip === "rewrite" && (
                          <Tooltip text="Rewrite" position="bottom" />
                        )}
                      </button>
                      <button
                        onClick={() => onCopyText(msg.id, msg.content)}
                        onMouseEnter={() => setHoveredTooltip("copy")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <Copy size={12} />
                        )}{" "}
                        <span>Copy</span>
                        {hoveredTooltip === "copy" && (
                          <Tooltip text="Copy" position="bottom" />
                        )}
                      </button>
                      <button
                        onClick={() => onTTS(msg.content)}
                        onMouseEnter={() => setHoveredTooltip("read")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className={`relative flex items-center gap-1.5 px-2 py-1.5 text-[10px] rounded-lg transition-colors ${isPlayingAudio ? "text-pplx-accent bg-pplx-accent/10" : "text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover"}`}
                      >
                        <Volume2 size={12} /> <span>Read</span>
                        {hoveredTooltip === "read" && (
                          <Tooltip text="Read" position="bottom" />
                        )}
                      </button>
                      <button
                        onClick={() => onShare(msg.content)}
                        onMouseEnter={() => setHoveredTooltip("share")}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="relative flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors"
                      >
                        <Share2 size={12} /> <span>Share</span>
                        {hoveredTooltip === "share" && (
                          <Tooltip text="Share" position="bottom" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Compact Related Questions - Clickable Text */}
                  {msg.role === Role.MODEL &&
                    msg.relatedQuestions &&
                    msg.relatedQuestions.length > 0 && (
                      <div className="mt-4 w-full pt-2">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold uppercase text-pplx-muted tracking-wider mb-1 opacity-70">
                            Întrebări sugerate
                          </span>
                          {msg.relatedQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                onSendMessage(q, [FocusMode.ALL], [])
                              }
                              className="text-[13px] italic text-pplx-muted hover:text-pplx-text transition-colors text-left leading-relaxed"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-[70px] left-0 right-0 h-8 bg-gradient-to-t from-pplx-card via-pplx-card/50 to-transparent z-10 pointer-events-none" />

      {/* Input Area */}
      <div
        className={`p-4 bg-pplx-card relative z-20 ${isSidePanel ? "md:p-4 p-2" : ""}`}
      >
        <InputArea
          onSendMessage={(text, focusModes, _proMode, atts) =>
            onSendMessage(text, focusModes, atts)
          }
          isThinking={isThinking}
          onStop={onStopGeneration}
          placeholder="Ask about this page..."
          compact={true}
          activeNote={activeNote}
          mobileSidePanel={isSidePanel}
        />
      </div>
    </div>
  );
};
