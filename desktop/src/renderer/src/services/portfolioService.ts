import { db, STORES } from "./db";
import {
  Asset,
  Position,
  Strategy,
  PerformancePoint,
  HistoricalPoint,
} from "../types/portfolio";

export class PortfolioService {
  async getAssets(): Promise<Asset[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "assets");
    return data || [];
  }

  async saveAssets(assets: Asset[]): Promise<void> {
    console.log("PortfolioService: Saving assets:", assets);
    await db.set(STORES.PORTFOLIO, "assets", assets);
  }

  async getPositions(): Promise<Position[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "positions");
    return data || [];
  }

  async savePositions(positions: Position[]): Promise<void> {
    console.log("PortfolioService: Saving positions:", positions);
    await db.set(STORES.PORTFOLIO, "positions", positions);
  }

  async getStrategies(): Promise<Strategy[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "strategies");
    return data || [];
  }

  async saveStrategies(strategies: Strategy[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "strategies", strategies);
  }

  async getJournalEntries(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "journal_entries");
    return data || [];
  }

  async saveJournalEntries(entries: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "journal_entries", entries);
  }

  async getMoodLogs(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "mood_logs");
    return data || [];
  }

  async saveMoodLogs(logs: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "mood_logs", logs);
  }

  async getPsychologicalScores(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "psychological_scores");
    return data || [];
  }

  async savePsychologicalScores(scores: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "psychological_scores", scores);
  }

  async getPlans(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "plans");
    return data || [];
  }

  async savePlans(plans: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "plans", plans);
  }

  async getObjectives(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "objectives");
    return data || [];
  }

  async saveObjectives(objectives: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "objectives", objectives);
  }

  async getRules(): Promise<any[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "rules");
    return data || [];
  }

  async saveRules(rules: any[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "rules", rules);
  }

  async getPerformance(): Promise<PerformancePoint[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "performance");
    return data || [];
  }

  async savePerformance(points: PerformancePoint[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "performance", points);
  }

  async getHistoricalPortfolioData(): Promise<HistoricalPoint[]> {
    const data = await db.get<any>(STORES.PORTFOLIO, "historical_data");
    return data || [];
  }

  async saveHistoricalPortfolioData(data: HistoricalPoint[]): Promise<void> {
    await db.set(STORES.PORTFOLIO, "historical_data", data);
  }

  async initializeDefaultData(): Promise<void> {
    const isInitialized = await db.get<boolean>(
      STORES.PORTFOLIO,
      "is_initialized",
    );
    
    const existingHistoricalData = await this.getHistoricalPortfolioData();
    const needsHistoricalData = existingHistoricalData.length === 0;

    if (isInitialized && !needsHistoricalData) return;

    const assets = await this.getAssets();
    if (assets.length === 0) {
      const defaultAssets: Asset[] = [
        {
          id: "1",
          name: "Apple Inc.",
          symbol: "AAPL",
          type: "Equity",
          sector: "Tech",
          emoji: "🍎",
          color: "#555555",
        },
        {
          id: "2",
          name: "Microsoft Corp",
          symbol: "MSFT",
          type: "Equity",
          sector: "Cloud",
          emoji: "💻",
          color: "#00a4ef",
        },
        {
          id: "3",
          name: "Vanguard S&P 500",
          symbol: "VUSA",
          type: "ETF",
          sector: "Core",
          emoji: "📈",
          color: "#ff0000",
        },
        {
          id: "4",
          name: "iShares Gold",
          symbol: "GOLD",
          type: "Hedge",
          sector: "Comm",
          emoji: "🪙",
          color: "#ffd700",
        },
        {
          id: "5",
          name: "Bitcoin",
          symbol: "BTC",
          type: "Crypto",
          sector: "Spec",
          emoji: "₿",
          color: "#f7931a",
        },
      ];
      await this.saveAssets(defaultAssets);

      const defaultPositions: Position[] = [
        {
          id: "p1",
          assetId: "1",
          shares: 100,
          avgCost: 150,
          costBasis: 15000,
          currentPrice: 185.92,
          lastUpdate: Date.now(),
        },
        {
          id: "p2",
          assetId: "2",
          shares: 50,
          avgCost: 300,
          costBasis: 15000,
          currentPrice: 420.55,
          lastUpdate: Date.now(),
        },
        {
          id: "p3",
          assetId: "3",
          shares: 200,
          avgCost: 70,
          costBasis: 14000,
          currentPrice: 85.2,
          lastUpdate: Date.now(),
        },
        {
          id: "p4",
          assetId: "4",
          shares: 10,
          avgCost: 1800,
          costBasis: 18000,
          currentPrice: 2150.0,
          lastUpdate: Date.now(),
        },
        {
          id: "p5",
          assetId: "5",
          shares: 0.5,
          avgCost: 45000,
          costBasis: 22500,
          currentPrice: 65400.0,
          lastUpdate: Date.now(),
        },
      ];
      await this.savePositions(defaultPositions);

      const defaultStrategies: Strategy[] = [
        {
          id: "s1",
          name: "Momentum Alpha",
          description: "Multi-factor trend following across global markets",
          status: "Active",
          icon: "🚀",
        },
        {
          id: "s2",
          name: "Yield Guardian",
          description: "Income generation focus with capital protection",
          status: "Defensive",
          icon: "🛡️",
        },
      ];
      await this.saveStrategies(defaultStrategies);

      const months = [
        "JUL 23",
        "AUG 23",
        "SEP 23",
        "OCT 23",
        "NOV 23",
        "DEC 23",
        "JAN 24",
        "FEB 24",
        "MAR 24",
        "APR 24",
        "MAY 24",
        "JUN 24",
      ];
      const defaultPerformance: PerformancePoint[] = months.map((m) => ({
        month: m,
        value: Math.random() * 10 + 5,
        isPositive: Math.random() > 0.3,
      }));
      await this.savePerformance(defaultPerformance);
    }

    if (needsHistoricalData) {
      // Initialize Historical Data
      const historicalData: HistoricalPoint[] = [];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      let currentPortfolio = 50000;
      let currentSP500 = 4500;
      let currentBTC = 30000;
      let currentGold = 1900;

      for (let i = 0; i < 365; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        currentPortfolio *= (1 + (Math.random() * 0.02 - 0.008));
        currentSP500 *= (1 + (Math.random() * 0.015 - 0.007));
        currentBTC *= (1 + (Math.random() * 0.05 - 0.024));
        currentGold *= (1 + (Math.random() * 0.01 - 0.004));

        historicalData.push({
          date: date.toISOString().split('T')[0],
          portfolio: Math.round(currentPortfolio),
          sp500: Math.round(currentSP500),
          bitcoin: Math.round(currentBTC),
          gold: Math.round(currentGold)
        });
      }
      await this.saveHistoricalPortfolioData(historicalData);
    }

    await db.set(STORES.PORTFOLIO, "is_initialized", true);
  }

  async resetData(): Promise<void> {
    await Promise.all([
      db.set(STORES.PORTFOLIO, "assets", []),
      db.set(STORES.PORTFOLIO, "positions", []),
      db.set(STORES.PORTFOLIO, "strategies", []),
      db.set(STORES.PORTFOLIO, "journal_entries", []),
      db.set(STORES.PORTFOLIO, "mood_logs", []),
      db.set(STORES.PORTFOLIO, "psychological_scores", []),
      db.set(STORES.PORTFOLIO, "plans", []),
      db.set(STORES.PORTFOLIO, "objectives", []),
      db.set(STORES.PORTFOLIO, "rules", []),
      db.set(STORES.PORTFOLIO, "performance", []),
      db.set(STORES.PORTFOLIO, "historical_data", []),
      db.set(STORES.PORTFOLIO, "is_initialized", false),
    ]);
  }
}

export const portfolioService = new PortfolioService();
