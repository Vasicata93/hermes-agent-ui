import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  FileText,
  Upload,
  Save,
  MoreHorizontal,
} from "lucide-react";
import { Space, Attachment } from "../types";

interface SpacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: Space[];
  onSaveSpace: (space: Space) => void;
  onDeleteSpace: (id: string) => void;
  initialSpaceId?: string | null;
  initialParentId?: string | null;
}

export const SpacesModal: React.FC<SpacesModalProps> = ({
  isOpen,
  onClose,
  spaces,
  onSaveSpace,
  onDeleteSpace,
  initialSpaceId,
  initialParentId,
}) => {
  const [editingSpace, setEditingSpace] = useState<Partial<Space> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize editing space from prop when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSpaceId === "new") {
        handleCreateNew(initialParentId || undefined);
      } else if (initialSpaceId) {
        const spaceToEdit = spaces.find((s) => s.id === initialSpaceId);
        if (spaceToEdit) {
          setEditingSpace({ ...spaceToEdit });
        }
      }
    } else if (!isOpen) {
      setEditingSpace(null);
    }
  }, [isOpen, initialSpaceId, initialParentId, spaces]);

  // Auto-focus title when entering edit mode or switching spaces
  useEffect(() => {
    if (editingSpace && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingSpace?.id]);

  if (!isOpen) return null;

  const handleCreateNew = (parentId?: string) => {
    setEditingSpace({
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      emoji: "📁",
      description: "",
      systemInstructions: "",
      files: [],
      createdAt: Date.now(),
      parentId,
    });
  };

  const handleEdit = (space: Space) => {
    setEditingSpace({ ...space });
  };

  const handleSave = () => {
    if (editingSpace && editingSpace.title) {
      onSaveSpace(editingSpace as Space);
      setEditingSpace(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const newFile: Attachment = {
            type: "text", // Assuming text/code files for context usually
            content: reader.result as string,
            mimeType: file.type,
            name: file.name,
          };
          setEditingSpace((prev) =>
            prev
              ? {
                  ...prev,
                  files: [...(prev.files || []), newFile],
                }
              : null,
          );
        };
        reader.readAsText(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setEditingSpace((prev) =>
      prev
        ? {
            ...prev,
            files: prev.files?.filter((_, i) => i !== index),
          }
        : null,
    );
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-0">
      <div className="bg-pplx-sidebar w-full max-w-4xl rounded-xl shadow-2xl border border-pplx-border overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] md:h-[85vh]">
        {/* Left Sidebar: List of Spaces (Hidden on mobile if editing) */}
        <div
          className={`w-full md:w-1/3 border-r border-pplx-border bg-pplx-primary flex-col ${editingSpace ? "hidden md:flex" : "flex"} h-full`}
        >
          <div className="p-4 border-b border-pplx-border flex justify-between items-center shrink-0">
            <h2 className="text-lg font-semibold text-pplx-text">Spaces</h2>
            <button
              onClick={onClose}
              className="md:hidden text-pplx-muted hover:text-pplx-text"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button
              onClick={() => handleCreateNew()}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm text-pplx-accent hover:bg-pplx-hover transition-colors border border-dashed border-pplx-border mb-2"
            >
              <Plus size={16} />
              <span className="font-medium">New Space</span>
            </button>

            {spaces.map((space) => (
              <div
                key={space.id}
                className={`group w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors cursor-pointer ${
                  editingSpace?.id === space.id
                    ? "bg-pplx-hover text-pplx-text"
                    : "text-pplx-muted hover:bg-pplx-secondary hover:text-pplx-text"
                }`}
                onClick={() => handleEdit(space)}
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className="text-lg">{space.emoji}</span>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-medium truncate">{space.title}</span>
                    <span className="text-[10px] opacity-60 truncate">
                      {space.description || "No description"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSpace(space.id);
                  }}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Editor (Hidden on mobile if NOT editing) */}
        <div
          className={`flex-1 bg-pplx-sidebar flex-col h-full relative ${!editingSpace ? "hidden md:flex" : "flex"}`}
        >
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setEditingSpace(null);
              } else {
                onClose();
              }
            }}
            className="absolute top-4 right-4 text-pplx-muted hover:text-pplx-text z-10 bg-pplx-sidebar/80 p-1 rounded-full backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          {editingSpace ? (
            <div className="flex flex-col h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <label className="block text-xs font-semibold text-pplx-muted uppercase tracking-wider mb-2">
                  Space Icon & Name
                </label>
                <div className="flex gap-3">
                  <input
                    className="w-14 h-14 bg-pplx-input border border-pplx-border rounded-lg text-center text-2xl focus:border-pplx-accent outline-none text-pplx-text"
                    value={editingSpace.emoji}
                    onChange={(e) =>
                      setEditingSpace({
                        ...editingSpace,
                        emoji: e.target.value,
                      })
                    }
                    maxLength={2}
                  />
                  <div className="flex-1">
                    <input
                      ref={titleInputRef}
                      className="w-full bg-pplx-input border border-pplx-border rounded-lg px-4 py-3.5 text-pplx-text placeholder-pplx-muted focus:border-pplx-accent outline-none text-lg"
                      placeholder="e.g. Project Alpha, Research, Coding..."
                      value={editingSpace.title}
                      onChange={(e) =>
                        setEditingSpace({
                          ...editingSpace,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-pplx-muted uppercase tracking-wider mb-2">
                  Description
                </label>
                <input
                  className="w-full bg-pplx-input border border-pplx-border rounded-lg px-4 py-3 text-sm text-pplx-text placeholder-pplx-muted focus:border-pplx-accent outline-none"
                  placeholder="Briefly describe what this space is for..."
                  value={editingSpace.description}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-pplx-muted uppercase tracking-wider mb-2">
                  System Instructions
                </label>
                <p className="text-xs text-pplx-muted mb-2">
                  Define how the AI should behave in this space.
                </p>
                <textarea
                  className="w-full h-40 bg-pplx-input border border-pplx-border rounded-lg px-4 py-3 text-sm text-pplx-text placeholder-pplx-muted focus:border-pplx-accent outline-none resize-none"
                  placeholder="You are a senior React engineer. Always prefer functional components..."
                  value={editingSpace.systemInstructions}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      systemInstructions: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-pplx-muted uppercase tracking-wider">
                    Knowledge Base
                  </label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 text-pplx-accent hover:underline"
                  >
                    <Upload size={12} /> Upload File
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-2">
                  {editingSpace.files?.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-pplx-input border border-pplx-border rounded-lg"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-pplx-hover p-2 rounded">
                          <FileText size={16} className="text-pplx-muted" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-medium text-pplx-text truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-pplx-muted uppercase">
                            {file.mimeType.split("/")[1] || "FILE"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-pplx-muted hover:text-red-400 p-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(!editingSpace.files || editingSpace.files.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-pplx-border rounded-lg text-pplx-muted text-sm bg-pplx-input/50">
                      No files uploaded.
                    </div>
                  )}
                </div>
              </div>

              <div
                className="mt-auto flex justify-end pt-4 border-t border-pplx-border shrink-0 transition-all duration-200"
                style={{
                  paddingBottom:
                    document.body.classList.contains("dock-active") &&
                    window.innerWidth < 768
                      ? "calc(80px + env(safe-area-inset-bottom))"
                      : "16px",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={!editingSpace.title}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-medium transition-colors ${
                    editingSpace.title
                      ? "bg-pplx-accent hover:bg-cyan-400 text-black"
                      : "bg-pplx-hover text-pplx-muted cursor-not-allowed"
                  }`}
                >
                  <Save size={18} />
                  <span>Save Space</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-pplx-muted">
              <div className="bg-pplx-hover p-4 rounded-full mb-4">
                <MoreHorizontal size={32} />
              </div>
              <h3 className="text-lg font-medium text-pplx-text mb-2">
                Select a Space to edit
              </h3>
              <p className="text-sm">
                Or create a new one to organize your knowledge.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
