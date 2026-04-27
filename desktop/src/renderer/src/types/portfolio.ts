export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: "Equity" | "Crypto" | "ETF" | "Hedge" | "REIT" | "Cash";
  sector: string;
  emoji: string;
  color: string;
}

export interface Position {
  id: string;
  assetId: string;
  shares: number;
  avgCost: number;
  costBasis: number;
  currentPrice: number;
  lastUpdate: number;
  targetPrice?: number;
  stopLoss?: number;
  riskRewardRatio?: string;
  strategy?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'stopped';
  type?: 'buy' | 'sell' | 'hold';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Defensive" | "Aggressive";
  icon: string;
}

export interface PerformancePoint {
  month: string;
  value: number;
  isPositive: boolean;
}

export interface HistoricalPoint {
  date: string;
  portfolio: number;
  sp500?: number;
  bitcoin?: number;
  gold?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  ytdReturn: number;
  lastMonthReturn: number;
  volatility: number;
}
