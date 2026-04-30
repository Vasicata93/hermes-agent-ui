import React, { useState, useEffect, useRef } from "react";
import {
  Library,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  MessageSquareText,
  Plus,
  Trash2,
  MoreHorizontal,
  Copy,
  FolderInput,
  ChevronLeft,
  Star,
  PanelLeftClose,
  SquarePen,
} from "lucide-react";
import { UI_STRINGS } from "../constants";
import { Thread, Space, Note, UserProfile } from "../types";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  threads: Thread[];
  spaces: Space[];
  notes: Note[];
  userProfile: UserProfile;
  activeThreadId: string | null;
  activeSpaceId: string | null;
  activeNoteId: string | null;
  activeView: "chat" | "library" | "calendar" | "search" | "portfolio" | "dashboard" | "tasks" | "trash" | "agent";
  onSelectThread: (id: string) => void;
  onSelectSpace: (id: string | null) => void; // null = home/default
  onSelectNote: (id: string) => void;
  onChangeView: (
    view: "chat" | "library" | "calendar" | "search" | "portfolio" | "dashboard" | "tasks" | "trash" | "agent",
  ) => void;
  onNewThread: () => void;
  onNewNote: (parentId?: string) => void;
  onNewSpace: (parentId?: string) => void;
  onOpenSpaceFiles?: (id: string) => void;
  onNewPortfolioTracker?: () => void;
  onNewSafeDigital?: () => void;
  onManageSpaces: (id?: string) => void;
  onDuplicateSpace: (id: string) => void;
  onDeleteSpace: (id: string) => void;
  openSettings: (tab?: string) => void;
  onDeleteThread: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onMoveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  showFavorites?: boolean;
  setShowFavorites?: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  sidebarWidth,
  setSidebarWidth,
  threads,
  spaces,
  notes,
  userProfile,
  activeThreadId,
  activeSpaceId,
  activeNoteId,
  activeView,
  onSelectThread,
  onSelectSpace,
  onSelectNote,
  onChangeView,
  onNewThread,
  onNewNote,
  onNewSpace,
  onOpenSpaceFiles,
  onNewPortfolioTracker,
  onNewSafeDigital,
  onManageSpaces,
  onDuplicateSpace,
  onDeleteSpace,
  openSettings,
  onDeleteThread,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  setSidebarOpen,
  expandedSection,
  setExpandedSection,
  showFavorites,
  setShowFavorites,
}) => {
  const [lang, setLang] = useState<"en" | "ro">("en");
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // State for Library Item Menu
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [activeMenuSpaceId, setActiveMenuSpaceId] = useState<string | null>(
    null,
  );
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when active
  useEffect(() => {
    if (activeView === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeView]);
  const spaceMenuRef = useRef<HTMLDivElement>(null);

  // Swipe to Close Logic
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    // If swipe is from right to left (deltaX < -50) and it's horizontal
    if (deltaX < -50 && Math.abs(deltaX) > deltaY) {
      setSidebarOpen(false);
    }
  };

  // State for Mobile Library Full Screen
  const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);
  const [mobileLibraryFilter, setMobileLibraryFilter] = useState<
    "all" | "favorites"
  >("all");

  // Effect to handle showFavorites prop
  useEffect(() => {
    if (showFavorites && setShowFavorites) {
      if (window.innerWidth < 768) {
        setIsMobileLibraryOpen(true);
        setMobileLibraryFilter("favorites");
      } else {
        setExpandedSection("library");
      }
      // Reset the trigger after handling
      setShowFavorites(false);
    }
  }, [showFavorites, setShowFavorites, setExpandedSection]);

  // Close mobile library when navigating away from library view or to a specific note
  useEffect(() => {
    if (activeView !== "library" || activeNoteId !== null) {
      setIsMobileLibraryOpen(false);
    }
  }, [activeView, activeNoteId]);

  // Listen to settings changes for language (hacky way to update without full context)
  useEffect(() => {
    const saved = localStorage.getItem("pplx_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.interfaceLanguage) setLang(parsed.interfaceLanguage);
    }
  }, [isOpen]); // Update when sidebar opens/closes

  const t = UI_STRINGS[lang] || UI_STRINGS.en;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuNoteId(null);
      }
      if (
        spaceMenuRef.current &&
        !spaceMenuRef.current.contains(event.target as Node)
      ) {
        setActiveMenuSpaceId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Support both left (0) and right (2) click for resizing as per user request
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth = e.clientX;

      // Allow shrinking completely (to 0) or to icons-only range (46px to 70px)
      if (newWidth < 30) {
        newWidth = 0;
      } else if (newWidth < 100) {
        // Flexible icons-only width between 46px and 70px
        newWidth = Math.max(46, Math.min(newWidth, 70));
      }

      if (newWidth > 600) newWidth = 600;

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.cursor = "default";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    // Auto-collapse logic removed as per user request
    return () => {};
  }, []);

  const currentWidth = sidebarWidth;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[150] bg-pplx-sidebar border-r border-pplx-border shadow-2xl h-full
    w-[280px] md:relative md:shadow-none md:translate-x-0
    ${isOpen ? "translate-x-0 md:w-[var(--sidebar-width)]" : "-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden"}
    flex flex-col
    ${!isResizing ? "transition-all duration-150 cubic-bezier(0.4, 0, 0.2, 1)" : ""}
  `;

  const handleNavClick = (action?: () => void) => {
    if (action) action();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Generate User Initials
  const getUserInitials = (name: string) => {
    return name ? name.substring(0, 1).toUpperCase() : "U";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] md:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={sidebarClasses}
        style={
          { "--sidebar-width": `${currentWidth}px` } as React.CSSProperties
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-pplx-accent/50 transition-colors z-50 hidden md:block"
        />

        <div className="h-full flex flex-col overflow-hidden w-[280px] md:w-[var(--sidebar-width)]">
          {/* Top User Section */}
          <div className={`py-4 px-2 shrink-0`}>
            <div
              className={`text-sm text-pplx-muted hover:text-pplx-text flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-2"} py-2 rounded-lg transition-colors group`}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openSettings("profile");
                }}
                className={`flex items-center cursor-pointer active:scale-95 hover:bg-pplx-hover p-1 rounded-md ${isCollapsed ? "justify-center w-full" : "flex-1"} transition-colors`}
              >
                {isCollapsed ? (
                  <div className="w-10 h-10 rounded-full bg-pplx-secondary flex items-center justify-center text-pplx-text text-sm font-bold shrink-0">
                    {getUserInitials(userProfile.name)}
                  </div>
                ) : (
                  <div className="flex flex-col truncate pl-1 w-full">
                    <span className="font-serif font-light tracking-tight text-pplx-text group-hover:text-pplx-text text-[26px] leading-tight truncate">
                      {userProfile.name || "Agent"}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    } else {
                      setSidebarWidth(0);
                    }
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-pplx-hover text-pplx-muted transition-colors active:scale-90"
                  title="Close Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Main Nav */}
          <nav
            className={`flex-1 overflow-y-auto no-scrollbar py-2 ${isCollapsed ? "px-1" : "px-3"} space-y-1 overscroll-contain`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Chat (History) */}
            <div className="flex flex-col">
              <div className="flex flex-col w-full group relative">
                <NavItem
                  icon={<MessageSquareText size={20} />}
                  label={t.chat}
                  onClick={() => {
                    toggleSection("chat");
                    onChangeView("chat");
                  }}
                  isOpen={expandedSection === "chat"}
                  active={
                    activeView === "chat" &&
                    (!!activeThreadId || expandedSection === "chat")
                  }
                  isCollapsed={isCollapsed}
                />
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeView("chat");
                      onNewThread();
                      if (expandedSection !== "chat") toggleSection("chat");
                    }}
                    className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors absolute right-2 top-1 active:scale-90"
                    title="New Conversation"
                  >
                    <SquarePen size={16} />
                  </button>
                )}
              </div>

              {expandedSection === "chat" && !isCollapsed && (
                <div className="ml-4 pl-2.5 border-l border-pplx-border space-y-0.5 mt-0.5 animate-fadeIn duration-150">
                  {threads.filter((t) => !t.spaceId).length === 0 && (
                    <div className="px-2 py-1.5 text-[10px] text-pplx-muted">
                      {t.noHistory}
                    </div>
                  )}
                  {threads
                    .filter((t) => !t.spaceId)
                    .slice(0, 10)
                    .map((thread) => (
                      <div
                        key={thread.id}
                        className="relative group flex items-center"
                      >
                        <button
                          onClick={() =>
                            handleNavClick(() => {
                              onChangeView("chat");
                              onSelectThread(thread.id);
                            })
                          }
                          className={`w-full text-left flex items-start space-x-2 px-2 py-2 text-xs rounded-lg transition-colors leading-normal pr-7 ${
                            activeThreadId === thread.id
                              ? "bg-pplx-hover text-pplx-text font-medium"
                              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
                          }`}
                        >
                          <span className="truncate text-sm">
                            {thread.title}
                          </span>
                        </button>
                        {/* Discrete Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="absolute right-1.5 p-1 text-pplx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-pplx-hover active:scale-90"
                          title="Delete chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            
            {/* Spaces Accordion (Moved above Library) */}
            <div
              className={`flex flex-col ${activeMenuSpaceId ? "z-[110] relative pointer-events-none" : ""}`}
            >
              <div className="flex items-center w-full group relative">
                <NavItem
                  icon={<LayoutGrid size={20} />}
                  label={t.spaces}
                  onClick={() => toggleSection("spaces")}
                  hasChevron={!isCollapsed}
                  isOpen={expandedSection === "spaces"}
                  active={!!activeSpaceId}
                  isCollapsed={isCollapsed}
                />
                {/* Inline Plus Button for New Space */}
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewSpace();
                      if (expandedSection !== "spaces") toggleSection("spaces");
                    }}
                    className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors opacity-0 group-hover:opacity-100 absolute right-7 active:scale-90"
                    title="New Space"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {expandedSection === "spaces" && !isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-1 animate-fadeIn duration-150 relative">
                  {spaces
                    .filter((s) => !s.parentId)
                    .map((space) => (
                      <SpaceItem
                        key={space.id}
                        space={space}
                        allSpaces={spaces}
                        activeSpaceId={activeSpaceId}
                        onSelectSpace={(id: string | null) =>
                          handleNavClick(() => {
                            onChangeView("chat");
                            onSelectSpace(id);
                          })
                        }
                        onDuplicateSpace={onDuplicateSpace}
                        onDeleteSpace={onDeleteSpace}
                        onEditSpace={onManageSpaces}
                        onOpenSpaceFiles={onOpenSpaceFiles}
                        activeMenuSpaceId={activeMenuSpaceId}
                        setActiveMenuSpaceId={setActiveMenuSpaceId}
                        menuRef={spaceMenuRef}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Library (Pages/Notes) */}
            <div
              className={`flex flex-col ${activeMenuNoteId ? "z-[110] relative pointer-events-none" : ""}`}
            >
              <div className="flex items-center w-full group relative">
                <NavItem
                  icon={<Library size={20} />}
                  label={t.library}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsMobileLibraryOpen(true);
                      setMobileLibraryFilter("all");
                    } else {
                      toggleSection("library");
                    }
                  }}
                  onChevronClick={() => toggleSection("library")}
                  hasChevron={!isCollapsed}
                  isOpen={expandedSection === "library"}
                  active={activeView === "library"}
                  isCollapsed={isCollapsed}
                />
                {/* Inline Plus Button for New Page */}
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewNote();
                      toggleSection("library");
                    }}
                    className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-md transition-colors opacity-0 group-hover:opacity-100 absolute right-7 active:scale-90"
                    title="New Page"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {expandedSection === "library" && !isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-1 animate-fadeIn duration-150 relative">
                  {/* Favorites Section */}
                  {notes.some((n) => n.isFavorite) && (
                    <div className="mb-3 mt-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-pplx-muted uppercase tracking-wider flex items-center gap-1.5 opacity-70">
                        <Star
                          size={10}
                          className="text-yellow-400 fill-yellow-400"
                        />{" "}
                        Favorites
                      </div>
                      {notes
                        .filter((n) => n.isFavorite)
                        .map((note) => (
                          <NoteItem
                            key={`fav-${note.id}`}
                            note={note}
                            allNotes={notes}
                            activeNoteId={activeNoteId}
                            onSelectNote={(id: string) =>
                              handleNavClick(() => onSelectNote(id))
                            }
                            onDuplicateNote={onDuplicateNote}
                            onMoveNote={onMoveNote}
                            onDeleteNote={onDeleteNote}
                            onNewNote={onNewNote}
                            activeMenuNoteId={activeMenuNoteId}
                            setActiveMenuNoteId={setActiveMenuNoteId}
                            menuRef={menuRef}
                          />
                        ))}
                      <div className="h-px bg-pplx-border/50 my-2 mx-3" />
                    </div>
                  )}

                  {notes.filter((n) => !n.parentId).length === 0 && (
                    <div className="px-3 py-2 text-xs text-pplx-muted italic">
                      {t.noPages}
                    </div>
                  )}
                  {notes
                    .filter((n) => !n.parentId)
                    .map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        allNotes={notes}
                        activeNoteId={activeNoteId}
                        onSelectNote={(id: string) =>
                          handleNavClick(() => onSelectNote(id))
                        }
                        onDuplicateNote={onDuplicateNote}
                        onMoveNote={onMoveNote}
                        onDeleteNote={onDeleteNote}
                        onNewNote={onNewNote}
                        activeMenuNoteId={activeMenuNoteId}
                        setActiveMenuNoteId={setActiveMenuNoteId}
                        menuRef={menuRef}
                      />
                    ))}
                  {onNewPortfolioTracker && (
                    <div className="mt-4 mb-2 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTemplatesOpen(!isTemplatesOpen);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-pplx-muted uppercase tracking-wider hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors text-left group/templates"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={12} className="text-pplx-accent" />
                          <span>Templates</span>
                        </div>
                        {isTemplatesOpen ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </button>

                      {isTemplatesOpen && (
                        <div className="mt-1 ml-1 space-y-0.5 animate-fadeIn duration-150">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNewPortfolioTracker && onNewPortfolioTracker();
                              setExpandedSection("library");
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors text-left"
                          >
                            <LayoutGrid
                              size={14}
                              className="text-pplx-accent"
                            />{" "}
                            Portfolio
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNewSafeDigital && onNewSafeDigital();
                              setExpandedSection("library");
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-lg transition-colors text-left"
                          >
                            <LayoutGrid
                              size={14}
                              className="text-pplx-accent"
                            />{" "}
                            Safe Digital
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Area (Recycle Bin) */}
          <div
            className={`pb-4 ${isCollapsed ? "flex flex-col items-center px-1" : "px-3"} space-y-1 shrink-0 bg-pplx-sidebar pt-2`}
          >
            <NavItem
              icon={<Trash2 size={20} />}
              label="Recycle Bin"
              active={activeView === "trash"}
              onClick={() => {
                handleNavClick(() => {
                  onChangeView("trash");
                });
              }}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </div>
      {/* Mobile Full-Screen Library Modal */}
      {isMobileLibraryOpen && (
        <div className="fixed inset-0 z-[100] bg-pplx-sidebar flex flex-col md:hidden animate-in slide-in-from-bottom-4 duration-150 overflow-x-hidden">
          <div className="flex items-center justify-between p-4 shrink-0">
            <button
              onClick={() => setIsMobileLibraryOpen(false)}
              className="p-2 text-pplx-text hover:bg-pplx-hover rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-medium tracking-tight text-pplx-text font-serif">
              {mobileLibraryFilter === "favorites" ? "Favorites" : "Pages"}
            </h2>
            <button
              onClick={() => {
                onNewNote();
                setIsMobileLibraryOpen(false);
              }}
              className="p-2 text-pplx-text hover:bg-pplx-hover rounded-full transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            {/* Recents Section */}
            {mobileLibraryFilter === "all" && (
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium text-pplx-muted mb-3">
                  Recents
                </h3>
                <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 pl-8 pr-4 no-scrollbar snap-x">
                  {[...notes]
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 5)
                    .map((note) => (
                      <div
                        key={note.id}
                        onClick={() => {
                          onSelectNote(note.id);
                          setIsMobileLibraryOpen(false);
                        }}
                        className="flex-shrink-0 w-24 h-24 bg-pplx-card border border-pplx-border rounded-xl overflow-hidden relative snap-start cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className="h-1/2 w-full bg-gradient-to-br from-pplx-secondary to-pplx-border relative">
                          {note.cover && (
                            <img
                              src={note.cover}
                              alt=""
                              className="w-full h-full object-cover opacity-80"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl drop-shadow-md">
                              {note.emoji || "📄"}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 h-1/2 flex flex-col justify-between">
                          <span className="text-xs font-medium text-pplx-text line-clamp-2 leading-tight">
                            {note.title || "Untitled"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Favorites Section Mobile */}
            {notes.some((n) => n.isFavorite) ? (
              <div className="px-2 mb-4">
                <div className="px-3 py-2 text-xs font-bold text-pplx-muted uppercase tracking-wider flex items-center gap-1.5 opacity-70">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />{" "}
                  Favorites
                </div>
                {notes
                  .filter((n) => n.isFavorite)
                  .map((note) => (
                    <NoteItem
                      key={`fav-mobile-${note.id}`}
                      note={note}
                      allNotes={notes}
                      activeNoteId={activeNoteId}
                      onSelectNote={(id: string) => {
                        onSelectNote(id);
                        setIsMobileLibraryOpen(false);
                      }}
                      onDuplicateNote={onDuplicateNote}
                      onMoveNote={onMoveNote}
                      onDeleteNote={onDeleteNote}
                      onNewNote={(parentId?: string) => {
                        onNewNote(parentId);
                        setIsMobileLibraryOpen(false);
                      }}
                      activeMenuNoteId={activeMenuNoteId}
                      setActiveMenuNoteId={setActiveMenuNoteId}
                      menuRef={menuRef}
                      isMobile={true}
                    />
                  ))}
                {mobileLibraryFilter === "all" && (
                  <div className="h-px bg-pplx-border/50 my-2 mx-3" />
                )}
              </div>
            ) : (
              mobileLibraryFilter === "favorites" && (
                <div className="px-4 py-12 text-center animate-fadeIn">
                  <Star size={48} className="mx-auto text-pplx-muted/20 mb-4" />
                  <p className="text-pplx-muted text-sm">
                    No favorite pages yet.
                  </p>
                </div>
              )
            )}

            {/* All Pages Section */}
            {mobileLibraryFilter === "all" && (
              <div className="px-2">
                {notes.filter((n) => !n.parentId).length === 0 && (
                  <div className="px-3 py-4 text-sm text-pplx-muted italic text-center">
                    No pages yet. Create one to get started!
                  </div>
                )}
                {notes
                  .filter((n) => !n.parentId)
                  .map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      allNotes={notes}
                      activeNoteId={activeNoteId}
                      onSelectNote={(id: string) => {
                        onSelectNote(id);
                        setIsMobileLibraryOpen(false);
                      }}
                      onDuplicateNote={onDuplicateNote}
                      onMoveNote={onMoveNote}
                      onDeleteNote={onDeleteNote}
                      onNewNote={(parentId?: string) => {
                        onNewNote(parentId);
                        setIsMobileLibraryOpen(false);
                      }}
                      activeMenuNoteId={activeMenuNoteId}
                      setActiveMenuNoteId={setActiveMenuNoteId}
                      menuRef={menuRef}
                      isMobile={true}
                    />
                  ))}
                {onNewPortfolioTracker && (
                  <div className="mt-6 mb-4 px-3">
                    <button
                      onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                      className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-pplx-muted uppercase tracking-wider mb-2 hover:bg-pplx-hover rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid size={14} className="text-pplx-accent" />
                        <span>Templates</span>
                      </div>
                      {isTemplatesOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>

                    {isTemplatesOpen && (
                      <div className="space-y-2 animate-fadeIn duration-150">
                        <button
                          onClick={() => {
                            onNewPortfolioTracker && onNewPortfolioTracker();
                            setSidebarOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-xl transition-colors text-left border border-pplx-border/50"
                        >
                          <LayoutGrid size={16} className="text-pplx-accent" />{" "}
                          Portfolio
                        </button>
                        <button
                          onClick={() => {
                            onNewSafeDigital && onNewSafeDigital();
                            setSidebarOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-xl transition-colors text-left border border-pplx-border/50"
                        >
                          <LayoutGrid size={16} className="text-pplx-accent" />{" "}
                          Safe Digital
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {(activeMenuNoteId || activeMenuSpaceId) && (
        <div
          className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setActiveMenuNoteId(null);
            setActiveMenuSpaceId(null);
          }}
        />
      )}
    </>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  onClick,
  onChevronClick,
  hasChevron = false,
  isOpen = false,
  isCollapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onChevronClick?: () => void;
  hasChevron?: boolean;
  isOpen?: boolean;
  isCollapsed?: boolean;
}) => (
  <div
    className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-1.5"} py-0.5 rounded-lg text-sm transition-colors group relative ${
      active ? "bg-pplx-hover" : "hover:bg-pplx-hover"
    }`}
  >
    <button
      onClick={onClick}
      className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-2.5 px-1"} flex-1 text-left py-2 active:scale-[0.98]`}
    >
      <span
        className={`${active ? "text-pplx-accent" : "text-pplx-muted group-hover:text-pplx-text"} flex items-center justify-center w-8 shrink-0`}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span
          className={`flex-1 text-sm ${active ? "text-pplx-text font-medium" : "text-pplx-muted group-hover:text-pplx-text"} truncate`}
        >
          {label}
        </span>
      )}
    </button>
    {hasChevron && !isCollapsed && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onChevronClick) onChevronClick();
          else if (onClick) onClick();
        }}
        className="text-pplx-muted transition-opacity p-1.5 hover:bg-pplx-secondary rounded-md active:scale-90"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
    )}
  </div>
);

// Space Item Component for Sidebar
const SpaceItem = ({
  space,
  allSpaces,
  level = 0,
  activeSpaceId,
  onSelectSpace,
  onDuplicateSpace,
  onDeleteSpace,
  onEditSpace,
  onOpenSpaceFiles,
  activeMenuSpaceId,
  setActiveMenuSpaceId,
  menuRef,
  isMobile = false,
}: any) => {
  const children = allSpaces.filter((s: Space) => s.parentId === space.id);
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative group flex items-center w-full ${activeMenuSpaceId === space.id ? "z-[100]" : "z-0"}`}
      >
        {/* Chevron */}
        <div className="w-6 flex justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <button
          onClick={() => onSelectSpace(space.id)}
          className={`flex-1 min-w-0 flex items-center space-x-2 py-2 pr-14 rounded-lg text-xs transition-colors text-left active:scale-[0.98] ${
            activeSpaceId === space.id
              ? "bg-pplx-hover text-pplx-text font-medium"
              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
          }`}
        >
          <span className="text-base leading-none shrink-0">
            {space.emoji || "📁"}
          </span>
          <span className="truncate text-sm flex-1">
            {space.title || "Untitled"}
          </span>
        </button>

        <div
          className={`absolute right-1 flex items-center ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {/* Plus Button for Uploading/Managing Files */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSpaceFiles) onOpenSpaceFiles(space.id);
            }}
            className="p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90"
            title="Upload Files"
          >
            <Plus size={16} />
          </button>

          {/* Discrete More Options Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuSpaceId(
                activeMenuSpaceId === space.id ? null : space.id,
              );
            }}
            className={`p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90 ${activeMenuSpaceId === space.id ? "bg-pplx-hover text-pplx-text" : ""}`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Popup Menu for Space Items */}
        {activeMenuSpaceId === space.id && (
          <div
            ref={menuRef}
            className="absolute right-8 top-8 z-[120] w-40 border border-pplx-border shadow-2xl rounded-lg overflow-hidden animate-fadeIn duration-150 bg-white dark:bg-[#191a1a] pointer-events-auto"
            style={{ opacity: 1 }}
          >
            <div className="flex flex-col py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Settings size={12} /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Copy size={12} /> Duplicate
              </button>
              <div className="h-px bg-pplx-border/50 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSpace(space.id);
                  setActiveMenuSpaceId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-pplx-hover text-left"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-3 border-l border-pplx-border/50 pl-1 flex flex-col">
          {children.map((child: Space) => (
            <SpaceItem
              key={child.id}
              space={child}
              allSpaces={allSpaces}
              level={level + 1}
              activeSpaceId={activeSpaceId}
              onSelectSpace={onSelectSpace}
              onDuplicateSpace={onDuplicateSpace}
              onDeleteSpace={onDeleteSpace}
              onEditSpace={onEditSpace}
              onOpenSpaceFiles={onOpenSpaceFiles}
              activeMenuSpaceId={activeMenuSpaceId}
              setActiveMenuSpaceId={setActiveMenuSpaceId}
              menuRef={menuRef}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NoteItem = ({
  note,
  allNotes,
  level = 0,
  activeNoteId,
  onSelectNote,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  onNewNote,
  activeMenuNoteId,
  setActiveMenuNoteId,
  menuRef,
  isMobile = false,
}: any) => {
  const children = allNotes.filter((n: Note) => n.parentId === note.id);
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative group flex items-center w-full ${activeMenuNoteId === note.id ? "z-[100]" : "z-0"}`}
      >
        {/* Chevron */}
        <div className="w-6 flex justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-secondary rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <button
          onClick={() => onSelectNote(note.id)}
          className={`flex-1 min-w-0 flex items-center space-x-2 py-2 pr-14 rounded-lg text-xs transition-colors text-left active:scale-[0.98] ${
            activeNoteId === note.id
              ? "bg-pplx-hover text-pplx-text font-medium"
              : "text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
          }`}
        >
          <span className="text-base leading-none shrink-0">
            {note.emoji || "📄"}
          </span>
          <span className="truncate text-sm flex-1">
            {note.title || "Untitled"}
          </span>
        </button>

        <div
          className={`absolute right-1 flex items-center ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {/* Plus Button for Nested Page */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNewNote) onNewNote(note.id);
              setIsExpanded(true);
            }}
            className="p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90"
          >
            <Plus size={16} />
          </button>

          {/* Discrete More Options Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuNoteId(
                activeMenuNoteId === note.id ? null : note.id,
              );
            }}
            className={`p-1.5 text-pplx-muted hover:text-pplx-text rounded-md hover:bg-pplx-hover shrink-0 active:scale-90 ${activeMenuNoteId === note.id ? "bg-pplx-hover text-pplx-text" : ""}`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Popup Menu for Library Items */}
        {activeMenuNoteId === note.id && (
          <div
            ref={menuRef}
            className="absolute right-8 top-8 z-[120] w-40 border border-pplx-border shadow-2xl rounded-lg overflow-hidden animate-fadeIn duration-150 bg-white dark:bg-[#191a1a] pointer-events-auto"
            style={{ opacity: 1 }}
          >
            <div className="flex flex-col py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-pplx-text hover:bg-pplx-hover text-left"
              >
                <FolderInput size={12} /> Move
              </button>
              <div className="h-px bg-pplx-border/50 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                  setActiveMenuNoteId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-pplx-hover text-left"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-3 border-l border-pplx-border/50 pl-1 flex flex-col">
          {children.map((child: Note) => (
            <NoteItem
              key={child.id}
              note={child}
              allNotes={allNotes}
              level={level + 1}
              activeNoteId={activeNoteId}
              onSelectNote={onSelectNote}
              onDuplicateNote={onDuplicateNote}
              onMoveNote={onMoveNote}
              onDeleteNote={onDeleteNote}
              onNewNote={onNewNote}
              activeMenuNoteId={activeMenuNoteId}
              setActiveMenuNoteId={setActiveMenuNoteId}
              menuRef={menuRef}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
