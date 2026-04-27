import React, { useState } from "react";
import {
  Headphones,
  Eye,
  MoreHorizontal,
  Share2,
  Copy,
  Square,
  FolderPlus,
} from "lucide-react";
import { Tooltip } from "./Tooltip";

interface ModelMessageActionsProps {
  onTTS: () => void;
  isPlayingAudio: boolean;
  onDashboard: () => void;
  onCopy: () => void;
  onShare: () => void;
  onSave: () => void;
}

export const ModelMessageActions: React.FC<ModelMessageActionsProps> = ({
  onTTS,
  isPlayingAudio,
  onDashboard,
  onCopy,
  onShare,
  onSave,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const actionButtonClass =
    "p-1.5 rounded-full transition-all duration-300 text-pplx-muted hover:text-pplx-text bg-transparent hover:bg-pplx-hover";

  return (
    <div className="flex items-center space-x-1 relative z-20 shrink-0 ml-2">
      <button
        onClick={onTTS}
        onMouseEnter={() => setHoveredTooltip("tts")}
        onMouseLeave={() => setHoveredTooltip(null)}
        className={`${actionButtonClass} ${isPlayingAudio ? "!text-red-500 !bg-red-500/10" : ""} relative`}
      >
        {isPlayingAudio ? (
          <Square size={16} fill="currentColor" />
        ) : (
          <Headphones size={16} />
        )}
        {hoveredTooltip === "tts" && (
          <Tooltip text="Read Aloud" position="bottom" />
        )}
      </button>
      
      <button
        onClick={onDashboard}
        onMouseEnter={() => setHoveredTooltip("dashboard")}
        onMouseLeave={() => setHoveredTooltip(null)}
        className={`${actionButtonClass} relative`}
      >
        <Eye size={16} />
        {hoveredTooltip === "dashboard" && (
          <Tooltip text="View Dashboard" position="bottom" />
        )}
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          onMouseEnter={() => setHoveredTooltip("more")}
          onMouseLeave={() => setHoveredTooltip(null)}
          className={`${actionButtonClass} relative`}
        >
          <MoreHorizontal size={16} />
          {hoveredTooltip === "more" && !showMenu && (
            <Tooltip text="More Actions" position="bottom" />
          )}
        </button>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute left-0 mt-1 w-32 bg-pplx-card border border-pplx-border rounded-xl shadow-xl z-40 py-1 animate-fadeIn">
              <button
                onClick={() => {
                  onCopy();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2"
              >
                <Copy size={12} /> Copy
              </button>
              <button
                onClick={() => {
                  onShare();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2"
              >
                <Share2 size={12} /> Share
              </button>
              <button
                onClick={() => {
                  onSave();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover flex items-center gap-2"
              >
                <FolderPlus size={12} /> Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
