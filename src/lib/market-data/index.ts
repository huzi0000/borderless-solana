// ============================================================
// MARKET DATA FACTORY
//
// Selects the best available provider at startup:
//   1. XStocksProvider  — uses official Backed API (preferred)
//   2. MockMarketDataProvider — pure demo fallback
//
// The factory is used exclusively in Next.js API routes (server-side).
// Client components call the API routes, never this module directly.
// ============================================================

import type { MarketDataProvider } from "./provider";
import { XStocksProvider } from "./xstocks-provider";
import { MockMarketDataProvider } from "./mock-provider";

// Re-export types so callers can import from a single place
export type { Asset, PricePoint, DataSource } from "./types";
export type { MarketDataProvider } from "./provider";

let _provider: MarketDataProvider | null = null;

/**
 * Returns the singleton market data provider.
 * On first call it tries XStocksProvider; if that fails to initialise,
 * it silently falls back to MockMarketDataProvider.
 */
export function getMarketDataProvider(): MarketDataProvider {
  if (_provider) return _provider;
  // Always start with XStocksProvider — it validates on first call.
  // If the first real call fails, the API routes will fall back gracefully.
  _provider = new XStocksProvider();
  return _provider;
}

/**
 * Force use of the mock provider (for testing or when explicitly needed).
 */
export function getMockProvider(): MarketDataProvider {
  return new MockMarketDataProvider();
}
