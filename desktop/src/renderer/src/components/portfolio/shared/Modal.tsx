import React from 'react';
import { X } from 'lucide-react';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-[#191919] sm:rounded-xl border-0 sm:border border-gray-200 dark:border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-zinc-800/50">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8 no-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
