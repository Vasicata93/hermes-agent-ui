import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Asset, Position } from "../../types/portfolio";

interface AllocationChartProps {
  assets: Asset[];
  positions: Position[];
}

type AllocationTab =
  | "Individual Assets"
  | "Asset Classes"
  | "Sectors"
  | "Geographic";

const PREMIUM_PALETTE = [
  "#ef4444", // Red 500
  "#22c55e", // Green 500
  "#3b82f6", // Blue 500
  "#eab308", // Yellow 500
  "#a855f7", // Purple 500
  "#ec4899", // Pink 500
  "#f97316", // Orange 500
  "#06b6d4", // Cyan 500
  "#8b5cf6", // Violet 500
  "#14b8a6", // Teal 500
];

export const AllocationChart: React.FC<AllocationChartProps> = ({
  assets,
  positions,
}) => {
  const [activeTab, setActiveTab] =
    useState<AllocationTab>("Individual Assets");

  const getChartData = () => {
    const groupedData: Record<string, { value: number }> = {};

    positions.forEach((pos) => {
      const asset = assets.find((a) => a.id === pos.assetId);
      if (!asset) return;

      let key = "";

      switch (activeTab) {
        case "Individual Assets":
          key = asset.symbol;
          break;
        case "Asset Classes":
          key = asset.type;
          break;
        case "Sectors":
          key = asset.sector;
          break;
        case "Geographic":
          // Mock geographic data based on asset symbol/type
          if (asset.type === "Crypto") key = "Global";
          else if (asset.symbol === "VUSA") key = "US";
          else if (asset.symbol === "GOLD") key = "Global";
          else key = "US";
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = { value: 0 };
      }
      groupedData[key].value += pos.shares * pos.currentPrice;
    });

    return Object.entries(groupedData)
      .map(([name, data]) => ({
        name,
        value: data.value,
      }))
      .sort((a, b) => b.value - a.value)
      .map((entry, index) => ({
        ...entry,
        color: PREMIUM_PALETTE[index % PREMIUM_PALETTE.length],
      }));
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const data = getChartData();

  return (
    <div className="bg-white dark:bg-pplx-card rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center transition-colors duration-300 w-full">
      <div className="flex items-center gap-1 mb-6 bg-gray-50 dark:bg-pplx-secondary p-1 rounded-xl w-full">
        {[
          { id: "Individual Assets", label: "Individual" },
          { id: "Asset Classes", label: "Clase" },
          { id: "Sectors", label: "Sector" },
          { id: "Geographic", label: "Geografie" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AllocationTab)}
            className={`px-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all flex-1 text-center ${activeTab === tab.id ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full aspect-square max-w-[300px] sm:max-w-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 96 : 120}
              outerRadius={isMobile ? 128 : 160}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              activeShape={false}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid var(--color-pplx-border)",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                backgroundColor: "var(--color-pplx-card)",
                color: "#f9fafb",
                fontSize: "12px",
              }}
              formatter={(value: any, name: any) => [
                `€${Number(value).toLocaleString()}`,
                name || "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black text-gray-900 dark:text-zinc-100 tracking-tighter">
            {data.length}
          </span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1">
            {activeTab === "Individual Assets"
              ? "Holdings"
              : activeTab === "Asset Classes"
                ? "Classes"
                : activeTab === "Sectors"
                  ? "Sectors"
                  : "Regions"}
          </span>
        </div>
      </div>

      <div className="mt-6 text-center max-w-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">
          Active Allocation Strategy
        </h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
          Weighted towards core index trackers with strategic alpha overlays in
          technology and digital assets.
        </p>
      </div>
    </div>
  );
};
