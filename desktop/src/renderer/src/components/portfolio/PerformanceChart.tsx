import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PerformancePoint } from "../../types/portfolio";

interface PerformanceChartProps {
  data: PerformancePoint[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-pplx-card rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          Periodic Performance (12M)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              Positive
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              Negative
            </span>
          </div>
        </div>
      </div>

      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              activeBar={false}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? "#10b981" : "#f43f5e"}
                />
              ))}
            </Bar>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: "#71717a" }}
              dy={10}
            />
            <Tooltip
              cursor={{ fill: "#f9fafb", className: "dark:!fill-pplx-sidebar" }}
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                backgroundColor: "#191919",
                color: "#f9fafb",
                fontSize: "12px",
              }}
              formatter={(value: any) => [
                `${Number(value).toFixed(2)}%`,
                "Return",
              ]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center">
        <button className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Explore Full History
        </button>
      </div>
    </div>
  );
};
