import React from 'react';
import { HERMES_CAPABILITIES } from '../services/agent/HermesRegistry';

export const AgentSettings: React.FC = () => {
    return (
        <div className="p-6 overflow-y-auto h-full bg-[#1a1b1e] text-white">
            <h1 className="text-2xl font-bold mb-8">Hermes Agent Configuration</h1>

            {Object.entries(HERMES_CAPABILITIES).map(([category, items]) => (
                <section key={category} className="mb-10">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                        {category.replace('_', ' ')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 rounded-xl border border-gray-800 bg-[#25262b] hover:border-blue-500 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-2 rounded-lg bg-gray-800 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        {/* Aici ar veni iconița corespunzătoare */}
                                        <span className="text-xs font-bold uppercase">{item.id.substring(0, 2)}</span>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                                <h3 className="font-medium text-gray-100">{item.name}</h3>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        connected: 'bg-green-500/10 text-green-500 border-green-500/20',
        installed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        available: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };

    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[status]}`}>
            {status}
        </span>
    );
};