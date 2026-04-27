
import React, { useState, useMemo } from 'react';
import Modal from './shared/Modal';
import { PsychologicalScore } from './Journal';

export interface Position {
  id: string | number;
  name: string;
  type: 'buy' | 'sell' | 'hold';
  category: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: string;
  strategy: string;
  status: 'planned' | 'in-progress' | 'completed' | 'stopped';
  dateAdded: string;
}

export interface Plan {
  id: string | number;
  name: string;
  action: 'monitor' | 'buy' | 'sell';
  category: string;
  entryCondition: string;
  strategy: string;
  priority: 'low' | 'medium' | 'high';
  dateAdded: string;
  entryPrice: number | string;
  targetPrice: number | string;
  stopLoss: number | string;
  timeHorizon: string;
  riskRewardRatio: string;
  quantity: number | string;
}

export interface ListItem {
  id: string | number;
  content: string;
}
import { PencilIcon, TrashIcon, ShieldIcon, CalendarIcon, TargetIcon, FlaskIcon } from './icons/Icons';
import { Plus } from 'lucide-react';
import EditableCard from './shared/EditableCard';

interface StrategyProps {
    positions: Position[];
    onAddPosition: (position: Omit<Position, 'id'>) => void;
    onUpdatePosition: (position: Position) => void;
    onDeletePosition: (id: string | number) => void;
    plans: Plan[];
    onAddPlan: (item: Omit<Plan, 'id'>) => void;
    onUpdatePlan: (item: Plan) => void;
    onDeletePlan: (id: string | number) => void;
    objectives: ListItem[];
    onAddObjective: (item: Omit<ListItem, 'id'>) => void;
    onUpdateObjective: (item: ListItem) => void;
    onDeleteObjective: (id: string | number) => void;
    rules: ListItem[];
    onAddRule: (item: Omit<ListItem, 'id'>) => void;
    onUpdateRule: (item: ListItem) => void;
    onDeleteRule: (id: string | number) => void;
    latestPsychologicalScore?: PsychologicalScore;
    onNavigate: (tab: 'overview' | 'strategy' | 'journal' | 'research' | 'backtest') => void;
    hasDock?: boolean;
}

const inputClass = "w-full px-3 py-2 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/10 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-all text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600";

const MindsetStatusBanner: React.FC<{ score?: PsychologicalScore }> = ({ score }) => {
    if (!score) {
        return (
            <div className="hidden md:flex text-gray-400 dark:text-zinc-500 p-4 rounded-lg items-center gap-3 mb-6 bg-gray-50 dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800">
                <ShieldIcon className="w-4 h-4 opacity-70" />
                <span className="text-xs font-medium">Completează testul de mindset pentru a activa monitorizarea.</span>
            </div>
        );
    }

    const getStatusStyles = () => {
        switch (score.status) {
            case 'Echilibrat': return 'text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10';
            case 'Precaut': return 'text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10';
            case 'Risc Emoțional': return 'text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10';
            default: return 'text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/20';
        }
    };

    const statusClass = getStatusStyles();

    return (
        <div className={`hidden md:flex p-4 rounded-lg mb-6 items-start gap-3 border ${statusClass}`}>
            <div className="flex-shrink-0 mt-0.5"><ShieldIcon className="w-4 h-4" /></div>
            <div>
                <h4 className="font-bold text-xs uppercase tracking-tight">Status Mindset: {score.status}</h4>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{score.suggestion}</p>
            </div>
        </div>
    );
};


const PositionCard: React.FC<{ position: Position; onEdit: () => void; onDelete: () => void; }> = ({ position, onEdit, onDelete }) => {
    const { name, type, category, entryPrice, targetPrice, stopLoss, riskRewardRatio, strategy, status, dateAdded } = position;

    const getTypeColor = (type: 'buy' | 'sell' | 'hold') => {
        switch (type) {
            case 'buy': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
            case 'sell': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30';
            case 'hold': return 'text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
        }
    };

    const getStatusIndicator = (status: 'in-progress' | 'completed' | 'stopped' | 'planned') => {
        switch (status) {
            case 'in-progress': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-tight">Activ</span>;
            case 'completed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 uppercase tracking-tight">Finalizat</span>;
            case 'stopped': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 border border-gray-200 dark:border-zinc-700 uppercase tracking-tight">Stopat</span>;
            case 'planned': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 uppercase tracking-tight">Planificat</span>;
        }
    };

    return (
        <div className="group relative bg-white dark:bg-pplx-card border border-gray-200 dark:border-zinc-800/50 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200">
            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-zinc-100 border border-gray-100 dark:border-zinc-800 shadow-sm">
                            {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{name}</h4>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-tight">{category}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {getStatusIndicator(status)}
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getTypeColor(type)}`}>
                            {type}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50">
                        <span className="block text-[8px] text-gray-400 dark:text-zinc-500 uppercase font-bold tracking-tight mb-1">Entry</span>
                        <span className="block text-[11px] font-mono font-bold text-gray-900 dark:text-zinc-200">${entryPrice.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20">
                        <span className="block text-[8px] text-emerald-600/70 dark:text-emerald-500/70 uppercase font-bold tracking-tight mb-1">Target</span>
                        <span className="block text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">${targetPrice.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20">
                        <span className="block text-[8px] text-rose-600/70 dark:text-rose-500/70 uppercase font-bold tracking-tight mb-1">Stop</span>
                        <span className="block text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">${stopLoss.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 dark:text-zinc-400 font-bold bg-gray-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-zinc-800">R:R {riskRewardRatio}</span>
                        <span className="text-[9px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 font-bold uppercase tracking-tight">
                            <CalendarIcon className="w-2.5 h-2.5 opacity-70"/> {new Date(dateAdded).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors">
                            <PencilIcon className="w-3 h-3" />
                        </button>
                        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors">
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {strategy && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800/50">
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 italic leading-relaxed line-clamp-2">
                            "{strategy}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};


const PositionForm: React.FC<{ position?: Position, onSave: (pos: any) => void, onCancel: () => void }> = ({ position, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: position?.name || '',
        type: position?.type || 'buy',
        category: position?.category || '',
        entryPrice: position?.entryPrice || 0,
        targetPrice: position?.targetPrice || 0,
        stopLoss: position?.stopLoss || 0,
        riskRewardRatio: position?.riskRewardRatio || '',
        strategy: position?.strategy || '',
        status: position?.status || 'planned',
        dateAdded: position?.dateAdded || new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: e.target.type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(position ? { ...position, ...formData } : formData);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Activ</label>
                    <div className="sm:col-span-3">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="ex: Bitcoin" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Categorie</label>
                    <div className="sm:col-span-3">
                        <input type="text" name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="ex: Crypto" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Tip</label>
                    <div className="sm:col-span-3">
                        <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                            <option value="buy">🟢 Buy / Long</option>
                            <option value="sell">🔴 Sell / Short</option>
                            <option value="hold">⚪ Hold</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Status</label>
                    <div className="sm:col-span-3">
                        <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                            <option value="planned">⏳ Planificat</option>
                            <option value="in-progress">⚡ Activ / În Curs</option>
                            <option value="completed">✅ Finalizat</option>
                            <option value="stopped">🛑 Stopat</option>
                        </select>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-zinc-800/50 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Intrare</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                        <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className={`${inputClass} pl-7`} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Target</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-emerald-500/50 text-sm">$</span>
                        <input type="number" step="any" name="targetPrice" value={formData.targetPrice} onChange={handleChange} className={`${inputClass} pl-7 text-emerald-600 dark:text-emerald-400`} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Stop Loss</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-rose-500/50 text-sm">$</span>
                        <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} className={`${inputClass} pl-7 text-rose-600 dark:text-rose-400`} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">R:R</label>
                    <div className="sm:col-span-3">
                        <input type="text" name="riskRewardRatio" value={formData.riskRewardRatio} onChange={handleChange} className={inputClass} placeholder="ex: 1:3" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Data</label>
                    <div className="sm:col-span-3">
                        <input type="date" name="dateAdded" value={formData.dateAdded} onChange={handleChange} className={inputClass} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right mt-2">Note</label>
                    <div className="sm:col-span-3">
                        <textarea 
                            name="strategy" 
                            value={formData.strategy} 
                            onChange={handleChange} 
                            rows={4} 
                            className={`${inputClass} p-3 rounded-xl resize-none min-h-[100px]`}
                            placeholder="Descrie strategia ta aici..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-zinc-800/50">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                >
                    Anulează
                </button>
                <button 
                    type="submit" 
                    className="px-8 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95 shadow-sm"
                >
                    Salvează
                </button>
            </div>
        </form>
    );
}

const PlanCard: React.FC<{ plan: Plan; onEdit: () => void; onDelete: () => void; }> = ({ plan, onEdit, onDelete }) => {
    const { name, action, category, entryCondition, strategy, priority, entryPrice, targetPrice, stopLoss, timeHorizon } = plan;

    const getActionBadge = (action: 'buy' | 'sell' | 'monitor') => {
        switch (action) {
            case 'buy': return <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">BUY</span>;
            case 'sell': return <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">SELL</span>;
            case 'monitor': return <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">MONITOR</span>;
        }
    };

    const getPriorityColor = (p: 'high' | 'medium' | 'low') => {
        switch(p) {
            case 'high': return 'text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10';
            case 'medium': return 'text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/20';
            case 'low': return 'text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/10';
        }
    };

    return (
        <div className="group relative bg-white dark:bg-pplx-card border border-gray-200 dark:border-zinc-800/50 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getPriorityColor(priority)}`}>{priority}</span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{name}</h4>
                    </div>
                    {getActionBadge(action)}
                </div>

                <div className="p-3 rounded-lg bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 mb-4">
                    <div className="flex items-start gap-2.5">
                        <TargetIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="block text-[8px] text-gray-400 dark:text-zinc-500 uppercase font-bold tracking-tight mb-0.5">Condiție Intrare</span>
                            <span className="text-[11px] text-gray-700 dark:text-zinc-300 font-bold leading-relaxed">{entryCondition}</span>
                        </div>
                    </div>
                    
                    {(entryPrice || targetPrice) && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800/50">
                            {entryPrice && <div className="text-[9px]"><span className="text-gray-400 dark:text-zinc-500 mr-1 font-bold uppercase tracking-tight">Price</span><span className="font-mono font-bold text-gray-900 dark:text-zinc-200">${entryPrice}</span></div>}
                            {targetPrice && <div className="text-[9px]"><span className="text-gray-400 dark:text-zinc-500 mr-1 font-bold uppercase tracking-tight">Target</span><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${targetPrice}</span></div>}
                            {stopLoss && <div className="text-[9px]"><span className="text-gray-400 dark:text-zinc-500 mr-1 font-bold uppercase tracking-tight">Stop</span><span className="font-mono font-bold text-rose-600 dark:text-rose-400">${stopLoss}</span></div>}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <span className="block text-[8px] text-gray-400 dark:text-zinc-500 uppercase font-bold tracking-tight mb-1">Strategie</span>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 italic leading-relaxed line-clamp-2">"{strategy}"</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"><PencilIcon className="w-3 h-3" /></button>
                        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"><TrashIcon className="w-3 h-3" /></button>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50 dark:border-zinc-800/50">
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-tight">{category}</span>
                    {timeHorizon && (
                        <span className="text-[8px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-100 dark:border-zinc-800 uppercase tracking-tight">
                            {timeHorizon}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlanForm: React.FC<{ plan?: Plan, onSave: (plan: any) => void, onCancel: () => void }> = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: plan?.name || '',
        action: plan?.action || 'monitor',
        category: plan?.category || '',
        strategy: plan?.strategy || '',
        priority: plan?.priority || 'medium',
        dateAdded: plan?.dateAdded || new Date().toISOString().split('T')[0],
        entryPrice: plan?.entryPrice || '',
        targetPrice: plan?.targetPrice || '',
        stopLoss: plan?.stopLoss || '',
        timeHorizon: plan?.timeHorizon || 'medium',
        riskRewardRatio: plan?.riskRewardRatio || '',
        quantity: plan?.quantity || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: e.target.type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(plan ? { ...plan, ...formData } : formData);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Activ</label>
                    <div className="sm:col-span-3">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="ex: BTC" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Acțiune</label>
                    <div className="sm:col-span-3">
                        <select name="action" value={formData.action} onChange={handleChange} className={inputClass}>
                            <option value="monitor">👀 Monitor</option>
                            <option value="buy">🟢 Buy</option>
                            <option value="sell">🔴 Sell</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Categorie</label>
                    <div className="sm:col-span-3">
                        <input type="text" name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="ex: Crypto / AI" />
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-zinc-800/50 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Preț Intrare</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                        <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className={`${inputClass} pl-7`} placeholder="0.00" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Target</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-emerald-500/50 text-sm">$</span>
                        <input type="number" step="any" name="targetPrice" value={formData.targetPrice} onChange={handleChange} className={`${inputClass} pl-7 text-emerald-600 dark:text-emerald-400`} placeholder="TP" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Stop Loss</label>
                    <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-rose-500/50 text-sm">$</span>
                        <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} className={`${inputClass} pl-7 text-rose-600 dark:text-rose-400`} placeholder="SL" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Orizont</label>
                    <div className="sm:col-span-3">
                        <select name="timeHorizon" value={formData.timeHorizon} onChange={handleChange} className={inputClass}>
                            <option value="short">Termen Scurt (&lt; 1 an)</option>
                            <option value="medium">Termen Mediu (1-3 ani)</option>
                            <option value="long">Termen Lung (3-5 ani)</option>
                            <option value="5y+">Generațional (5+ ani)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right">Prioritate</label>
                    <div className="sm:col-span-3">
                        <select name="priority" value={formData.priority} onChange={handleChange} className={inputClass}>
                            <option value="low">🔵 Scăzută</option>
                            <option value="medium">🟡 Medie</option>
                            <option value="high">🔴 Ridicată</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest sm:text-right mt-2">Strategie</label>
                    <div className="sm:col-span-3">
                        <textarea 
                            name="strategy" 
                            value={formData.strategy} 
                            onChange={handleChange} 
                            rows={6} 
                            className={`${inputClass} p-3 rounded-xl resize-none min-h-[120px]`}
                            placeholder="1. Condiție Intrare&#10;2. Teza de investiție&#10;3. Invalidare" 
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-zinc-800/50">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                >
                    Anulează
                </button>
                <button 
                    type="submit" 
                    className="px-8 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95 shadow-sm"
                >
                    Salvează
                </button>
            </div>
        </form>
    );
};

type StrategyTab = 'positions' | 'plans' | 'rules';

const Strategy: React.FC<StrategyProps> = (props) => {
  const [activeTab, setActiveTab] = useState<StrategyTab>('positions');
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | undefined>(undefined);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);

  const handleAddPositionClick = () => {
    setEditingPosition(undefined);
    setIsPositionModalOpen(true);
  }

  const handleEditPositionClick = (position: Position) => {
    setEditingPosition(position);
    setIsPositionModalOpen(true);
  }

  const handleSavePosition = (positionData: any) => {
    if (editingPosition) {
        props.onUpdatePosition(positionData);
    } else {
        props.onAddPosition(positionData);
    }
    setIsPositionModalOpen(false);
    setEditingPosition(undefined);
  }

  const handleAddPlanClick = () => {
    setEditingPlan(undefined);
    setIsPlanModalOpen(true);
  };
  const handleEditPlanClick = (plan: Plan) => {
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };
  const handleSavePlan = (planData: any) => {
    if (editingPlan) {
      props.onUpdatePlan(planData);
    } else {
      props.onAddPlan(planData);
    }
    setIsPlanModalOpen(false);
    setEditingPlan(undefined);
  };

  const groupByCategory = <T extends { category: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
        const cat = item.category || 'Generale';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, T[]>);
  };

  const groupedPositions = useMemo(() => groupByCategory(props.positions), [props.positions]);
  const groupedPlans = useMemo(() => groupByCategory(props.plans), [props.plans]);
  
  return (
    <div className="space-y-8 pb-40">
      <div className="flex items-center justify-between gap-4">
        <h2 className="hidden md:block text-2xl md:text-3xl font-bold text-slate-100">Strategie & Poziții</h2>
      </div>
      
      <MindsetStatusBanner score={props.latestPsychologicalScore} />

      <div 
        className="lg:hidden fixed left-0 right-0 z-40 bg-white/90 dark:bg-pplx-primary/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 p-2 flex justify-around items-center gap-2"
        style={{
          bottom: props.hasDock ? "calc(72px + 56px + env(safe-area-inset-bottom))" : "56px",
        }}
      >
          {['positions', 'plans', 'rules'].map((tab) => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as StrategyTab)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all duration-200 ${
                      activeTab === tab
                          ? 'bg-zinc-100 dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
              >
                  {tab === 'positions' ? 'Poziții' : tab === 'plans' ? 'Planuri' : 'Reguli'}
              </button>
          ))}
          <button 
            onClick={() => props.onNavigate('backtest')}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-all duration-200"
          >
             <FlaskIcon className="w-3 h-3" /> Backtest
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Positions Column */}
        <div className={`lg:col-span-2 flex flex-col h-auto ${activeTab === 'positions' ? 'block' : 'hidden lg:flex'}`}>
            <div className="w-full flex flex-col h-fit">
              <div className="flex justify-between items-center mb-6 flex-shrink-0 px-1">
                <h3 className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-zinc-500">Poziții Curente</h3>
                <button 
                  onClick={handleAddPositionClick} 
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white rounded-md transition-all active:scale-95 shadow-sm uppercase tracking-tight"
                >
                  <Plus size={12} />
                  <span>Adaugă</span>
                </button>
              </div>
              <div className="space-y-6 flex-grow h-auto overflow-visible md:overflow-y-auto md:pr-2 md:max-h-[80vh] custom-scrollbar">
                 {Object.entries(groupedPositions).length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-xs text-center py-8 bg-white dark:bg-pplx-card rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">Nicio poziție activă.</p>}
                 {Object.entries(groupedPositions).map(([category, positions]: [string, Position[]]) => (
                    <div key={category} className="mb-8 last:mb-0">
                        <h4 className="text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-zinc-800/50 pb-1 ml-1">{category}</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {positions.map((pos) => (
                                <PositionCard 
                                    key={pos.id}
                                    position={pos}
                                    onEdit={() => handleEditPositionClick(pos)}
                                    onDelete={() => props.onDeletePosition(pos.id)}
                                />
                            ))}
                        </div>
                    </div>
                 ))}
              </div>
            </div>
        </div>

        {/* Plans Column */}
        <div className={`lg:col-span-2 flex flex-col h-auto ${activeTab === 'plans' ? 'block' : 'hidden lg:flex'}`}>
          <div className="w-full flex flex-col h-fit">
            <div className="flex justify-between items-center mb-6 flex-shrink-0 px-1">
              <h3 className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-zinc-500">Planuri Viitoare</h3>
              <button 
                onClick={handleAddPlanClick} 
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white rounded-md transition-all active:scale-95 shadow-sm uppercase tracking-tight"
              >
                <Plus size={12} />
                <span>Adaugă</span>
              </button>
            </div>
            <div className="space-y-6 flex-grow h-auto overflow-visible md:overflow-y-auto md:pr-2 md:max-h-[80vh] custom-scrollbar">
               {Object.entries(groupedPlans).length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-xs text-center py-8 bg-white dark:bg-pplx-card rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">Niciun plan viitor.</p>}
               {Object.entries(groupedPlans).map(([category, plans]: [string, Plan[]]) => (
                  <div key={category} className="mb-8 last:mb-0">
                      <h4 className="text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-zinc-800/50 pb-1 ml-1">{category}</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {plans.map((plan) => (
                            <PlanCard 
                                key={plan.id}
                                plan={plan}
                                onEdit={() => handleEditPlanClick(plan)}
                                onDelete={() => props.onDeletePlan(plan.id)}
                            />
                        ))}
                      </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* Rules/Objectives Column */}
        <div className={`lg:col-span-1 space-y-6 ${activeTab === 'rules' ? 'block' : 'hidden lg:block'}`}>
            <EditableCard 
              title="Obiective Q3" 
              items={props.objectives} 
              onAddItem={props.onAddObjective} 
              onUpdateItem={props.onUpdateObjective} 
              onDeleteItem={props.onDeleteObjective}
              textColorClassName="text-accent font-medium"
            />
            <EditableCard 
              title="Reguli Personale" 
              items={props.rules} 
              onAddItem={props.onAddRule} 
              onUpdateItem={props.onUpdateRule} 
              onDeleteItem={props.onDeleteRule} 
              textColorClassName="text-slate-300"
            />
        </div>
      </div>
       <Modal isOpen={isPositionModalOpen} onClose={() => setIsPositionModalOpen(false)} title={editingPosition ? 'Editează Poziție' : 'Adaugă Poziție'}>
            <PositionForm position={editingPosition} onSave={handleSavePosition} onCancel={() => setIsPositionModalOpen(false)} />
        </Modal>
        <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={editingPlan ? 'Editează Plan' : 'Adaugă Plan'}>
            <PlanForm plan={editingPlan} onSave={handleSavePlan} onCancel={() => setIsPlanModalOpen(false)} />
        </Modal>
    </div>
  );
};

export default Strategy;
