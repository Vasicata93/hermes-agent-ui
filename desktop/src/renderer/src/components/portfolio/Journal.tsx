
import React, { useState } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Pencil as PencilIcon, Trash2 as TrashIcon, Brain as BrainIcon, Check as CheckIcon, Smile as MoodExcellentIcon, SmilePlus as MoodGoodIcon, Meh as MoodNeutralIcon, Frown as MoodBadIcon, Angry as MoodTerribleIcon, X } from 'lucide-react';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: ('decision' | 'lesson' | 'emotion' | 'fomo' | 'fud')[];
}
export interface MoodLog {
  id: string;
  date: string;
  mood: 'excelent' | 'bun' | 'neutru' | 'rău' | 'groaznic';
}
export interface PsychologicalScore {
  id: string;
  date: string;
  stress: number;
  confidence: number;
  discipline: number;
  clarity: number;
  overallScore: number;
  status: 'Echilibrat' | 'Precaut' | 'Risc Emoțional';
  suggestion: string;
}
export interface BehavioralMetrics {
  fomoScore: number;
  fudScore: number;
  disciplineScore: number;
  emotionalDecisions: number;
  logicalDecisions: number;
}

const motivationalQuotes = [
  "The stock market is a device for transferring money from the impatient to the patient.",
  "Risk comes from not knowing what you're doing.",
  "In investing, what is comfortable is rarely profitable."
];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-pplx-card rounded-xl border border-gray-200 dark:border-zinc-800/50 shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string; variant?: "accent" | "secondary"; size?: "sm" | "md"; type?: "button" | "submit" }> = ({ children, onClick, className = "", variant = "accent", size = "md", type = "button" }) => {
  const baseClass = "inline-flex items-center justify-center font-bold rounded-lg transition-all active:scale-95";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-[10px] uppercase tracking-tight" : "px-4 py-2 text-xs uppercase tracking-tight";
  const variantClass = variant === "accent" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-sm" : "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800";
  return <button type={type} onClick={onClick} className={`${baseClass} ${sizeClass} ${variantClass} ${className}`}>{children}</button>;
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-[#191919] rounded-t-2xl sm:rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
};

interface JournalProps {
    entries: JournalEntry[];
    onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    onUpdateEntry: (entry: JournalEntry) => void;
    onDeleteEntry: (id: string | number) => void;
    moodLogs: MoodLog[];
    onAddMoodLog: (moodLog: Omit<MoodLog, 'id'>) => void;
    psychologicalScores: PsychologicalScore[];
    onAddPsychologicalScore: (score: Omit<PsychologicalScore, 'id'>) => void;
    behavioralMetrics: BehavioralMetrics;
    hasDock?: boolean;
}

const JournalForm: React.FC<{ entry?: JournalEntry, onSave: (entry: any) => void, onCancel: () => void }> = ({ entry, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        date: entry?.date || new Date().toISOString().split('T')[0],
        content: entry?.content || '',
        tags: entry?.tags || [],
    });

    const handleTagChange = (tag: 'decision' | 'lesson' | 'emotion' | 'fomo' | 'fud') => {
        const newTags = formData.tags.includes(tag) ? formData.tags.filter(t => t !== tag) : [...formData.tags, tag];
        setFormData(prev => ({...prev, tags: newTags}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(entry ? { ...entry, ...formData } : formData);
    }

    const getTagClass = (tag: 'decision' | 'lesson' | 'emotion' | 'fomo' | 'fud') => {
        const baseClass = "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all border";
        const selected = formData.tags.includes(tag);
        switch(tag) {
            case 'decision': return `${baseClass} ${selected ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`;
            case 'lesson': return `${baseClass} ${selected ? 'bg-yellow-500 text-white border-transparent' : 'bg-transparent text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-400'}`;
            case 'emotion': return `${baseClass} ${selected ? 'bg-purple-500 text-white border-transparent' : 'bg-transparent text-purple-600 dark:text-purple-500 border-purple-200 dark:border-purple-900/50 hover:border-purple-400'}`;
            case 'fomo': return `${baseClass} ${selected ? 'bg-green-500 text-white border-transparent' : 'bg-transparent text-green-600 dark:text-green-500 border-green-200 dark:border-green-900/50 hover:border-green-400'}`;
            case 'fud': return `${baseClass} ${selected ? 'bg-pink-500 text-white border-transparent' : 'bg-transparent text-pink-600 dark:text-pink-500 border-pink-200 dark:border-pink-900/50 hover:border-pink-400'}`;
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 sm:text-right">Data</label>
                <div className="sm:col-span-3">
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} className="w-full bg-transparent border-none px-0 py-1 text-sm font-medium text-gray-900 dark:text-zinc-100 outline-none focus:ring-0 border-b border-transparent focus:border-gray-200 dark:focus:border-zinc-800 transition-all" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 sm:text-right mt-1">Conținut</label>
                <div className="sm:col-span-3">
                    <textarea 
                        value={formData.content} 
                        onChange={e => setFormData(p => ({...p, content: e.target.value}))} 
                        rows={4} 
                        className="w-full bg-transparent border-none px-0 py-1 text-sm font-medium text-gray-900 dark:text-zinc-100 outline-none focus:ring-0 border-b border-transparent focus:border-gray-200 dark:focus:border-zinc-800 transition-all resize-none" 
                        placeholder="Scrie ceva..." 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                handleSubmit(e as any);
                            }
                        }}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Apasă {navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'} + Enter pentru a salva</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 sm:text-right mt-1">Etichete</label>
                <div className="sm:col-span-3 flex flex-wrap gap-2">
                    <span onClick={() => handleTagChange('decision')} className={getTagClass('decision')}>Decizie</span>
                    <span onClick={() => handleTagChange('lesson')} className={getTagClass('lesson')}>Lecție</span>
                    <span onClick={() => handleTagChange('emotion')} className={getTagClass('emotion')}>Emoție</span>
                    <span onClick={() => handleTagChange('fomo')} className={getTagClass('fomo')}>FOMO</span>
                    <span onClick={() => handleTagChange('fud')} className={getTagClass('fud')}>FUD</span>
                </div>
            </div>
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">Anulează</button>
                <button type="submit" className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold px-5 py-2 rounded-lg transition-all shadow-sm active:scale-95">Salvează</button>
            </div>
        </form>
    );
}

const MindsetTestModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (score: Omit<PsychologicalScore, 'id'>) => void }> = ({ isOpen, onClose, onSave }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);

    const questions = [
        { q: "Cât de stresat te simți azi în legătură cu piața?", a: ["Deloc", "Puțin", "Moderat", "Destul de", "Extrem"] },
        { q: "Câtă încredere ai în strategia ta actuală?", a: ["Foarte scăzută", "Scăzută", "Neutră", "Ridicată", "Foarte ridicată"] },
        { q: "Cât de disciplinat te-ai simțit în ultimele 24h?", a: ["Nedisciplinat", "Mai mult impulsiv", "Echilibrat", "Disciplinat", "Foarte disciplinat"] },
        { q: "Cât de clară îți este viziunea asupra pieței?", a: ["Confuză", "Neclară", "Neutră", "Claritate bună", "Foarte clară"] }
    ];

    const handleAnswer = (answerIndex: number) => {
        const newAnswers = [...answers, answerIndex];
        setAnswers(newAnswers);
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            calculateAndSaveResult(newAnswers);
            setIsFinished(true);
        }
    };

    const calculateAndSaveResult = (finalAnswers: number[]) => {
        const stressScore = 100 - (finalAnswers[0] * 25);
        const confidenceScore = finalAnswers[1] * 25;
        const disciplineScore = finalAnswers[2] * 25;
        const clarityScore = finalAnswers[3] * 25;

        const overallScore = Math.round((stressScore + confidenceScore + disciplineScore + clarityScore) / 4);
        
        let status: PsychologicalScore['status'] = 'Precaut';
        let suggestion = '';

        if (overallScore >= 75) {
            status = 'Echilibrat';
            suggestion = 'Mindset echilibrat. Ești calm și analitic. O zi excelentă pentru a revizui strategii și a lua decizii logice.';
        } else if (overallScore >= 50) {
            status = 'Precaut';
            suggestion = 'Nivel de stres moderat. Fii vigilent și evită deciziile impulsive. Reevaluează-ți planul înainte de a acționa.';
        } else {
            status = 'Risc Emoțional';
            suggestion = 'Stres ridicat și claritate redusă. Risc crescut de decizii emoționale. Fă o pauză de la piață și relaxează-te.';
        }

        const result: Omit<PsychologicalScore, 'id'> = {
            date: new Date().toISOString(),
            stress: 100 - stressScore,
            confidence: confidenceScore,
            discipline: disciplineScore,
            clarity: clarityScore,
            overallScore,
            status,
            suggestion
        };
        onSave(result);
    };

    const resetAndClose = () => {
        setStep(0);
        setAnswers([]);
        setIsFinished(false);
        onClose();
    };
    
    const progress = (step / questions.length) * 100;

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title="Test Zilnic de Mindset">
            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${isFinished ? 100 : progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>

            {!isFinished ? (
                <div className="space-y-4">
                    <h3 className="text-lg text-slate-200 font-semibold">{questions[step].q}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {questions[step].a.map((ans, index) => (
                            <Button key={index} onClick={() => handleAnswer(index)} className="w-full text-left justify-start" variant="secondary">{ans}</Button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-4 py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400">
                        <CheckIcon className="w-8 h-8"/>
                    </div>
                    <h3 className={`text-2xl font-bold text-slate-100`}>Test Finalizat!</h3>
                    <p className="text-slate-300">Rezultatele tale au fost salvate. Poți vedea scorul și sugestia în dashboard.</p>
                    <Button onClick={resetAndClose} variant="accent">Închide</Button>
                </div>
            )}
        </Modal>
    );
};

const QuickMoodSelector: React.FC<{ onSelect: (mood: MoodLog['mood']) => void }> = ({ onSelect }) => {
    const moods: { mood: MoodLog['mood'], icon: React.ReactNode, color: string }[] = [
        { mood: 'excelent', icon: <MoodExcellentIcon className="w-6 h-6"/>, color: 'text-green-400' },
        { mood: 'bun', icon: <MoodGoodIcon className="w-6 h-6"/>, color: 'text-cyan-400' },
        { mood: 'neutru', icon: <MoodNeutralIcon className="w-6 h-6"/>, color: 'text-slate-400' },
        { mood: 'rău', icon: <MoodBadIcon className="w-6 h-6"/>, color: 'text-yellow-400' },
        { mood: 'groaznic', icon: <MoodTerribleIcon className="w-6 h-6"/>, color: 'text-pink-400' },
    ];

    return (
        <div className="flex justify-around items-center p-2 rounded-xl bg-transparent border border-white/5">
            {moods.map(({ mood, icon, color }) => (
                <button 
                    key={mood}
                    onClick={() => onSelect(mood)}
                    className={`${color} hover:bg-white/5 p-2 rounded-full transition-colors focus:outline-none focus:bg-white/10`}
                    title={mood.charAt(0).toUpperCase() + mood.slice(1)}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
};

type JournalTab = 'journal' | 'mindset';

const Journal: React.FC<JournalProps> = ({ 
  entries, 
  onAddEntry, 
  onUpdateEntry, 
  onDeleteEntry, 
  onAddMoodLog, 
  psychologicalScores, 
  onAddPsychologicalScore, 
  hasDock
}) => {
  const [activeTab, setActiveTab] = useState<JournalTab>('journal');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  
  const getTagColor = (tag: JournalEntry['tags'][number]) => {
    switch(tag) {
        case 'decision': return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800';
        case 'lesson': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        case 'emotion': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30';
        case 'fomo': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        case 'fud': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30';
    }
  }
  
  const handleAddJournalClick = () => {
    setEditingEntry(undefined);
    setIsJournalModalOpen(true);
  }

  const handleEditJournalClick = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsJournalModalOpen(true);
  }

  const handleSaveJournal = (entryData: any) => {
    if (editingEntry) {
        onUpdateEntry(entryData);
    } else {
        onAddEntry(entryData);
    }
    setIsJournalModalOpen(false);
    setEditingEntry(undefined);
  }
    
  const latestScore = psychologicalScores.length > 0 ? [...psychologicalScores].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
  const radialChartData = latestScore ? [{ name: 'Overall', value: latestScore.overallScore, fill: 'rgb(var(--accent-color-rgb))' }] : [{ name: 'Overall', value: 0, fill: '#475569' }];

  return (
    <div className="space-y-8 pb-40">
      <h2 className="hidden md:block text-3xl font-bold text-slate-100">Jurnal & Mindset</h2>

      <div 
        className="lg:hidden fixed left-0 right-0 z-40 bg-white/90 dark:bg-pplx-primary/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 p-2 flex justify-around items-center gap-2"
        style={{
          bottom: hasDock ? "calc(72px + 56px + env(safe-area-inset-bottom))" : "56px",
        }}
      >
          {['journal', 'mindset'].map((tab) => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as JournalTab)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all duration-200 ${
                      activeTab === tab
                          ? 'bg-zinc-100 dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
              >
                  {tab === 'journal' ? 'Jurnal' : 'Mindset'}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column: Journal Personal */}
        <div className={`lg:col-span-2 ${activeTab === 'journal' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex-grow flex flex-col h-auto">
                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-zinc-500">Jurnal Personal</h3>
                    <button onClick={handleAddJournalClick} className="text-[10px] font-bold uppercase tracking-tight text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-800 transition-colors bg-white dark:bg-zinc-900 shadow-sm">+ Adaugă</button>
                </div>
                
                <div className="space-y-0 flex-grow overflow-visible md:overflow-y-auto md:pr-2 md:max-h-[calc(100vh-250px)] custom-scrollbar">
                    {entries.map((entry) => (
                        <div key={entry.id} className="
                            group relative p-5 mb-4 bg-white dark:bg-pplx-card border border-gray-200 dark:border-zinc-800/50 rounded-xl hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-sm
                        ">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">{new Date(entry.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditJournalClick(entry)} className="p-1 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"><PencilIcon className="w-3 h-3"/></button>
                                    <button onClick={() => onDeleteEntry(entry.id)} className="p-1 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed mb-4">{entry.content}</p>
                            <div className="flex space-x-2 flex-wrap gap-2">
                                {entry.tags.map(tag => (
                                    <span key={tag} className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded border ${getTagColor(tag)}`}>#{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {entries.length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-xs text-center py-8 bg-white dark:bg-pplx-card rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">Nicio intrare în jurnal.</p>}
                </div>
            </div>
        </div>
        
        {/* Sidebar Column: Analysis & Quote */}
        <div className={`lg:col-span-1 space-y-8 ${activeTab === 'mindset' ? 'block' : 'hidden lg:block'}`}>
            {/* Psychological Analysis */}
            <Card className="p-6">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Analiză Psihologică</h3>
               <div className="space-y-6">
                    <div className="relative flex justify-center">
                         <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart 
                                innerRadius="70%" 
                                outerRadius="100%" 
                                data={radialChartData} 
                                startAngle={90} 
                                endAngle={-270}
                                barSize={16}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey='value' cornerRadius={8} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Scor</p>
                            <p className="text-4xl font-bold text-slate-50 tracking-tighter">{latestScore ? `${latestScore.overallScore}` : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {latestScore ? (
                            <div className="bg-transparent border border-white/5 p-4 rounded-xl text-center">
                                <h4 className="font-bold text-slate-100 mb-1">{latestScore.status}</h4>
                                <p className="text-xs text-slate-400">{latestScore.suggestion}</p>
                            </div>
                        ) : (
                             <div className="text-center py-2">
                                <p className="text-sm text-slate-400">Completează testul zilnic.</p>
                            </div>
                        )}
                         <Button onClick={() => setIsTestModalOpen(true)} size="md" variant="accent" className="w-full justify-center !font-bold uppercase tracking-wide text-xs"><BrainIcon className="w-4 h-4" /> Start Test</Button>
                    </div>
                    
                    <div className="h-px bg-white/5 my-4"></div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Check-in Rapid</h4>
                        <div>
                            <QuickMoodSelector onSelect={(mood) => onAddMoodLog({ date: new Date().toISOString(), mood })} />
                        </div>
                        <div>
                             <label htmlFor="focus-slider" className="block text-xs font-medium text-slate-500 mb-2 uppercase">Nivel de Focus</label>
                             <input 
                                id="focus-slider" 
                                type="range" 
                                min="0" 
                                max="100" 
                                defaultValue="75"
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
                             />
                        </div>
                    </div>
               </div>
            </Card>

            {/* Mind Reset */}
            <Card className="p-6 flex flex-col justify-center min-h-[160px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Mind Reset</h3>
                <blockquote className="italic text-slate-300 text-sm leading-relaxed text-center">
                  "{motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}"
                </blockquote>
            </Card>
        </div>
      </div>

      <Modal isOpen={isJournalModalOpen} onClose={() => setIsJournalModalOpen(false)} title={editingEntry ? 'Editează Intrare' : 'Adaugă Intrare'}>
          <JournalForm entry={editingEntry} onSave={handleSaveJournal} onCancel={() => setIsJournalModalOpen(false)} />
      </Modal>
      <MindsetTestModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} onSave={(score) => onAddPsychologicalScore(score)} />
    </div>
  );
};

export default Journal;
