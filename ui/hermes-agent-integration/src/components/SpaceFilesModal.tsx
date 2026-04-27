import React, { useState, useRef } from "react";
import { X, Upload, FileText, Trash2, Save } from "lucide-react";
import { Space, Attachment } from "../types";

interface SpaceFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  onUpdateSpace: (updatedSpace: Space) => void;
}

export const SpaceFilesModal: React.FC<SpaceFilesModalProps> = ({
  isOpen,
  onClose,
  space,
  onUpdateSpace,
}) => {
  const [files, setFiles] = useState<Attachment[]>(space.files || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const newAttachment: Attachment = {
            type: "text",
            content: reader.result as string,
            mimeType: file.type,
            name: file.name,
          };
          setFiles((prev) => [...prev, newAttachment]);
        };
        reader.readAsText(file);
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateSpace({ ...space, files });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-pplx-card w-full max-w-lg rounded-2xl shadow-2xl border border-pplx-border overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pplx-border bg-pplx-secondary/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">{space.emoji}</span>
            <h2 className="text-lg font-semibold text-pplx-text">
              Manage Knowledge
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-pplx-muted uppercase tracking-wider">
              {files.length} Active File{files.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-pplx-accent hover:text-cyan-400 transition-colors px-3 py-1.5 bg-pplx-accent/10 rounded-full hover:bg-pplx-accent/20"
            >
              <Upload size={14} /> Upload New
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
            {files.length > 0 ? (
              files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-pplx-secondary/30 border border-pplx-border rounded-xl hover:border-pplx-border/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-pplx-card p-2 rounded-lg border border-pplx-border/50">
                      <FileText size={18} className="text-pplx-muted" />
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
                    onClick={() => handleRemoveFile(idx)}
                    className="p-2 text-pplx-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove File"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-pplx-border/50 rounded-xl bg-pplx-secondary/10">
                <div className="p-3 bg-pplx-secondary/50 rounded-full mb-3">
                  <Upload size={24} className="text-pplx-muted" />
                </div>
                <p className="text-sm font-medium text-pplx-text">
                  No knowledge files yet
                </p>
                <p className="text-xs text-pplx-muted mt-1 max-w-[200px]">
                  Upload documents to give context to your workspace AI.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pplx-border bg-pplx-secondary/30 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-pplx-accent text-black font-semibold rounded-full hover:bg-cyan-400 transition-colors text-sm shadow-lg shadow-cyan-500/20"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
