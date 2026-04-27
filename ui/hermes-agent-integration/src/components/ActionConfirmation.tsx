import React, { useState } from "react";
import {
  Check,
  X,
  Edit3,
  FileText,
  AlertCircle,
  Type,
  AlignLeft,
  Trash2,
  FolderPlus,
  Table,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { PendingAction } from "../types";

interface ActionConfirmationProps {
  action: PendingAction;
  onConfirm: (modifiedData: any) => void;
  onCancel: () => void;
  onRedact?: () => void;
}

export const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  action,
  onConfirm,
  onCancel,
  onRedact,
}) => {
  const isBlockOperation = action.type === "block_operation";
  const isCalendarEvent = action.type === "calendar_event";
  const isComplexModule = action.type === "complex_module_action";
  const isSensitiveData = action.type === "sensitive_data_warning";

  // --- SENSITIVE DATA WARNING ---
  if (isSensitiveData) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-pplx-card sm:border border-pplx-border sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-pplx-border bg-orange-500/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg text-orange-500 bg-orange-500/20">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 className="text-[15px] sm:text-lg font-bold text-pplx-text tracking-tight">
                  Sensitive Data Detected
                </h2>
                <p className="text-[11px] sm:text-xs text-pplx-muted">
                  The agent is attempting to use potentially sensitive information.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:px-6 sm:py-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 sm:gap-6">
            <div className="space-y-1 flex-1 flex flex-col min-h-0">
              <label className="text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider flex items-center gap-1.5 shrink-0 mb-1.5 sm:mb-2">
                <FileText size={12} /> Data Payload
              </label>
              <div className="flex-1 w-full bg-pplx-input border border-pplx-border rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs font-mono text-pplx-text shadow-sm overflow-auto">
                <pre>{JSON.stringify(action.data.payload, null, 2)}</pre>
              </div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] sm:text-xs shrink-0">
              Warning: This data will be sent to an external tool or search engine.
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-5 border-t border-pplx-border bg-pplx-card flex flex-col gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onConfirm(action.data.payload)}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Check size={16} strokeWidth={3} />
              Continue (Send Data)
            </button>
            <button
              onClick={onRedact}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-pplx-text bg-pplx-secondary hover:bg-pplx-hover transition-all"
            >
              <Edit3 size={16} />
              Continue without data (Redact)
            </button>
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors"
            >
              <X size={16} /> Cancel Action
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State for Page/Block operations
  const [title, setTitle] = useState(
    isBlockOperation
      ? action.data.args.pageTitle
      : isCalendarEvent
        ? action.data.args.title
        : isComplexModule
          ? `${action.data.module}: ${action.data.action}`
          : action.data.title,
  );
  // Safe formatting for complex modules
  const getComplexModuleContent = () => {
    try {
      const data = action.data.data;
      if (typeof data === "string") {
        try {
          return JSON.stringify(JSON.parse(data), null, 2);
        } catch (e) {
          return data;
        }
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return "{}";
    }
  };

  const [content, setContent] = useState(
    isBlockOperation
      ? action.data.args.content ||
          action.data.args.newContent ||
          "Block Deletion"
      : isCalendarEvent
        ? action.data.args.description
        : isComplexModule
          ? getComplexModuleContent()
          : action.data.content,
  );

  // Helper to convert timestamp to datetime-local string
  const toDateTimeString = (ts: any) => {
    if (!ts) return "";
    const date = new Date(Number(ts));
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Calendar specific state
  const [startDate, setStartDate] = useState(
    isCalendarEvent ? toDateTimeString(action.data.args.startDate) : "",
  );
  const [endDate, setEndDate] = useState(
    isCalendarEvent ? toDateTimeString(action.data.args.endDate) : "",
  );
  const [location, setLocation] = useState(
    isCalendarEvent ? action.data.args.location : "",
  );

  const wordCount = (content || "").trim().split(/\s+/).length;
  const isUpdate = action.type === "update_page";

  // --- COMPLEX MODULE ACTION CONFIRMATION ---
  if (isComplexModule) {
    const { module, action: moduleAction } = action.data;
    const moduleName = module === "safe_digital" ? "Safe Digital" : "Portfolio";
    const opColor = moduleAction.includes("delete")
      ? "text-red-500 bg-red-500/10"
      : "text-blue-500 bg-blue-500/10";
    const Icon = moduleAction.includes("delete")
      ? Trash2
      : moduleAction.includes("add")
        ? FolderPlus
        : Edit3;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-pplx-card sm:border border-pplx-border sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl overflow-hidden animate-in sm:zoom-in-95 slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-200 flex flex-col">
          {/* Header - Structured Info */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-pplx-border bg-pplx-secondary/30 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${opColor}`}>
                    <Icon size={16} />
                  </div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-pplx-text tracking-tight max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                    {moduleName} Action: {moduleAction.replace("_", " ")}
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-pplx-muted pl-1 hidden sm:block">
                  Review and modify the payload before saving to your {moduleName}.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-pplx-muted bg-pplx-primary border border-pplx-border px-2 py-1 rounded-md shrink-0">
                <span className="uppercase tracking-wider hidden sm:inline">Storage:</span>
                <span className="text-pplx-text font-bold">{moduleName}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-3 sm:px-6 sm:py-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 sm:gap-6">
            <div className="flex flex-col flex-1 min-h-[300px] sm:min-h-0 group">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 shrink-0">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                  <AlignLeft size={12} /> Action Payload (JSON)
                </label>
              </div>
              <div className="relative flex-1 flex flex-col">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-pplx-text tracking-wide whitespace-pre-wrap font-mono shadow-sm outline-none resize-none transition-all custom-scrollbar placeholder-pplx-muted/50"
                  spellCheck={false}
                />
              </div>
            </div>

            {moduleAction.includes("delete") ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-[11px] text-red-500 leading-relaxed font-medium">
                  Warning: This will permanently remove the item from {moduleName}.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-pplx-secondary/50 border border-pplx-border/50 shrink-0">
                <AlertCircle size={14} className="text-pplx-accent shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-[11px] text-pplx-muted leading-relaxed font-medium">
                  Review and ensure the JSON payload is formatted accurately before saving.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-5 border-t border-pplx-border bg-pplx-card flex items-center justify-between gap-3 sm:gap-4 shrink-0">
            <button
              onClick={onCancel}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors flex items-center gap-2"
            >
              <X size={16} /> <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={() => {
                try {
                  const parsedData = JSON.parse(content);
                  onConfirm(parsedData);
                } catch (e) {
                  alert("Invalid JSON payload. Please check the format.");
                }
              }}
              className={`flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${moduleAction.includes("delete") ? "bg-red-500 shadow-red-500/20" : "bg-blue-600 shadow-blue-600/20"}`}
            >
              <Check size={18} strokeWidth={3} />
              <span>Confirm {moduleAction.includes("delete") ? "Deletion" : "Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- CALENDAR EVENT CONFIRMATION ---
  if (isCalendarEvent) {
    const opType = action.data.operation; // 'add', 'update', 'delete'
    const opName =
      opType === "add"
        ? "Add Event"
        : opType === "update"
          ? "Update Event"
          : "Delete Event";
    const opColor =
      opType === "delete"
        ? "text-red-500 bg-red-500/10"
        : "text-blue-500 bg-blue-500/10";
    const Icon =
      opType === "delete" ? Trash2 : opType === "add" ? Calendar : Edit3;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-pplx-card sm:border border-pplx-border sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col">
          {/* Header - Structured Info */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-pplx-border bg-pplx-secondary/30 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${opColor}`}>
                    <Icon size={16} />
                  </div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-pplx-text tracking-tight max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                    {opName}
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-pplx-muted pl-1 hidden sm:block">
                  Review and modify the event details before applying changes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-pplx-muted bg-pplx-primary border border-pplx-border px-2 py-1 rounded-md shrink-0">
                <span className="uppercase tracking-wider hidden sm:inline">Storage:</span>
                <span className="text-pplx-text font-bold">Calendar</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:px-6 sm:py-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 sm:gap-6">
            {/* Title */}
            <div className="group shrink-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                  <Type size={12} /> Event Title
                </label>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={opType === "delete"}
                className="w-full bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-base sm:text-lg font-semibold text-pplx-text shadow-sm outline-none transition-all placeholder-pplx-muted/50"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 shrink-0">
              <div className="group">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                    <Clock size={12} /> Start Time
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={opType === "delete"}
                  className="w-full bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl px-2 py-2 sm:px-4 sm:py-3.5 text-[12px] sm:text-sm font-mono text-pplx-text shadow-sm outline-none transition-all disabled:opacity-70"
                />
              </div>
              <div className="group">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                    <Clock size={12} /> End Time
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={opType === "delete"}
                  className="w-full bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl px-2 py-2 sm:px-4 sm:py-3.5 text-[12px] sm:text-sm font-mono text-pplx-text shadow-sm outline-none transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Location */}
            <div className="group shrink-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                  <MapPin size={12} /> Location
                </label>
              </div>
              <input
                value={location || ""}
                onChange={(e) => setLocation(e.target.value)}
                disabled={opType === "delete"}
                placeholder="Add location..."
                className="w-full bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl px-3 py-2 sm:px-4 sm:py-3.5 text-[13px] sm:text-sm text-pplx-text shadow-sm outline-none transition-all placeholder-pplx-muted/50 disabled:opacity-70"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col flex-1 min-h-[100px] group">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 shrink-0">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                  <AlignLeft size={12} /> Description
                </label>
              </div>
              <div className="relative flex flex-col flex-1">
                <textarea
                  value={content || ""}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={opType === "delete"}
                  placeholder="Add description..."
                  className="w-full flex-1 bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[150px] text-[13px] sm:text-sm text-pplx-text shadow-sm outline-none resize-none transition-all placeholder-pplx-muted/50 disabled:opacity-70 custom-scrollbar"
                />
              </div>
            </div>

            {opType === "delete" ? (
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0">
                <AlertCircle size={14} className="text-red-500 shrink-0 sm:mt-0.5" />
                <p className="text-[11px] sm:text-xs text-red-500 leading-relaxed">
                  Are you sure you want to delete this event? This action cannot be undone.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-pplx-secondary/50 border border-pplx-border/50 shrink-0">
                <AlertCircle size={14} className="text-pplx-accent shrink-0 sm:mt-0.5" />
                <p className="text-[11px] sm:text-xs text-pplx-muted leading-relaxed">
                  This will {opType === "update" ? "modify" : "add"} an event in your external Google Calendar and your local data.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-5 border-t border-pplx-border bg-pplx-card flex items-center justify-between gap-3 sm:gap-4 shrink-0">
            <button
              onClick={onCancel}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors flex items-center gap-2"
            >
              <X size={16} /> <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={() =>
                onConfirm({
                  ...action.data.args,
                  title,
                  description: content,
                  startDate: startDate
                    ? new Date(startDate).getTime()
                    : action.data.args.startDate,
                  endDate: endDate
                    ? new Date(endDate).getTime()
                    : action.data.args.endDate,
                  location,
                })
              }
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${opType === "delete" ? "bg-red-500 shadow-red-500/20" : "bg-blue-600 shadow-blue-600/20"}`}
            >
              <Check size={18} strokeWidth={3} />
              <span>Confirm {opType === "delete" ? "Deletion" : "Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- BLOCK OPERATION CONFIRMATION ---
  if (isBlockOperation) {
    const opType = action.data.operation;
    const opName =
      opType === "insert_block"
        ? "Insert Content"
        : opType === "replace_block"
          ? "Update Content"
          : opType === "update_table_cell"
            ? "Update Table Cell"
            : "Delete Content";
    const opColor =
      opType === "delete_block"
        ? "text-red-500 bg-red-500/10"
        : "text-blue-500 bg-blue-500/10";
    const Icon =
      opType === "delete_block"
        ? Trash2
        : opType === "insert_block"
          ? FolderPlus
          : opType === "update_table_cell"
            ? Table
            : Edit3;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-pplx-card sm:border border-pplx-border sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-pplx-border bg-pplx-secondary/30 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${opColor}`}>
                    <Icon size={16} />
                  </div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-pplx-text tracking-tight max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                    {opName}
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-pplx-muted pl-1 hidden sm:block">
                  Target Page:{" "}
                  <span className="font-semibold text-pplx-text">{title}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:px-6 sm:py-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col flex-1 min-h-[150px] group">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 shrink-0">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                  <AlignLeft size={12} />{" "}
                  {opType === "delete_block"
                    ? "Content to Remove"
                    : opType === "update_table_cell"
                      ? "New Cell Value"
                      : "Content to Add/Update"}
                </label>
                {opType === "update_table_cell" && (
                  <span className="text-[10px] text-pplx-muted bg-pplx-secondary px-2 py-0.5 rounded-full shrink-0">
                    Row: {action.data.args.rowIndex}, Col:{" "}
                    {action.data.args.colIndex}
                  </span>
                )}
              </div>
              <div className="relative flex flex-col flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={opType === "delete_block"}
                  className={`w-full flex-1 bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl p-3 sm:p-4 min-h-[150px] text-[13px] sm:text-sm text-pplx-text leading-relaxed sm:leading-7 whitespace-pre-wrap font-sans shadow-sm outline-none resize-none transition-all custom-scrollbar placeholder-pplx-muted/50 ${opType === "delete_block" ? "opacity-70 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-5 border-t border-pplx-border bg-pplx-card flex items-center justify-between gap-3 sm:gap-4 shrink-0">
            <button
              onClick={onCancel}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors flex items-center gap-2"
            >
              <X size={16} /> <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={() => onConfirm({ title, content })}
              className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-sm font-bold text-pplx-primary bg-pplx-text hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-pplx-accent/10"
            >
              <Check size={18} strokeWidth={3} />
              <span>
                Confirm {opType === "delete_block" ? "Deletion" : "Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT PAGE CONFIRMATION ---
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-pplx-card sm:border border-pplx-border sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col">
        {/* Header - Structured Info */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-pplx-border bg-pplx-secondary/30 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`p-1.5 rounded-lg ${isUpdate ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"}`}
                >
                  {isUpdate ? <Edit3 size={16} /> : <FileText size={16} />}
                </div>
                <h2 className="text-[15px] sm:text-lg font-bold text-pplx-text tracking-tight max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                  {isUpdate ? "Update Existing Page" : "Create New Page"}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-pplx-muted pl-1 hidden sm:block">
                Review and modify the content before saving to your library.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-pplx-muted bg-pplx-primary border border-pplx-border px-2 py-1 rounded-md shrink-0">
              <span className="uppercase tracking-wider hidden sm:inline">Storage:</span>
              <span className="text-pplx-text font-bold">Library</span>
            </div>
          </div>
        </div>

        {/* Editable Body */}
        <div className="p-4 sm:px-6 sm:py-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 sm:gap-6">
          {/* Title Input */}
          <div className="group shrink-0">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                <Type size={12} /> Page Title
              </label>
              <span className="text-[10px] text-pplx-muted opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                Editable
              </span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-base sm:text-lg font-semibold text-pplx-text shadow-sm outline-none transition-all placeholder-pplx-muted/50"
              placeholder="Enter page title..."
            />
          </div>

          {/* Content Textarea */}
          <div className="flex flex-col flex-1 min-h-[150px] group">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 shrink-0">
              <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1">
                <AlignLeft size={12} /> Content Body
              </label>
              <span className="text-[10px] text-pplx-muted bg-pplx-secondary px-2 py-0.5 rounded-full shrink-0">
                ~{wordCount} words
              </span>
            </div>
            <div className="relative flex flex-col flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 bg-pplx-input border border-transparent focus:border-pplx-accent hover:border-pplx-border rounded-xl p-3 sm:p-4 min-h-[150px] sm:min-h-[250px] text-[13px] sm:text-sm text-pplx-text leading-relaxed sm:leading-7 whitespace-pre-wrap font-sans shadow-sm outline-none resize-none transition-all custom-scrollbar placeholder-pplx-muted/50"
                placeholder="Page content..."
              />
            </div>
          </div>

          {/* Warning / Info Box */}
          <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-pplx-secondary/50 border border-pplx-border/50 shrink-0">
            <AlertCircle
              size={14}
              className="text-pplx-accent shrink-0 sm:mt-0.5"
            />
            <p className="text-[11px] sm:text-xs text-pplx-muted leading-relaxed">
              This action will{" "}
              {isUpdate ? "append data to" : "create a new entry in"} your
              personal knowledge base. You can further edit this page later in
              the <strong>Library</strong> view.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:px-6 sm:py-5 border-t border-pplx-border bg-pplx-card flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover transition-colors flex items-center gap-2"
          >
            <X size={16} /> <span className="hidden sm:inline">Cancel</span>
          </button>
          <button
            onClick={() => onConfirm({ title, content })}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-sm font-bold text-pplx-primary bg-pplx-text hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-pplx-accent/10"
          >
            <Check size={18} strokeWidth={3} />
            <span>Confirm Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
