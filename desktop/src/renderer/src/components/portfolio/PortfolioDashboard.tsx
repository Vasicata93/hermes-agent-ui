import React, { useState, useEffect, useMemo } from "react";
import { PortfolioHeader, StatsOverview } from "./DashboardHeader";
import { AllocationChart } from "./AllocationChart";
import { PerformanceChart } from "./PerformanceChart";
import { PortfolioValueChart } from "./PortfolioValueChart";
import { AssetList } from "./AssetList";
import { AssetModal } from "./AssetModal";
import Journal from "./Journal";
import Research from "./Research";
import StrategyComponent from "./Strategy";
import { portfolioService } from "../../services/portfolioService";
import {
  Asset,
  Position,
  PerformancePoint,
  HistoricalPoint,
} from "../../types/portfolio";
import { v4 as uuidv4 } from "uuid";
import { RefreshCcw, Download, LayoutGrid, List as ListIcon } from "lucide-react";

declare global {
  interface Window {
    portfolioActions?: {
      getAssets: () => Asset[];
      getPositions: () => Position[];
      addAssetAndPosition: (
        asset: Partial<Asset>,
        position: Partial<Position>,
      ) => Promise<void>;
      updateAssetAndPosition: (
        positionId: string,
        asset: Partial<Asset>,
        position: Partial<Position>,
      ) => Promise<void>;
      deletePosition: (positionId: string) => Promise<void>;
    };
  }
}

interface PortfolioDashboardProps {
  hasDock?: boolean;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  hasDock = false,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [performance, setPerformance] = useState<PerformancePoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [psychologicalScores, setPsychologicalScores] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [sortBy] = useState<"value" | "name" | "performance">("value");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "strategy" | "journal" | "research" | "settings"
  >("portfolio");

  // AI Action Bridge
  useEffect(() => {
    window.portfolioActions = {
      getAssets: () => assets,
      getPositions: () => positions,
      addAssetAndPosition: async (assetData, positionData) => {
        const assetId = uuidv4();
        const posId = uuidv4();
        const newAsset = { ...assetData, id: assetId } as Asset;
        const newPos = {
          ...positionData,
          id: posId,
          assetId,
          lastUpdate: Date.now(),
        } as Position;

        const newAssets = [...assets, newAsset];
        const newPositions = [...positions, newPos];

        setAssets(newAssets);
        setPositions(newPositions);
        await portfolioService.saveAssets(newAssets);
        await portfolioService.savePositions(newPositions);
      },
      updateAssetAndPosition: async (positionId, assetData, positionData) => {
        const existingPos = positions.find((p) => p.id === positionId);
        if (!existingPos) return;

        const newPositions = positions.map((p) =>
          p.id === positionId
            ? ({
                ...p,
                ...positionData,
                id: p.id,
                assetId: p.assetId,
                lastUpdate: Date.now(),
              } as Position)
            : p,
        );
        const newAssets = assets.map((a) =>
          a.id === existingPos.assetId
            ? ({ ...a, ...assetData, id: a.id } as Asset)
            : a,
        );

        setAssets(newAssets);
        setPositions(newPositions);
        await portfolioService.saveAssets(newAssets);
        await portfolioService.savePositions(newPositions);
      },
      deletePosition: async (positionId) => {
        const newPositions = positions.filter((p) => p.id !== positionId);
        setPositions(newPositions);
        await portfolioService.savePositions(newPositions);
      },
    };
    return () => {
      delete window.portfolioActions;
    };
  }, [assets, positions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await portfolioService.initializeDefaultData();
      const [a, p, perf, hist, entries, moods, scores, plns, objs, rls] = await Promise.all([
        portfolioService.getAssets(),
        portfolioService.getPositions(),
        portfolioService.getPerformance(),
        portfolioService.getHistoricalPortfolioData(),
        portfolioService.getJournalEntries(),
        portfolioService.getMoodLogs(),
        portfolioService.getPsychologicalScores(),
        portfolioService.getPlans(),
        portfolioService.getObjectives(),
        portfolioService.getRules(),
      ]);
      console.log("PortfolioDashboard: Loaded data:", {
        assets: a,
        positions: p,
      });
      setAssets(a);
      setPositions(p);
      setPerformance(perf);
      setHistoricalData(hist);
      setJournalEntries(entries);
      setMoodLogs(moods);
      setPsychologicalScores(scores);
      setPlans(plns);
      setObjectives(objs);
      setRules(rls);
    } catch (error) {
      console.error("PortfolioDashboard: Failed to load portfolio data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("portfolio-updated", loadData);
    return () => window.removeEventListener("portfolio-updated", loadData);
  }, []);

  const filteredAndSortedPositions = useMemo(() => {
    let result = positions.map((pos) => {
      const asset = assets.find((a) => a.id === pos.assetId);
      return { ...pos, asset };
    });

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.asset?.name.toLowerCase().includes(q) ||
          p.asset?.symbol.toLowerCase().includes(q),
      );
    }

    // Filter
    if (filterType !== "All") {
      result = result.filter((p) => p.asset?.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "value") {
        return b.shares * b.currentPrice - a.shares * a.currentPrice;
      }
      if (sortBy === "name") {
        return (a.asset?.name || "").localeCompare(b.asset?.name || "");
      }
      if (sortBy === "performance") {
        const perfA = (a.currentPrice - a.costBasis) / a.costBasis;
        const perfB = (b.currentPrice - b.costBasis) / b.costBasis;
        return perfB - perfA;
      }
      return 0;
    });

    return result;
  }, [positions, assets, searchQuery, filterType, sortBy]);

  const totalValue = positions.reduce(
    (sum, pos) => sum + pos.shares * pos.currentPrice,
    0,
  );

  // Mock metrics for now
  const ytd = 12.4;
  const lastMonth = 4.2;

  const handleSave = async (asset: Asset, position: Position) => {
    let newAssets = [...assets];
    let newPositions = [...positions];

    if (editingPositionId) {
      // Update
      const existingPos = positions.find((p) => p.id === editingPositionId);
      if (existingPos) {
        newPositions = newPositions.map((p) =>
          p.id === editingPositionId
            ? {
                ...position,
                id: p.id,
                assetId: p.assetId,
                lastUpdate: Date.now(),
              }
            : p,
        );
        newAssets = newAssets.map((a) =>
          a.id === existingPos.assetId ? { ...asset, id: a.id } : a,
        );
      }
    } else {
      // Create
      const assetId = uuidv4();
      const posId = uuidv4();
      const newAsset = { ...asset, id: assetId };
      const newPos = {
        ...position,
        id: posId,
        assetId,
        lastUpdate: Date.now(),
      };
      newAssets.push(newAsset);
      newPositions.push(newPos);
    }

    setAssets(newAssets);
    setPositions(newPositions);
    console.log(
      "PortfolioDashboard: handleSave - newAssets:",
      newAssets,
      "newPositions:",
      newPositions,
    );
    try {
      await portfolioService.saveAssets(newAssets);
      await portfolioService.savePositions(newPositions);
      console.log("Portfolio data saved successfully to IndexedDB");
    } catch (error) {
      console.error("Failed to save portfolio data", error);
    }
    setIsModalOpen(false);
    setEditingPositionId(null);
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all portfolio data? This action cannot be undone.",
      )
    ) {
      try {
        await portfolioService.resetData();
        await loadData();
        console.log("Portfolio data reset successfully");
      } catch (error) {
        console.error("Failed to reset portfolio data", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const newPositions = positions.filter((p) => p.id !== id);
    setPositions(newPositions);
    await portfolioService.savePositions(newPositions);
    setIsModalOpen(false);
    setEditingPositionId(null);
  };

  // --- Journal Handlers ---
  const handleAddJournalEntry = async (entry: any) => {
    const newEntries = [{ ...entry, id: uuidv4() }, ...journalEntries];
    setJournalEntries(newEntries);
    await portfolioService.saveJournalEntries(newEntries);
  };

  const handleUpdateJournalEntry = async (entry: any) => {
    const newEntries = journalEntries.map(e => e.id === entry.id ? entry : e);
    setJournalEntries(newEntries);
    await portfolioService.saveJournalEntries(newEntries);
  };

  const handleDeleteJournalEntry = async (id: string | number) => {
    const newEntries = journalEntries.filter(e => e.id !== id);
    setJournalEntries(newEntries);
    await portfolioService.saveJournalEntries(newEntries);
  };

  const handleAddMoodLog = async (log: any) => {
    const newLogs = [{ ...log, id: uuidv4() }, ...moodLogs];
    setMoodLogs(newLogs);
    await portfolioService.saveMoodLogs(newLogs);
  };

  const handleAddPsychologicalScore = async (score: any) => {
    const newScores = [{ ...score, id: uuidv4() }, ...psychologicalScores];
    setPsychologicalScores(newScores);
    await portfolioService.savePsychologicalScores(newScores);
  };

  // --- Strategy Handlers ---
  const handleAddPlan = async (plan: any) => {
    const newPlans = [{ ...plan, id: uuidv4() }, ...plans];
    setPlans(newPlans);
    await portfolioService.savePlans(newPlans);
  };

  const handleUpdatePlan = async (plan: any) => {
    const newPlans = plans.map(p => p.id === plan.id ? plan : p);
    setPlans(newPlans);
    await portfolioService.savePlans(newPlans);
  };

  const handleDeletePlan = async (id: string | number) => {
    const newPlans = plans.filter(p => p.id !== id);
    setPlans(newPlans);
    await portfolioService.savePlans(newPlans);
  };

  const handleAddObjective = async (obj: any) => {
    const newObjs = [...objectives, { ...obj, id: uuidv4() }];
    setObjectives(newObjs);
    await portfolioService.saveObjectives(newObjs);
  };

  const handleUpdateObjective = async (obj: any) => {
    const newObjs = objectives.map(o => o.id === obj.id ? obj : o);
    setObjectives(newObjs);
    await portfolioService.saveObjectives(newObjs);
  };

  const handleDeleteObjective = async (id: string | number) => {
    const newObjs = objectives.filter(o => o.id !== id);
    setObjectives(newObjs);
    await portfolioService.saveObjectives(newObjs);
  };

  const handleAddRule = async (rule: any) => {
    const newRules = [...rules, { ...rule, id: uuidv4() }];
    setRules(newRules);
    await portfolioService.saveRules(newRules);
  };

  const handleUpdateRule = async (rule: any) => {
    const newRules = rules.map(r => r.id === rule.id ? rule : r);
    setRules(newRules);
    await portfolioService.saveRules(newRules);
  };

  const handleDeleteRule = async (id: string | number) => {
    const newRules = rules.filter(r => r.id !== id);
    setRules(newRules);
    await portfolioService.saveRules(newRules);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "strategy":
        return (
          <div className="animate-fadeIn">
            <StrategyComponent
              positions={positions.map(p => ({
                id: p.id,
                name: assets.find(a => a.id === p.assetId)?.name || 'Unknown',
                type: 'buy', // Default for now
                category: assets.find(a => a.id === p.assetId)?.type || 'General',
                entryPrice: p.avgCost,
                targetPrice: p.currentPrice * 1.2, // Mock target
                stopLoss: p.avgCost * 0.9, // Mock stop loss
                riskRewardRatio: '1:2',
                strategy: 'HODL',
                status: 'in-progress',
                dateAdded: new Date(p.lastUpdate).toISOString().split('T')[0]
              }))}
              hasDock={hasDock}
              onAddPosition={async (posData) => {
                const assetId = uuidv4();
                const posId = uuidv4();
                const newAsset: Asset = {
                  id: assetId,
                  name: posData.name,
                  symbol: posData.name.substring(0, 4).toUpperCase(),
                  type: (posData.category as any) || 'Equity',
                  sector: '',
                  emoji: '📈',
                  color: '#6366f1'
                };
                const newPos: Position = {
                  id: posId,
                  assetId,
                  shares: 0,
                  avgCost: posData.entryPrice,
                  costBasis: 0,
                  currentPrice: posData.entryPrice,
                  lastUpdate: Date.now(),
                  targetPrice: posData.targetPrice,
                  stopLoss: posData.stopLoss,
                  riskRewardRatio: posData.riskRewardRatio,
                  strategy: posData.strategy,
                  status: posData.status,
                  type: posData.type
                };
                const newAssets = [...assets, newAsset];
                const newPositions = [...positions, newPos];
                setAssets(newAssets);
                setPositions(newPositions);
                await portfolioService.saveAssets(newAssets);
                await portfolioService.savePositions(newPositions);
              }}
              onUpdatePosition={async (posData) => {
                const existingPos = positions.find(p => p.id === posData.id);
                if (!existingPos) return;
                const newPositions = positions.map(p => p.id === posData.id ? {
                  ...p,
                  avgCost: posData.entryPrice,
                  targetPrice: posData.targetPrice,
                  stopLoss: posData.stopLoss,
                  riskRewardRatio: posData.riskRewardRatio,
                  strategy: posData.strategy,
                  status: posData.status,
                  type: posData.type,
                  lastUpdate: Date.now()
                } : p);
                setPositions(newPositions);
                await portfolioService.savePositions(newPositions);
              }}
              onDeletePosition={(id) => handleDelete(id as string)}
              plans={plans}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              objectives={objectives}
              onAddObjective={handleAddObjective}
              onUpdateObjective={handleUpdateObjective}
              onDeleteObjective={handleDeleteObjective}
              rules={rules}
              onAddRule={handleAddRule}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
              latestPsychologicalScore={psychologicalScores[0]}
              onNavigate={(tab) => setActiveTab(tab as any)}
            />
          </div>
        );
      case "journal":
        return (
          <div className="animate-fadeIn">
            <Journal
              entries={journalEntries}
              hasDock={hasDock}
              onAddEntry={handleAddJournalEntry}
              onUpdateEntry={handleUpdateJournalEntry}
              onDeleteEntry={handleDeleteJournalEntry}
              moodLogs={moodLogs}
              onAddMoodLog={handleAddMoodLog}
              psychologicalScores={psychologicalScores}
              onAddPsychologicalScore={handleAddPsychologicalScore}
              behavioralMetrics={{
                fomoScore: journalEntries.filter(e => e.tags.includes('fomo')).length * 10,
                fudScore: journalEntries.filter(e => e.tags.includes('fud')).length * 10,
                disciplineScore: 85,
                emotionalDecisions: journalEntries.filter(e => e.tags.includes('emotion')).length,
                logicalDecisions: journalEntries.filter(e => e.tags.includes('decision')).length,
              }}
            />
          </div>
        );
      case "research":
        return (
          <div className="animate-fadeIn">
            <Research hasDock={hasDock} />
          </div>
        );
      case "settings":
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-8">
            <div className="bg-white dark:bg-pplx-card p-8 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                General Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                      Base Currency
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                      Choose your primary currency for reporting
                    </div>
                  </div>
                  <select className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all">
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="h-px bg-gray-100 dark:bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                      Dark Mode
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                      Toggle between light and dark themes
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white dark:bg-pplx-primary rounded-full shadow-sm transition-all" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-pplx-card p-8 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                Data Management
              </h3>
              <div className="space-y-4">
                <button className="w-full py-4 px-6 bg-gray-50 dark:bg-zinc-900/30 hover:bg-gray-100 dark:hover:bg-zinc-800/50 rounded-2xl text-sm font-semibold text-gray-900 dark:text-zinc-100 transition-all text-left flex items-center justify-between border border-gray-100 dark:border-zinc-800/50 hover:border-gray-200 dark:hover:border-zinc-700/50">
                  <span>Backup Data</span>
                  <Download size={18} className="text-gray-400 dark:text-zinc-500" />
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-4 px-6 bg-rose-50 dark:bg-rose-500/5 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-2xl text-sm font-semibold text-rose-600 dark:text-rose-400 transition-all text-left flex items-center justify-between border border-rose-100 dark:border-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20"
                >
                  <span>Reset All Data</span>
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <>
            <StatsOverview
              totalValue={totalValue}
              ytd={ytd}
              lastMonth={lastMonth}
              onNewEntry={() => {
                setEditingPositionId(null);
                setIsModalOpen(true);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 mt-4 md:mt-10">
              {/* Allocation Chart - Always First */}
              <div className="lg:col-span-2 order-1">
                <AllocationChart assets={assets} positions={positions} />
              </div>

              {/* Asset List Section - Second on Mobile, Sidebar on Desktop */}
              <div className="lg:col-span-1 order-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-pplx-secondary p-1 rounded-xl border border-gray-100 dark:border-zinc-800">
                    {["All", "Stock", "Crypto", "Cash"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all whitespace-nowrap ${
                          filterType === type
                            ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm"
                            : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-pplx-secondary p-1 rounded-xl border border-gray-100 dark:border-zinc-800 hidden sm:flex">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                      <LayoutGrid size={14} />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                      <ListIcon size={14} />
                    </button>
                  </div>
                </div>

                <AssetList
                  assets={assets}
                  positions={filteredAndSortedPositions as any}
                  onEdit={(id) => {
                    setEditingPositionId(id);
                    setIsModalOpen(true);
                  }}
                  viewMode={viewMode}
                />
              </div>

              {/* Performance Chart - Third on Mobile, Main Column on Desktop */}
              <div className="lg:col-span-3 order-3 space-y-6">
                <PortfolioValueChart 
                  data={historicalData} 
                  currentTotalValue={totalValue} 
                />
                <PerformanceChart data={performance} />
              </div>
            </div>
          </>
        );
    }
  };

  const editingPosition = editingPositionId
    ? positions.find((p) => p.id === editingPositionId)
    : undefined;
  const editingAsset = editingPosition
    ? assets.find((a) => a.id === editingPosition.assetId)
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-pplx-primary flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-zinc-900 dark:text-zinc-100 animate-spin" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">
            Loading Portfolio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full bg-white dark:bg-pplx-primary text-gray-900 dark:text-zinc-100 font-sans selection:bg-zinc-500/20 selection:text-zinc-900 dark:selection:text-zinc-100 ${hasDock ? "pb-[80px] md:pb-0" : ""} transition-colors duration-300`}
    >
      {/* Semantic Data Layer for AI Agent */}
      <script
        id="portfolio-semantic-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            assets,
            positions,
            performance,
          }),
        }}
      />
      <PortfolioHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasDock={hasDock}
      />

      <main className={`w-full p-3 md:p-12 ${hasDock ? "pb-40" : "pb-32"}`}>
        <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
      </main>

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPositionId(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialAsset={editingAsset}
        initialPosition={editingPosition}
      />
    </div>
  );
};
