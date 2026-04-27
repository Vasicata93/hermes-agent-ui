import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Asset, Position } from "../../types/portfolio";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset, position: Position) => void;
  onDelete?: (id: string) => void;
  initialAsset?: Asset;
  initialPosition?: Position;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAsset,
  initialPosition,
}) => {
  const [asset, setAsset] = useState<Asset>(
    initialAsset || {
      id: "",
      name: "",
      symbol: "",
      type: "Equity",
      sector: "",
      emoji: "📈",
      color: "#6366f1",
    },
  );
  const [position, setPosition] = useState<Position>(
    initialPosition || {
      id: "",
      assetId: "",
      shares: 0,
      avgCost: 0,
      costBasis: 0,
      currentPrice: 0,
      lastUpdate: Date.now(),
    },
  );

  useEffect(() => {
    if (initialAsset) setAsset(initialAsset);
    if (initialPosition) setPosition(initialPosition);
  }, [initialAsset, initialPosition]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(asset, position);
  };

  const updatePosition = (newPosition: Partial<Position>) => {
    const updated = { ...position, ...newPosition };
    if (newPosition.shares !== undefined || newPosition.avgCost !== undefined) {
      updated.costBasis = updated.shares * updated.avgCost;
    }
    setPosition(updated);
  };

  const labelClass = "text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block";
  const inputClass = "w-full bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-700";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/20 dark:bg-black/60 backdrop-blur-[4px] animate-fadeIn">
      <div className="bg-white dark:bg-[#191919] w-full max-w-lg h-full sm:h-auto sm:rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-0 sm:border border-gray-200 dark:border-zinc-800 animate-slideUp">
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
              {asset.emoji}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                {initialAsset ? asset.name : "Adaugă Activ Nou"}
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                {initialAsset ? "Editează Detalii" : "Configurează Portofoliul"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-gray-400 dark:text-zinc-500 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 sm:px-8 py-6 sm:py-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Nume Activ</label>
                <input
                  required
                  className={inputClass}
                  placeholder="ex: Apple Inc."
                  value={asset.name}
                  onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Simbol</label>
                <input
                  required
                  className={inputClass}
                  placeholder="AAPL"
                  value={asset.symbol}
                  onChange={(e) =>
                    setAsset({ ...asset, symbol: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Tip Activ</label>
                <select
                  className={`${inputClass} cursor-pointer appearance-none`}
                  value={asset.type}
                  onChange={(e) =>
                    setAsset({ ...asset, type: e.target.value as any })
                  }
                >
                  <option value="Equity">Equity</option>
                  <option value="Crypto">Crypto</option>
                  <option value="ETF">ETF</option>
                  <option value="Hedge">Hedge</option>
                  <option value="REIT">REIT</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Sector / Categorie</label>
                <input
                  className={inputClass}
                  placeholder="ex: Tehnologie"
                  value={asset.sector}
                  onChange={(e) => setAsset({ ...asset, sector: e.target.value })}
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-800/50 my-2" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Cantitate</label>
                <input
                  type="number"
                  step="any"
                  required
                  className={inputClass}
                  placeholder="0.00"
                  value={position.shares}
                  onChange={(e) =>
                    updatePosition({ shares: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Preț Intrare ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className={inputClass}
                  placeholder="0.00"
                  value={position.avgCost}
                  onChange={(e) =>
                    updatePosition({ avgCost: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Preț Actual ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className={inputClass}
                  placeholder="0.00"
                  value={position.currentPrice}
                  onChange={(e) =>
                    updatePosition({ currentPrice: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-zinc-800/50">
            {initialAsset && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(initialPosition!.id)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <Trash2 size={14} />
                <span>Șterge</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest px-10 py-3 rounded-xl transition-all shadow-lg shadow-zinc-900/10 dark:shadow-none active:scale-95"
              >
                {initialAsset ? "Salvează" : "Creează"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
