// ============================================================
// MOCK MARKET DATA PROVIDER
// Wraps the existing src/data/assets.ts mock data.
// All assets are tagged as dataSource: "demo" so the UI
// always labels them correctly.
// ============================================================

import type { MarketDataProvider } from "./provider";
import type { Asset } from "./types";
import { mockAssets as rawMockAssets } from "@/data/assets";

// Convert the legacy Asset shape to the extended Asset shape
function toExtendedAsset(raw: (typeof rawMockAssets)[number]): Asset {
  return {
    ...raw,
    // Override category to ensure it matches the extended type
    category: raw.category as Asset["category"],
    isTradingHalted: false,
    // No real fields — all demo
    tokenDataSource: "demo",
    priceDataSource: "demo",
  };
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = "MockMarketDataProvider";
  readonly isLive = false;

  private readonly assets: Asset[] = rawMockAssets.map(toExtendedAsset);

  async getAssets(): Promise<Asset[]> {
    return this.assets;
  }

  async getAsset(idOrSymbol: string): Promise<Asset | undefined> {
    if (!idOrSymbol) return undefined;
    const q = idOrSymbol.toLowerCase().trim();
    return this.assets.find(
      (a) =>
        a.id.toLowerCase() === q ||
        a.tokenTicker.toLowerCase() === q ||
        a.ticker.toLowerCase() === q
    );
  }
}
