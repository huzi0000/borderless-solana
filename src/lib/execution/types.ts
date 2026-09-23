import type { Asset } from "@/data/assets";

export type ExecutionMode = "simulation" | "live";

export interface ExecutionQuoteRequest {
  asset: Asset;
  side: "BUY" | "SELL";
  amountUsd: number;
}

export interface ExecutionQuote {
  quoteId: string;
  assetId: string;
  tokenTicker: string;
  side: "BUY" | "SELL";
  amountUsd: number;
  quantity: number;
  price: number;
  priceSource: "live" | "demo" | "unavailable";
  isExecutable: boolean;
  mode: ExecutionMode;
  expiresAt: number;
  network: string;
  estimatedFeeUsd: number;
  disclaimer: string;
}

export interface TradeExecutionRequest {
  quote: ExecutionQuote;
  walletAddress: string;
}

export interface TradeExecutionResult {
  success: boolean;
  txIdentifier: string;
  mode: ExecutionMode;
  assetId: string;
  tokenTicker: string;
  side: "BUY" | "SELL";
  amountUsd: number;
  quantity: number;
  price: number;
  timestamp: number;
  network: string;
  message: string;
  simulated: boolean;
}
