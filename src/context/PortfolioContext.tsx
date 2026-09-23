"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockHoldings, Holding } from "@/data/portfolio";
import { getAssetById } from "@/data/assets";

export interface DemoTrade {
  id: string;
  assetId: string;
  tokenTicker: string;
  side: "BUY" | "SELL";
  amountUsd: number;
  quantity: number;
  price: number;
  timestamp: number;
  walletAddress: string;
}

export interface CalculatedHolding {
  assetId: string;
  companyName: string;
  tokenTicker: string;
  logoInitials: string;
  logoColor: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  todayChange: number;
}

interface PortfolioContextType {
  holdings: Holding[];
  trades: DemoTrade[];
  executeTrade: (trade: Omit<DemoTrade, "id" | "timestamp">) => DemoTrade;
  getHolding: (assetId: string) => Holding | undefined;
  getCalculatedHoldings: () => CalculatedHolding[];
  resetPortfolio: () => void;
  hydrated: boolean;
}

const PORTFOLIO_STORAGE_KEY = "borderless_demo_holdings_v1";
const TRADES_STORAGE_KEY = "borderless_demo_trades_v1";

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<DemoTrade[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Initialize from localStorage or fallback to default mock holdings
  useEffect(() => {
    try {
      const savedHoldings = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (savedHoldings) {
        const parsed = JSON.parse(savedHoldings);
        setHoldings(Array.isArray(parsed) ? parsed : mockHoldings);
      } else {
        setHoldings(mockHoldings);
      }

      const savedTrades = localStorage.getItem(TRADES_STORAGE_KEY);
      if (savedTrades) {
        const parsedTrades = JSON.parse(savedTrades);
        setTrades(Array.isArray(parsedTrades) ? parsedTrades : []);
      }
    } catch {
      setHoldings(mockHoldings);
      setTrades([]);
    }
    setHydrated(true);
  }, []);

  // Save holdings to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(holdings));
    } catch {
      // localStorage error handling
    }
  }, [holdings, hydrated]);

  // Save trades to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    } catch {
      // localStorage error handling
    }
  }, [trades, hydrated]);

  const executeTrade = (tradeData: Omit<DemoTrade, "id" | "timestamp">): DemoTrade => {
    const timestamp = Date.now();
    const id = `demo_tx_${Math.random().toString(36).substring(2, 10)}${timestamp.toString(36)}`;
    const newTrade: DemoTrade = {
      ...tradeData,
      id,
      timestamp,
    };

    setTrades((prev) => [newTrade, ...prev]);

    setHoldings((prevHoldings) => {
      const existing = prevHoldings.find((h) => h.assetId.toLowerCase() === tradeData.assetId.toLowerCase());

      if (tradeData.side === "BUY") {
        if (existing) {
          const currentTotalCost = existing.quantity * existing.averagePrice;
          const additionalCost = tradeData.quantity * tradeData.price;
          const updatedQuantity = existing.quantity + tradeData.quantity;
          const updatedAvgPrice = (currentTotalCost + additionalCost) / updatedQuantity;

          return prevHoldings.map((h) =>
            h.assetId.toLowerCase() === tradeData.assetId.toLowerCase()
              ? { ...h, quantity: updatedQuantity, averagePrice: updatedAvgPrice }
              : h
          );
        } else {
          return [
            ...prevHoldings,
            {
              assetId: tradeData.assetId.toLowerCase(),
              quantity: tradeData.quantity,
              averagePrice: tradeData.price,
            },
          ];
        }
      } else {
        // SELL
        if (!existing) return prevHoldings;
        const remainingQuantity = existing.quantity - tradeData.quantity;

        if (remainingQuantity <= 0.000001) {
          return prevHoldings.filter((h) => h.assetId.toLowerCase() !== tradeData.assetId.toLowerCase());
        }

        return prevHoldings.map((h) =>
          h.assetId.toLowerCase() === tradeData.assetId.toLowerCase()
            ? { ...h, quantity: remainingQuantity }
            : h
        );
      }
    });

    return newTrade;
  };

  const getHolding = (assetId: string): Holding | undefined => {
    return holdings.find((h) => h.assetId.toLowerCase() === assetId.toLowerCase());
  };

  const getCalculatedHoldings = (): CalculatedHolding[] => {
    return holdings
      .map((h) => {
        const asset = getAssetById(h.assetId);
        if (!asset) return null;

        const currentPrice = asset.price ?? 0;
        const marketValue = h.quantity * currentPrice;
        const costBasis = h.quantity * h.averagePrice;
        const pnl = marketValue - costBasis;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
        const todayChange = (asset.change24h ?? 0) * h.quantity;

        return {
          assetId: h.assetId,
          companyName: asset.companyName,
          tokenTicker: asset.tokenTicker,
          logoInitials: asset.logoInitials,
          logoColor: asset.logoColor,
          quantity: h.quantity,
          averagePrice: h.averagePrice,
          currentPrice,
          marketValue,
          costBasis,
          pnl,
          pnlPercent,
          todayChange,
        };
      })
      .filter((h): h is CalculatedHolding => h !== null);
  };

  const resetPortfolio = () => {
    setHoldings(mockHoldings);
    setTrades([]);
    try {
      localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
      localStorage.removeItem(TRADES_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        trades,
        executeTrade,
        getHolding,
        getCalculatedHoldings,
        resetPortfolio,
        hydrated,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
