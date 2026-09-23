// ============================================================
// MARKET DATA TYPES
// Re-exports the canonical Asset type from @/data/assets and
// adds types for the Backed API raw response shapes.
// ============================================================

// Re-export the canonical Asset and related types
export type { Asset, AssetCategory, PricePoint } from "@/data/assets";

// Source labels used throughout the UI so the user always knows
// what is real vs simulated. Never silently fake live data.
export type DataSource = "live" | "demo";

// ── Raw response types from Backed API ──────────────────────

export interface BackedTokenDeployment {
  address: string;
  network: string;
  wrapperAddress?: string;
  wrapperAddressV2?: string;
}

export interface BackedToken {
  id: string;
  name: string;
  symbol: string;
  isin: string;
  underlyingSymbol: string;
  underlyingIsin: string;
  description: string;
  logo: string;
  isTradingHalted: boolean;
  deployments: BackedTokenDeployment[];
}

export interface BackedTokenListResponse {
  nodes: BackedToken[];
  page: {
    currentPage: number;
    hasNextPage: boolean;
  };
}

// ── API route response types ─────────────────────────────────

export interface MarketsApiResponse {
  assets: import("@/data/assets").Asset[];
  source: DataSource;
  fetchedAt: string; // ISO timestamp
}

export interface MarketAssetApiResponse {
  asset: import("@/data/assets").Asset;
  source: DataSource;
  fetchedAt: string;
}
