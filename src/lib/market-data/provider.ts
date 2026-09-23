// ============================================================
// MARKET DATA PROVIDER INTERFACE
// All concrete providers must implement this contract.
// ============================================================

import type { Asset } from "./types";

export interface MarketDataProvider {
  /** Display name for logging / UI disclosure */
  readonly name: string;

  /** Whether this provider returns verified on-chain token data */
  readonly isLive: boolean;

  /**
   * Return the full asset list.
   * Must never throw — return [] on error.
   */
  getAssets(): Promise<Asset[]>;

  /**
   * Return a single asset by its id, ticker, or tokenTicker.
   * Must never throw — return undefined if not found.
   */
  getAsset(idOrSymbol: string): Promise<Asset | undefined>;
}
