
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ExternalLink as ExternalLinkIcon, Activity as ActivityIcon, Globe as GlobeIcon, Landmark as LandmarkIcon, BarChart2 as BarChartIcon, FileText as FileIcon } from 'lucide-react';

const categorizedWatchlistData = [
  { id: 'crypto', name: '₿ Crypto', subCategories: [{ name: 'Majors', assets: [{ id: 'btc', name: 'Bitcoin', ticker: 'BINANCE:BTCUSDT', description: 'Digital Gold' }] }] }
];
const economicEvents = [
  { date: '2024-03-20', name: 'FOMC Meeting', impact: 'high' }
];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-pplx-card rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

// --- Live Data Integration ---
const TWELVE_DATA_API_KEY = 'cacb62d074594d9a80be544009c051d5';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

interface MarketIndicator {
    icon: string;
    name: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    url: string;
    symbol: string; 
    formattingOptions?: Intl.NumberFormatOptions;
}

const initialMarketIndicators: MarketIndicator[] = [
    { icon: 'BTC.D', name: 'Dominanță BTC', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=CRYPTOCAP:BTC.D', symbol: 'CRYPTOCAP:BTC.D', formattingOptions: { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'decimal' } },
    { icon: 'Ξ/₿', name: 'ETH vs BTC', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=BINANCE:ETHBTC', symbol: 'BINANCE:ETHBTC', formattingOptions: { minimumFractionDigits: 4, maximumFractionDigits: 4 } },
    { icon: '', name: 'S&P 500', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=TVC:SPX', symbol: 'TVC:SPX', formattingOptions: { minimumFractionDigits: 0, maximumFractionDigits: 0, style: 'decimal' } },
    { icon: '', name: 'Obligațiuni', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=NASDAQ:TLT', symbol: 'NASDAQ:TLT', formattingOptions: { style: 'currency', currency: 'USD' } },
    { icon: '', name: 'Volatilitate', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=TVC:VIX', symbol: 'TVC:VIX', formattingOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { icon: '$', name: 'DXY', value: '...', change: '', changeType: 'neutral', url: 'https://www.tradingview.com/chart/?symbol=TVC:DXY', symbol: 'TVC:DXY', formattingOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
];

// --- UPDATED DATA STRUCTURES WITH URLS ---

const MACRO_INDICATORS_DATA = [
    { 
        category: 'Politică Monetară & Bănci', 
        icon: <LandmarkIcon className="w-4 h-4" />,
        items: [
            { name: 'Rata Dobânzii (FED Funds)', desc: 'Costul creditului și atractivitatea investițiilor.', url: 'https://www.tradingview.com/chart/?symbol=ECONOMICS:USINTR' },
            { name: 'FedWatch Tool (CME)', desc: 'Probabilitatea mișcărilor viitoare ale dobânzii.', url: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html' },
        ]
    },
    { 
        category: 'Inflație & Prețuri', 
        icon: <ActivityIcon className="w-4 h-4" />,
        items: [
            { name: 'CPI YoY / Core CPI', desc: 'Puterea de cumpărare; crucial pentru FED.', url: 'https://www.tradingview.com/chart/?symbol=ECONOMICS:USCPI' },
            { name: 'PCE Price Index', desc: 'Indicatorul de inflație preferat de FED.', url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index' },
            { name: 'Producer Price Index (PPI)', desc: 'Presiunile inflaționiste la producător.', url: 'https://www.bls.gov/ppi/' },
        ]
    },
    { 
        category: 'Economie Reală', 
        icon: <BarChartIcon className="w-4 h-4" />,
        items: [
            { name: 'PIB (GDP Growth)', desc: 'Sănătatea și ritmul de creștere economică.', url: 'https://www.tradingview.com/chart/?symbol=ECONOMICS:USGDP' },
            { name: 'ISM PMI (Manuf/Services)', desc: 'Activitate economică; >50 = expansiune.', url: 'https://www.tradingview.com/chart/?symbol=ECONOMICS:USPMI' },
            { name: 'Retail Sales (MoM)', desc: 'Puterea de consum a populației.', url: 'https://www.census.gov/retail/index.html' },
            { name: 'Leading Economic Index', desc: 'Anticipează viitoarele cicluri economice.', url: 'https://www.conference-board.org/topics/us-leading-indicators' },
        ]
    },
    { 
        category: 'Piața Muncii & Sentiment', 
        icon: <GlobeIcon className="w-4 h-4" />,
        items: [
            { name: 'Unemployment Rate', desc: 'Soliditatea pieței muncii.', url: 'https://www.tradingview.com/chart/?symbol=ECONOMICS:USUR' },
            { name: 'Initial Jobless Claims', desc: 'Noi cereri de șomaj (săptămânal).', url: 'https://www.dol.gov/ui/data.pdf' },
            { name: 'Consumer Confidence', desc: 'Optimismul consumatorilor.', url: 'https://www.conference-board.org/topics/consumer-confidence' },
        ]
    }
];

const EXTENDED_RESOURCES = [
    { 
        title: 'On-Chain & Crypto', 
        items: [
            { name: 'Glassnode', desc: 'Date on-chain avansate.', url: 'https://glassnode.com/' },
            { name: 'CoinMetrics', desc: 'Analiză blockchain.', url: 'https://coinmetrics.io/' },
            { name: 'Messari', desc: 'Rapoarte fundamentale.', url: 'https://messari.io/' },
            { name: 'DefiLlama', desc: 'Ecosistem DeFi (TVL).', url: 'https://defillama.com/' },
            { name: 'Crypto Bubbles', desc: 'Vizualizare piață.', url: 'https://cryptobubbles.net/' },
        ]
    },
    { 
        title: 'Analiză Tehnică', 
        items: [
            { name: 'TradingView', desc: 'Charting avansat.', url: 'https://www.tradingview.com/' },
            { name: 'Koyfin', desc: 'Graficare profesională.', url: 'https://www.koyfin.com/' },
            { name: 'Gocharting', desc: 'Analiză tehnică.', url: 'https://gocharting.com/' },
        ]
    },
    { 
        title: 'Macro & Economie', 
        items: [
            { name: 'MacroMicro', desc: 'Grafice macro.', url: 'https://en.macromicro.me/' },
            { name: 'TradingEconomics', desc: 'Date globale.', url: 'https://tradingeconomics.com/' },
            { name: 'FRED', desc: 'Date oficiale SUA.', url: 'https://fred.stlouisfed.org/' },
        ]
    },
    { 
        title: 'Fundamental (Acțiuni)', 
        items: [
            { name: 'SeekingAlpha', desc: 'Opinii specialiști.', url: 'https://seekingalpha.com/' },
            { name: 'Morningstar', desc: 'Evaluări fundamentale.', url: 'https://www.morningstar.com/' },
            { name: 'Finviz', desc: 'Screener complet.', url: 'https://finviz.com/' },
        ]
    },
    { 
        title: 'Știri & Perspective', 
        items: [
            { name: 'Bloomberg', desc: 'Știri financiare.', url: 'https://www.bloomberg.com/' },
            { name: 'Reuters', desc: 'Date de piață.', url: 'https://www.reuters.com/' },
            { name: 'The Block', desc: 'Știri crypto.', url: 'https://www.theblock.co/' },
        ]
    },
    { 
        title: 'Monitorizare', 
        items: [
            { name: 'CoinGecko', desc: 'Prețuri & volum.', url: 'https://www.coingecko.com/' },
            { name: 'DeBank', desc: 'Portofoliu DeFi.', url: 'https://debank.com/' },
            { name: 'Coin360', desc: 'Heatmap crypto.', url: 'https://coin360.com/' },
        ]
    },
];

const CALENDAR_CATEGORIES = [
    { title: 'Politică Monetară', items: ['Discursuri Jerome Powell (FED)', 'Decizii Dobândă (FOMC)', 'Decizii BCE', 'Minutes FED/BCE'] },
    { title: 'Date Economice SUA', items: ['Non-Farm Payrolls', 'CPI / Core CPI', 'PCE Price Index', 'GDP Growth'] },
];

// --- Sub-components for Mobile & Shared ---

const NotionHeader: React.FC<{ icon?: string | React.ReactNode, title: string, subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-start gap-4 mb-6 pb-4 border-b border-white/10 px-2 md:px-0">
        {icon && <div className="text-3xl flex-shrink-0">{icon}</div>}
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400 mt-1 whitespace-normal">{subtitle}</p>}
        </div>
    </div>
);

const NotionCardGroup: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-8 break-inside-avoid">
        <div className="flex items-center gap-2 mb-3 px-2 md:px-0">
            {icon && <span className="text-gray-400 dark:text-zinc-500">{icon}</span>}
            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col border-t border-gray-100 dark:border-zinc-800/50">
            {children}
        </div>
    </div>
);

const NotionItemRow: React.FC<{ 
    icon?: React.ReactNode | string, 
    title: string, 
    subtitle?: string, 
    rightContent?: React.ReactNode, 
    href?: string,
    isExternal?: boolean
}> = ({ 
    icon, 
    title, 
    subtitle, 
    rightContent, 
    href, 
    isExternal 
}) => {
    const Wrapper = (href ? 'a' : 'div') as React.ElementType;
    const props = href ? { href, target: isExternal ? '_blank' : undefined, rel: isExternal ? 'noopener noreferrer' : undefined } : {};

    return (
        <Wrapper {...props} className="group flex items-center justify-between py-3 px-2 border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer">
            <div className="flex items-start gap-3 overflow-hidden">
                <div className="flex items-center justify-center w-5 h-5 text-sm flex-shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors mt-0.5">
                    {icon || <FileIcon className="w-4 h-4"/>}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white whitespace-normal transition-colors leading-snug">{title}</p>
                    {subtitle && <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5 whitespace-normal leading-relaxed opacity-80">{subtitle}</p>}
                </div>
            </div>
            {(rightContent || isExternal) && (
                <div className="flex items-center gap-3 pl-4 flex-shrink-0 self-center">
                    {rightContent}
                    {isExternal && <ExternalLinkIcon className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />}
                </div>
            )}
        </Wrapper>
    );
};

const MobileMarketTicker: React.FC<{ label: string, value: string, trend?: 'up' | 'down' | 'neutral' }> = ({ label, value, trend }) => (
    <div className="flex flex-col bg-transparent border-r border-gray-200 dark:border-zinc-800 px-4 min-w-[100px] flex-shrink-0 h-[48px] justify-center first:pl-0 last:border-0">
        <span className="text-[9px] text-gray-500 dark:text-zinc-500 font-semibold uppercase tracking-widest truncate">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono font-semibold text-gray-900 dark:text-zinc-100">{value}</span>
            {trend && (
                <span className={`text-[8px] ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                    {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'}
                </span>
            )}
        </div>
    </div>
);

// --- DESKTOP COMPONENTS ---

const RiskGauge = ({ value, scale = 1 }: { value: number, scale?: number }) => {
    const data = [
        { name: 'Extreme Fear', value: 25, color: '#ef4444' }, 
        { name: 'Fear', value: 20, color: '#f97316' },         
        { name: 'Neutral', value: 10, color: '#eab308' },      
        { name: 'Greed', value: 20, color: '#a3e635' },        
        { name: 'Extreme Greed', value: 25, color: '#22c55e' }, 
    ];
    
    let textColor = '#f59e0b';
    let text = 'Neutral';
    if (value <= 25) { textColor = '#ef4444'; text = 'Extreme Fear'; }
    else if (value <= 45) { textColor = '#f97316'; text = 'Fear'; }
    else if (value >= 75) { textColor = '#22c55e'; text = 'Extreme Greed'; }
    else if (value >= 55) { textColor = '#a3e635'; text = 'Greed'; }

    const rotation = (value / 100) * 180 - 90;

    return (
        <div className="relative" style={{ width: 192 * scale, height: 96 * scale }}>
            <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 192, height: 96 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="55%"
                            outerRadius="100%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center translate-y-6">
                    <span className="text-3xl font-bold text-white leading-none drop-shadow-md">{value}</span>
                    <span className="text-xs font-bold uppercase mt-1 tracking-wide whitespace-nowrap" style={{ color: textColor }}>{text}</span>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-slate-200 rounded-full border-2 border-slate-900 z-20 shadow-sm"></div>
                <div 
                    className="absolute bottom-0 left-1/2 w-1.5 h-[50%] bg-white origin-bottom transition-transform duration-1000 ease-out rounded-t-full shadow-xl z-10 border border-slate-400"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                ></div>
            </div>
        </div>
    );
};

const WatchlistCard = () => {
    const [activeTab, setActiveTab] = useState(categorizedWatchlistData[0].id);
    const activeCategory = categorizedWatchlistData.find((c: any) => c.id === activeTab);

    return (
        <Card className="flex flex-col h-auto overflow-hidden">
            <div className="p-5 pb-0 flex-shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 tracking-wider uppercase">Watchlist</h3>
                    <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">● Live Data</div>
                </div>
                
                <div className="flex w-full gap-2 mb-6 overflow-x-auto hide-scrollbar border-b border-white/5 pb-1">
                    {categorizedWatchlistData.map((cat: any) => {
                        const iconParts = cat.name.split(' ');
                        const label = iconParts.slice(1).join(' ');
                        
                        return (
                            <button 
                                key={cat.id} 
                                onClick={() => setActiveTab(cat.id)} 
                                className={`flex-1 min-w-[80px] flex flex-col items-center justify-center h-[50px] rounded-t-lg border-b-2 transition-all duration-200 px-1 hover:bg-white/[0.02] ${
                                    activeTab === cat.id 
                                    ? 'border-[var(--color-accent)] text-white' 
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <span className={`text-[9px] font-bold uppercase tracking-tight truncate w-full text-center leading-none ${activeTab === cat.id ? 'text-[var(--color-accent)]' : ''}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="px-5 pb-5 flex-1 overflow-y-auto custom-scrollbar">
                {activeCategory ? (
                    <div className="space-y-8">
                        {activeCategory.subCategories.map((sub: any, idx: number) => (
                            <div key={idx}>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 opacity-70">
                                    {sub.name}
                                </h4>
                                <div className="flex flex-col gap-1">
                                    {sub.assets.map((asset: any) => (
                                        <div key={asset.id} className="group relative flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                                                        {asset.name}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-slate-600 border border-slate-800 rounded px-1">
                                                        {asset.ticker.split(':')[1] || asset.ticker}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate opacity-80">
                                                    {asset.description || 'Asset Monitor'}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <a 
                                                    href={`https://www.tradingview.com/chart/?symbol=${asset.ticker}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-600 hover:text-[var(--color-accent)] hover:bg-white/5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                    title="View on TradingView"
                                                >
                                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">Selectează o categorie</div>
                )}
            </div>
        </Card>
    );
};

const MacroIndicatorsCard = () => {
    return (
        <Card className="flex flex-col h-auto overflow-hidden p-5">
            <div className="mb-6 border-b border-white/5 pb-2">
                <h3 className="text-lg font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    Indicatori Macro
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {MACRO_INDICATORS_DATA.map((cat, i) => (
                    <div key={i} className="flex flex-col">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mb-3 border-b border-white/5 pb-2 opacity-90">
                            {cat.icon} {cat.category}
                        </h4>
                        <div className="space-y-1">
                            {cat.items.map((item, j) => (
                                <div key={j} className="group flex items-start justify-between py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                                    <div className="flex flex-col pr-2">
                                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{item.name}</span>
                                        <span className="text-[10px] text-slate-500 leading-tight mt-0.5 opacity-80">{item.desc}</span>
                                    </div>
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 mt-0.5 text-slate-600 hover:text-[var(--color-accent)] transition-colors opacity-0 group-hover:opacity-100"
                                        title="View Source"
                                    >
                                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const ResourcesCard = () => {
    return (
        <Card className="flex flex-col h-auto overflow-hidden p-5">
            <div className="mb-6 border-b border-white/5 pb-2">
                <h3 className="text-lg font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    Resurse de Research
                </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {EXTENDED_RESOURCES.map((cat, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1 opacity-70">
                            {cat.title}
                        </h4>
                        <div className="space-y-1.5">
                            {cat.items.map((res, j) => (
                                <a 
                                    key={j} 
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[var(--color-accent)]/30 hover:bg-white/[0.05] transition-all cursor-pointer relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate pr-4 transition-colors">{res.name}</span>
                                        <ExternalLinkIcon className="w-3 h-3 text-slate-600 group-hover:text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-all absolute top-2.5 right-2" />
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-medium leading-tight mt-1 truncate opacity-80">{res.desc}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const EconomicCalendarCard = () => {
    return (
        <Card className="flex flex-col h-auto overflow-hidden p-5">
            <div className="mb-6 border-b border-white/5 pb-2">
                <h3 className="text-lg font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    Calendar Economic
                </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                {CALENDAR_CATEGORIES.map((cat, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                        <h4 className="text-[10px] font-bold text-[var(--color-accent)] uppercase mb-2 tracking-wide opacity-90">{cat.title}</h4>
                        <ul className="space-y-1.5">
                            {cat.items.map((item, j) => (
                                <li key={j} className="text-xs text-slate-300 flex items-start gap-2 font-medium">
                                    <span className="text-slate-600 mt-1 text-[8px]">●</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="flex flex-col">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1 opacity-70">Evenimente Următoare</h4>
                {economicEvents.length > 0 ? economicEvents.map((event, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center justify-center min-w-[3rem] p-1 bg-white/5 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{event.date.split('-')[1]}</span>
                                <span className="text-sm font-bold text-white">{event.date.split('-')[2]}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{event.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${event.impact === 'high' ? 'bg-red-500' : event.impact === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold">Impact {event.impact}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 text-center py-4 text-sm">Niciun eveniment major listat.</p>
                )}
            </div>
        </Card>
    );
};

// --- Main Component ---

const Research: React.FC<{ hasDock?: boolean }> = ({ hasDock }) => {
    // Mobile State
    const [activeMobileTab, setActiveMobileTab] = useState<'indicators' | 'resources' | 'calendar' | 'watchlist'>('indicators');
    const [activeWatchlistCategory, setActiveWatchlistCategory] = useState(categorizedWatchlistData[0].id);
    
    // Live Data State
    const [marketIndicators, setMarketIndicators] = useState<MarketIndicator[]>(initialMarketIndicators);
    const [fearGreedValue, setFearGreedValue] = useState(34);

    useEffect(() => {
        const fetchMarketData = async () => {
            const symbols = initialMarketIndicators.map(i => i.symbol).join(',');
            try {
                const response = await fetch(`https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${TWELVE_DATA_API_KEY}`);
                if (!response.ok) throw new Error(`Twelve Data API error: ${response.statusText}`);
                const data = await response.json();

                const updatedIndicators = initialMarketIndicators.map(indicator => {
                    const apiData = data[indicator.symbol];
                    if (apiData && apiData.close) {
                        const price = parseFloat(apiData.close);
                        const changeVal = parseFloat(apiData.change);
                        const percentChange = parseFloat(apiData.percent_change);

                        let formattedValue = price.toLocaleString('en-US', indicator.formattingOptions);
                        if (indicator.symbol === 'CRYPTOCAP:BTC.D') formattedValue += '%';
                        
                        return {
                            ...indicator,
                            value: formattedValue,
                            change: `${percentChange.toFixed(2)}%`,
                            changeType: changeVal >= 0 ? 'increase' : 'decrease' as 'increase' | 'decrease',
                        };
                    }
                    return indicator;
                });
                setMarketIndicators(updatedIndicators);
            } catch (error) {
                console.error("Failed to fetch market data:", error);
            }

            try {
                const fgResponse = await fetch(`https://api.alternative.me/fng/?limit=1`);
                if (fgResponse.ok) {
                    const fgData = await fgResponse.json();
                    if (fgData?.data?.[0]) setFearGreedValue(parseInt(fgData.data[0].value, 10));
                }
            } catch (error) { console.error("Failed to fetch FG:", error); }
        };

        fetchMarketData();
        const intervalId = setInterval(fetchMarketData, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, []);

    const renderMobileIndicators = () => (
        <div className="animate-fade-in space-y-6 pt-4">
            <NotionHeader title="Indicatori de Piață" subtitle="Tablou de bord live pentru sănătatea pieței." icon="📊" />
            
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar px-2 md:px-0 items-center">
                {marketIndicators.map((ind, i) => (
                    <MobileMarketTicker key={i} label={ind.name} value={ind.value} trend={ind.changeType === 'increase' ? 'up' : ind.changeType === 'decrease' ? 'down' : 'neutral'} />
                ))}
                
                <div className="bg-transparent border border-white/5 p-2 rounded-lg min-w-[140px] flex-shrink-0 h-[56px] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-15 pointer-events-none transform scale-125 translate-y-1">
                         <RiskGauge value={fearGreedValue} scale={0.5} />
                    </div>
                    <div className="flex flex-col items-center relative z-10">
                        <span className="text-[9px] text-slate-500 font-bold uppercase truncate">Fear & Greed</span>
                        <span className="text-xs font-mono font-bold text-white mt-0.5">{fearGreedValue}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {MACRO_INDICATORS_DATA.map((cat, i) => (
                    <NotionCardGroup key={i} title={cat.category} icon={cat.icon}>
                        {cat.items.map((item, j) => (
                            <NotionItemRow 
                                key={j} 
                                title={item.name} 
                                subtitle={item.desc} 
                                href={item.url} 
                                isExternal 
                                icon={<ActivityIcon className="w-4 h-4"/>} 
                            />
                        ))}
                    </NotionCardGroup>
                ))}
            </div>
        </div>
    );

    const renderMobileResources = () => (
        <div className="animate-fade-in space-y-6 pt-4">
            <NotionHeader title="Resurse" subtitle="Platforme și instrumente esențiale pentru analiză." icon="📚" />
            <div className="grid grid-cols-1 gap-6 bg-transparent border-t border-white/5 pt-4">
                {EXTENDED_RESOURCES.map((cat, i) => (
                    <div key={i}>
                        <h4 className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 opacity-80">{cat.title}</h4>
                        {cat.items.map((res, j) => (
                            <a 
                                key={j} 
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 py-3 border-b border-white/5 px-2 last:border-0 active:bg-white/5 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-200 text-sm">{res.name}</h3>
                                        <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 opacity-80">{res.desc}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMobileCalendar = () => (
        <div className="animate-fade-in space-y-6 pt-4">
            <NotionHeader title="Calendar Economic" subtitle="Evenimente macroeconomice cheie de urmărit." icon="📅" />
            
            <div className="px-2 mb-4 space-y-4">
                 {CALENDAR_CATEGORIES.map((cat, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <h4 className="text-[10px] font-bold text-[var(--color-accent)] uppercase mb-2 opacity-90">{cat.title}</h4>
                        <ul className="space-y-1.5">
                            {cat.items.map((item, j) => (
                                <li key={j} className="text-xs text-slate-300 flex items-start gap-2">
                                    <span className="text-slate-600 mt-1 text-[8px]">●</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="flex flex-col border-t border-white/5">
                {economicEvents.length > 0 ? economicEvents.map((event, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-2 border-b border-white/5">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{event.date}</p>
                            <p className="text-sm font-semibold text-slate-200 whitespace-normal">{event.name}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase whitespace-nowrap ml-3 ${event.impact === 'high' ? 'bg-red-500/10 text-red-400' : event.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                            {event.impact}
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 text-center py-8">Niciun eveniment major listat.</p>
                )}
            </div>
        </div>
    );

    const renderMobileWatchlist = () => {
        const activeCategoryData = categorizedWatchlistData.find((c: any) => c.id === activeWatchlistCategory);
        
        return (
            <div className="animate-fade-in pt-4">
                <NotionHeader title="Watchlist" subtitle="Monitorizează activele de interes." icon="👁️" />
                
                <div className="flex w-full gap-1 mb-6 sticky top-0 bg-[#0D1117]/95 backdrop-blur-md z-20 py-2 border-b border-white/5">
                    {categorizedWatchlistData.map((cat: any) => {
                        const iconParts = cat.name.split(' ');
                        const icon = iconParts[0];
                        const label = iconParts.slice(1).join(' ');
                        
                        return (
                            <button 
                                key={cat.id} 
                                onClick={() => setActiveWatchlistCategory(cat.id)} 
                                className={`flex-1 min-w-0 flex flex-col items-center justify-center h-[50px] rounded-lg border-b-2 transition-all duration-200 px-0.5 ${
                                    activeWatchlistCategory === cat.id 
                                    ? 'border-[var(--color-accent)] text-white' 
                                    : 'border-transparent text-slate-500'
                                }`}
                            >
                                <span className={`text-lg mb-0.5 ${activeWatchlistCategory === cat.id ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                    {icon}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-tight truncate w-full text-center leading-none ${activeWatchlistCategory === cat.id ? 'text-[var(--color-accent)]' : ''}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="pb-32 min-h-[50vh]">
                    {activeCategoryData && (
                        <div className="space-y-8">
                            {activeCategoryData.subCategories.map((sub: any, idx: number) => (
                                <NotionCardGroup key={idx} title={sub.name}>
                                    {sub.assets.map((asset: any) => (
                                        <NotionItemRow 
                                            key={asset.id} 
                                            title={asset.name} 
                                            subtitle={asset.description || asset.ticker} 
                                            href={`https://www.tradingview.com/chart/?symbol=${asset.ticker}`}
                                            isExternal
                                            icon={<span className="text-[9px] font-mono font-bold text-slate-500 border border-slate-700 rounded px-1">{asset.ticker.split(':')[1]?.substring(0,3) || 'ASC'}</span>} 
                                        />
                                    ))}
                                </NotionCardGroup>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen">
            <div className="hidden md:flex flex-col min-h-screen container mx-auto px-6 max-w-[1920px] pt-6 pb-12">
                
                <div className="flex-shrink-0 grid grid-cols-12 gap-6 mb-6 items-center h-auto min-h-[5rem]">
                    <div className="col-span-12 lg:col-span-3 mb-4 lg:mb-0">
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Research & Insights</h1>
                    </div>
                    <div className="col-span-12 lg:col-span-9 flex items-center justify-start lg:justify-end h-full overflow-x-auto hide-scrollbar pb-2 lg:pb-0">
                        <div className="flex items-center gap-6 flex-nowrap">
                            <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
                                {marketIndicators.map((ind, i) => (
                                    <div key={i} className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{ind.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-white font-mono text-sm font-bold">{ind.value}</span>
                                            {ind.changeType !== 'neutral' && <span className={`text-[9px] ${ind.changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>{ind.changeType === 'increase' ? '▲' : '▼'}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
                            
                            <div className="flex flex-col items-center flex-shrink-0 pl-2 -mt-6">
                                <RiskGauge value={fearGreedValue} scale={0.75} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[1.5fr_1fr] gap-8 items-start">
                    
                    <div className="flex flex-col gap-8">
                        <div className="min-h-0">
                            <WatchlistCard />
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="min-h-0">
                            <MacroIndicatorsCard />
                        </div>
                        <div className="min-h-0">
                            <EconomicCalendarCard />
                        </div>
                        <div className="min-h-0">
                            <ResourcesCard />
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:hidden pb-40">
                <div className="container mx-auto px-0 pt-2">
                    {activeMobileTab === 'indicators' && renderMobileIndicators()}
                    {activeMobileTab === 'resources' && renderMobileResources()}
                    {activeMobileTab === 'calendar' && renderMobileCalendar()}
                    {activeMobileTab === 'watchlist' && renderMobileWatchlist()}
                </div>
                
                <div 
                    className="fixed left-0 right-0 z-40 bg-white/90 dark:bg-pplx-primary/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 p-2 flex justify-around items-center gap-2"
                    style={{
                        bottom: hasDock ? "calc(72px + 56px + env(safe-area-inset-bottom))" : "56px",
                    }}
                >
                    {[
                        { id: 'indicators', label: 'Indicatori' },
                        { id: 'resources', label: 'Resurse' },
                        { id: 'calendar', label: 'Calendar' },
                        { id: 'watchlist', label: 'Watchlist' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveMobileTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all duration-200 ${
                                activeMobileTab === tab.id
                                    ? 'bg-zinc-100 dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm'
                                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Research;
