import React, { useState } from "react";
import {
  Home,
  Plus,
  FileText,
  CheckSquare,
  ShoppingCart,
  MoreHorizontal,
  X,
  Search,
  Calendar,
  Folder,
  Star,
} from "lucide-react";
import { Note, AppSettings } from "../types";

interface MobileDockProps {
  visible: boolean;
  onNavigate: (view: string) => void;
  onNewPage: (type?: "page" | "todo" | "shopping") => void;
  notes: Note[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeView: string;
}

export const MobileDock: React.FC<MobileDockProps> = ({
  visible,
  onNavigate,
  onNewPage,
  notes,
  settings,
  onUpdateSettings,
  activeView,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredMenuItemId, setHoveredMenuItemId] = useState<string | null>(
    null,
  );
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // Shortcuts from settings or defaults
  const shortcuts = settings.dockShortcuts || [];

  if (!visible) return null;

  const handlePlusClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTouchStart = (slotIndex: number) => {
    const timer = setTimeout(() => {
      setEditingSlot(slotIndex);
      setShowPagePicker(true);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleHomeClick = () => {
    onNavigate("home_direct");
  };

  const handleShortcutClick = (slotIndex: number) => {
    const noteId = shortcuts[slotIndex];
    if (noteId) {
      onNavigate(noteId);
    } else {
      setEditingSlot(slotIndex);
      setShowPagePicker(true);
    }
  };

  const selectPageForSlot = (noteId: string) => {
    if (editingSlot !== null) {
      const newShortcuts = [...shortcuts];
      // Ensure array has at least 3 slots
      while (newShortcuts.length < 3) newShortcuts.push("");
      newShortcuts[editingSlot] = noteId;
      onUpdateSettings({ dockShortcuts: newShortcuts });
      setShowPagePicker(false);
      setEditingSlot(null);
    }
  };

  const getShortcutIcon = (slotIndex: number) => {
    const noteId = shortcuts[slotIndex];

    if (noteId === "favorites")
      return (
        <Star
          size={18}
          className={
            activeView === "favorites" ? "text-black" : "text-white/60"
          }
          fill={activeView === "favorites" ? "black" : "none"}
        />
      );
    if (noteId === "calendar")
      return (
        <Calendar
          size={18}
          className={activeView === "calendar" ? "text-black" : "text-white/60"}
        />
      );

    const note = notes.find((n) => n.id === noteId);

    if (!note) {
      // Default icons for empty slots as requested: favorites, calendar, folder
      if (slotIndex === 0) return <Star size={18} className="text-white/60" />;
      if (slotIndex === 1)
        return <Calendar size={18} className="text-white/60" />;
      if (slotIndex === 2)
        return <Folder size={18} className="text-white/60" />;
      return <Plus size={16} className="text-white/60" />;
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-xl leading-none">{note.emoji || "📄"}</span>
      </div>
    );
  };

  const menuItems = [
    { id: "page", icon: FileText, label: "Page", color: "bg-blue-500" },
    { id: "todo", icon: CheckSquare, label: "To-Do", color: "bg-green-500" },
    {
      id: "shopping",
      icon: ShoppingCart,
      label: "Shop",
      color: "bg-orange-500",
    },
    { id: "more", icon: MoreHorizontal, label: "More", color: "bg-purple-500" },
  ];

  return (
    <>
      {/* Page Picker Modal */}
      {showPagePicker && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Select Page</h3>
              <button
                onClick={() => setShowPagePicker(false)}
                className="p-2 bg-white/10 rounded-full text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3">
              <div className="relative mb-2">
                <Search
                  className="absolute left-3 top-3 text-white/40"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none border border-white/5 focus:border-white/20"
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {/* Special Items */}
              <button
                onClick={() => selectPageForSlot("favorites")}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <span className="text-xl">⭐</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    Favorites
                  </div>
                </div>
                {shortcuts.includes("favorites") && (
                  <div className="w-2 h-2 rounded-full bg-[#e8dcc4]" />
                )}
              </button>
              <button
                onClick={() => selectPageForSlot("calendar")}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <span className="text-xl">📅</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    Calendar
                  </div>
                </div>
                {shortcuts.includes("calendar") && (
                  <div className="w-2 h-2 rounded-full bg-[#e8dcc4]" />
                )}
              </button>

              <div className="h-px bg-white/10 my-2" />

              {notes
                .filter((n) =>
                  n.title.toLowerCase().includes(pickerSearch.toLowerCase()),
                )
                .map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectPageForSlot(note.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <span className="text-xl">{note.emoji || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {note.title || "Untitled"}
                      </div>
                      <div className="text-xs text-white/40 truncate">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {shortcuts.includes(note.id) && (
                      <div className="w-2 h-2 rounded-full bg-[#e8dcc4]" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Dock Container */}
      <div className="fixed bottom-2 left-0 right-0 z-[110] flex flex-col items-center sm:hidden">
        {/* Black Backdrop Overlay for Menu */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 z-[-1] ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Rainbow Menu (Arc) */}
        <div
          className={`absolute bottom-full mb-6 transition-all duration-150 ${isMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"}`}
        >
          <div className="relative w-64 h-32 flex items-end justify-center">
            {menuItems.map((item, index) => {
              const total = menuItems.length;
              const angle = (180 / (total + 1)) * (index + 1);
              const radian = (angle * Math.PI) / 180;
              const radius = 90;

              const x = -Math.cos(radian) * radius;
              const y = -Math.sin(radian) * radius;

              return (
                <div
                  key={item.id}
                  className="absolute"
                  style={{
                    bottom: "20px",
                    left: "50%",
                    marginLeft: "-24px",
                    transform: `translate(${x * 1.3}px, ${y}px)`,
                  }}
                  onMouseEnter={() => setHoveredMenuItemId(item.id)}
                  onMouseLeave={() => setHoveredMenuItemId(null)}
                >
                  <div
                    className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-150 ${hoveredMenuItemId === item.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                  >
                    {item.label}
                  </div>

                  <button
                    onClick={() => {
                      onNewPage(item.id as any);
                      setIsMenuOpen(false);
                    }}
                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transform transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor:
                        item.color === "bg-blue-500"
                          ? "#3b82f6"
                          : item.color === "bg-green-500"
                            ? "#22c55e"
                            : item.color === "bg-orange-500"
                              ? "#f97316"
                              : "#a855f7",
                    }}
                  >
                    <item.icon size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Dock Bar */}
        <div className="flex items-center gap-2.5 px-4">
          <div className="bg-[#1a1a1a]/60 backdrop-blur-3xl border border-white/10 rounded-full p-1 flex items-center gap-1 shadow-2xl relative overflow-hidden supports-[backdrop-filter]:bg-[#1a1a1a]/40">
            {/* Subtle Dock Shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            {/* Home Button */}
            <button
              onClick={handleHomeClick}
              className={`relative flex items-center justify-center w-[43px] h-[43px] rounded-full transition-all duration-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
                activeView === "home"
                  ? "bg-[#e8dcc4] text-black"
                  : "bg-[#2a2a2a] text-white/70 hover:text-white"
              }`}
            >
              <Home
                size={20}
                strokeWidth={2.5}
                fill={activeView === "home" ? "black" : "none"}
              />
              {/* Button Shine */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
            </button>

            {/* Customizable Slots */}
            {[0, 1, 2].map((slotIndex) => {
              const noteId = shortcuts[slotIndex];
              const isActive = activeView === noteId && noteId !== "";
              return (
                <button
                  key={slotIndex}
                  onClick={() => handleShortcutClick(slotIndex)}
                  onTouchStart={() => handleTouchStart(slotIndex)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(slotIndex)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  className={`relative flex items-center justify-center w-[38px] h-[38px] rounded-full transition-all duration-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
                    isActive
                      ? "bg-[#e8dcc4] text-black"
                      : "bg-[#2a2a2a] text-white/70 hover:text-white"
                  }`}
                >
                  {getShortcutIcon(slotIndex)}
                  {/* Button Shine */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                </button>
              );
            })}
          </div>

          {/* Plus Button */}
          <button
            onClick={handlePlusClick}
            className={`relative w-[43px] h-[43px] bg-[#e8dcc4] text-black rounded-full flex items-center justify-center shadow-lg transform transition-all duration-150 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] ${isMenuOpen ? "rotate-45" : "active:scale-90"}`}
          >
            <Plus size={24} strokeWidth={2.5} />
            {/* Button Shine */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
          </button>
        </div>
      </div>
    </>
  );
};
