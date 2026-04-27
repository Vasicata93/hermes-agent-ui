import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon } from '../icons/Icons';
import Button from './Button';

interface ListItem {
  id: string | number;
  content: string;
}

interface EditableCardProps {
  title: string;
  items: ListItem[];
  onAddItem: (item: Omit<ListItem, 'id'>) => void;
  onUpdateItem: (item: ListItem) => void;
  onDeleteItem: (id: string | number) => void;
  textColorClassName?: string;
}

const EditableCard: React.FC<EditableCardProps> = ({ title, items, onAddItem, onUpdateItem, onDeleteItem, textColorClassName = "text-slate-300" }) => {
  const [isEditing, setIsEditing] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (item: ListItem) => {
    setIsEditing(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (id: string | number) => {
    onUpdateItem({ id, content: editContent });
    setIsEditing(null);
  };

  const handleAdd = () => {
    if (newItemContent.trim()) {
      onAddItem({ content: newItemContent });
      setNewItemContent('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-pplx-card border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-400">{title}</h3>
        <Button onClick={() => setIsAdding(true)} size="sm" variant="secondary" className="!px-3 !py-1.5 !text-[10px] !font-medium !rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 border-transparent">+ Nou</Button>
      </div>
      <ul className="space-y-3">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-3 group">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500/50 mt-0.5 flex-shrink-0" />
            {isEditing === item.id ? (
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)} 
                  className="flex-1 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                />
                <button onClick={() => handleSaveEdit(item.id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold px-2">OK</button>
              </div>
            ) : (
              <div className="flex-1 flex justify-between items-start">
                <span className={`text-sm font-medium ${textColorClassName === "text-slate-300" ? "text-gray-700 dark:text-zinc-300" : textColorClassName}`}>{item.content}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><PencilIcon className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </li>
        ))}
        {isAdding && (
          <li className="flex items-start gap-3 mt-3">
            <CheckCircleIcon className="w-4 h-4 text-gray-300 dark:text-zinc-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                value={newItemContent} 
                onChange={(e) => setNewItemContent(e.target.value)} 
                className="flex-1 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all"
                placeholder="Adaugă element nou..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button onClick={handleAdd} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold px-2">Add</button>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 text-xs font-semibold px-2">Cancel</button>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

export default EditableCard;
