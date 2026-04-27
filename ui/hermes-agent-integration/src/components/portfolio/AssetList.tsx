import React from "react";
import { Asset, Position } from "../../types/portfolio";
import { TrendingUp, TrendingDown, ChevronRight, Plus } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  positions: Position[];
  onEdit: (id: string) => void;
  viewMode?: "grid" | "list";
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  positions,
  onEdit,
  viewMode = "list",
}) => {
  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-pplx-card p-12 rounded-xl border border-gray-200 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-1 uppercase tracking-tight">
          No Assets Yet
        </h3>
        <p className="text-gray-500 dark:text-zinc-500 text-xs max-w-[200px]">
          Start building your portfolio by adding your first position.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="bg-white dark:bg-pplx-card p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-800/50 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">
            Your Assets
          </h3>
          <span className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-800 uppercase tracking-tight">
            {positions.length} Positions
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {positions.map((pos) => {
            const asset = assets.find((a) => a.id === pos.assetId);
            if (!asset) return null;
            const value = pos.shares * pos.currentPrice;
            const profit = (pos.currentPrice - pos.costBasis) * pos.shares;
            const profitPercent =
              ((pos.currentPrice - pos.costBasis) / pos.costBasis) * 100;

            return (
              <div
                key={pos.id}
                onClick={() => onEdit(pos.id)}
                className="p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-zinc-800/50 hover:border-gray-200 dark:hover:border-zinc-700 transition-all cursor-pointer group bg-gray-50/30 dark:bg-zinc-900/10 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform"
                      style={{ color: asset.color }}
                    >
                      {asset.type === "Crypto" ? "₿" : "📈"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                        {asset.symbol}
                      </div>
                      <div className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-tight">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">
                      Value
                    </div>
                    <div className="text-base font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                      $
                      {value.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">
                      Return
                    </div>
                    <div
                      className={`text-[11px] font-bold flex items-center gap-1 ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {profit >= 0 ? (
                        <TrendingUp size={10} />
                      ) : (
                        <TrendingDown size={10} />
                      )}
                      {profitPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-pplx-card p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-zinc-800/50 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">
          Your Assets
        </h3>
        <span className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-800 uppercase tracking-tight">
          {positions.length} Positions
        </span>
      </div>
      <div className="space-y-1">
        {positions.map((pos) => {
          const asset = assets.find((a) => a.id === pos.assetId);
          if (!asset) return null;
          const value = pos.shares * pos.currentPrice;
          const profit = (pos.currentPrice - pos.costBasis) * pos.shares;
          const profitPercent =
            ((pos.currentPrice - pos.costBasis) / pos.costBasis) * 100;

          return (
            <div
              key={pos.id}
              onClick={() => onEdit(pos.id)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-zinc-800 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-base group-hover:bg-white dark:group-hover:bg-zinc-800 group-hover:shadow-sm transition-all"
                  style={{ color: asset.color }}
                >
                  {asset.type === "Crypto" ? "₿" : "📈"}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                    {asset.symbol}
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase font-bold tracking-tight">
                    {asset.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                  $
                  {value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div
                  className={`text-[9px] font-bold flex items-center justify-end gap-1 ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {profitPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
