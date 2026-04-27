import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { HistoricalPoint } from "../../types/portfolio";

interface PortfolioValueChartProps {
  data: HistoricalPoint[];
  currentTotalValue: number;
}

export const PortfolioValueChart: React.FC<PortfolioValueChartProps> = ({ 
  data, 
  currentTotalValue
}) => {
  const [timeRange, setTimeRange] = useState<"1m" | "6m" | "1y" | "5y">("1y");
  const [comparisons, setComparisons] = useState<string[]>([]);

  const ranges = [
    { label: "1M", value: "1m" },
    { label: "6M", value: "6m" },
    { label: "1Y", value: "1y" },
    { label: "5Y", value: "5y" },
  ];

  const toggleComparison = (asset: string) => {
    setComparisons((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  // Filter and Normalize data for comparison
  const chartData = useMemo(() => {
    const count = timeRange === "1m" ? 30 : timeRange === "6m" ? 180 : timeRange === "1y" ? 365 : 1825;
    const sliced = data.slice(-Math.min(count, data.length));
    
    if (sliced.length === 0) return [];

    // Sync last point
    const processed = [...sliced];
    processed[processed.length - 1] = { 
      ...processed[processed.length - 1], 
      portfolio: currentTotalValue 
    };

    const firstPoint = processed[0];
    
    return processed.map(point => {
      const normalized: any = { ...point };
      
      // We normalize everything to the STARTING value of the portfolio
      // This allows comparing % evolution on the same visual scale
      const portfolioStart = firstPoint.portfolio;
      
      if (point.sp500 && firstPoint.sp500) {
        const sp500Ratio = point.sp500 / firstPoint.sp500;
        normalized.sp500_norm = portfolioStart * sp500Ratio;
      }
      
      if (point.bitcoin && firstPoint.bitcoin) {
        const btcRatio = point.bitcoin / firstPoint.bitcoin;
        normalized.bitcoin_norm = portfolioStart * btcRatio;
      }
      
      if (point.gold && firstPoint.gold) {
        const goldRatio = point.gold / firstPoint.gold;
        normalized.gold_norm = portfolioStart * goldRatio;
      }
      
      return normalized;
    });
  }, [data, timeRange, currentTotalValue]);

  const comparisonAssets = [
    { id: "sp500", label: "S&P 500", color: "#94a3b8" },
    { id: "bitcoin", label: "Bitcoin", color: "#f59e0b" },
    { id: "gold", label: "Gold", color: "#fbbf24" },
  ];

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-pplx-card rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm h-[250px] flex items-center justify-center">
        <p className="text-gray-400 dark:text-zinc-500 font-medium">No historical data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-pplx-card rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300 relative overflow-hidden">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] sm:text-[16px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
            Portfolio Evolution
          </h3>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-gray-100 dark:border-zinc-800 shrink-0">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value as any)}
                className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all ${
                  timeRange === r.value
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 shrink-0" />

          {/* Comparison Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            {comparisonAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => toggleComparison(asset.id)}
                className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded-xl border transition-all whitespace-nowrap ${
                  comparisons.includes(asset.id)
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                    : "bg-transparent border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700"
                }`}
              >
                {asset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[180px] sm:h-[220px] w-full relative">
        {/* Price and Evolution Overlay Inside Chart */}
        <div className="absolute top-0 left-0 z-10 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-2xl sm:text-5xl font-bold text-gray-900 dark:text-zinc-100 tracking-tighter">
              ${currentTotalValue.toLocaleString()}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            key={comparisons.join(',')}
            data={chartData} 
            margin={{ top: 10, right: 5, left: -25, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#27272a" 
              opacity={0.15} 
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: "#71717a" }}
              minTickGap={40}
              dy={15}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: "#71717a" }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                backgroundColor: "#191919",
                color: "#f9fafb",
                fontSize: "12px",
              }}
              itemStyle={{ padding: "2px 0" }}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px", color: "#71717a" }}
              formatter={(value: any, name: any, props: any) => {
                const point = props.payload;
                if (name === "My Portfolio") return [`$${Number(point.portfolio).toLocaleString()}`, name];
                if (name === "S&P 500") return [`$${Number(point.sp500).toLocaleString()}`, name];
                if (name === "Bitcoin") return [`$${Number(point.bitcoin).toLocaleString()}`, name];
                if (name === "Gold") return [`$${Number(point.gold).toLocaleString()}`, name];
                return [value, name];
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={20}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {payload?.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                      <div 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              name="My Portfolio"
              isAnimationActive={false}
              connectNulls
            />
            {comparisons.includes("sp500") && (
              <Line
                type="monotone"
                dataKey="sp500_norm"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="S&P 500"
                isAnimationActive={false}
                connectNulls
              />
            )}
            {comparisons.includes("bitcoin") && (
              <Line
                type="monotone"
                dataKey="bitcoin_norm"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Bitcoin"
                isAnimationActive={false}
                connectNulls
              />
            )}
            {comparisons.includes("gold") && (
              <Line
                type="monotone"
                dataKey="gold_norm"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Gold"
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
