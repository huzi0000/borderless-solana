// ============================================================
// XSTOCKS MARKET DATA PROVIDER
//
// Fetches verified token metadata from the official Backed API
// (https://api.backed.fi/api/v1/token?type=xstocks)
//
// What this provides (all from official public API, no key):
//   - Verified Solana SPL mint addresses
//   - Official token logos from xStocks CDN
//   - ISIN codes
//   - isTradingHalted status
//   - Symbol, name, underlying ticker
//   - Official token multipliers via GET /token/{symbol}/multiplier
//
// What this does NOT provide publicly:
//   - Live prices (requires institutional Backed API key).
//   - When no key is present, price is marked "unavailable" (per Borderless policy:
//     we NEVER masquerade demo prices as real prices in production).
// ============================================================

import type { MarketDataProvider } from "./provider";
import type { Asset, BackedToken, BackedTokenListResponse } from "./types";
import { mockAssets, normalizeSymbol } from "@/data/assets";

type AssetCategory = Asset["category"];

const BACKED_API_BASE = "https://api.backed.fi/api/v1";
const FETCH_TIMEOUT_MS = 8000;

// Extract the Solana mint address from a token's deployments array.
// The Backed API prefixes Solana addresses with "svm:" — strip that.
function extractSolanaMint(token: BackedToken): string | undefined {
  if (!token.deployments || !Array.isArray(token.deployments)) return undefined;
  const deployment = token.deployments.find(
    (d) => d && d.network === "Solana" && typeof d.address === "string"
  );
  if (!deployment) return undefined;
  return deployment.address.replace(/^svm:/, "");
}

// Determine the best display category based on the underlying symbol.
const TICKER_CATEGORY_MAP: Record<string, AssetCategory> = {
  NVDA: "AI",
  AMD: "AI",
  INTC: "Technology",
  AAPL: "Technology",
  MSFT: "Technology",
  GOOGL: "Technology",
  GOOG: "Technology",
  META: "Technology",
  AMZN: "Consumer",
  TSLA: "Consumer",
  NFLX: "Consumer",
  WMT: "Consumer",
  COST: "Consumer",
  JPM: "Finance",
  BAC: "Finance",
  GS: "Finance",
  MS: "Finance",
  V: "Finance",
  MA: "Finance",
  SPY: "ETFs",
  QQQ: "ETFs",
  IWM: "ETFs",
  DIA: "ETFs",
  VTI: "ETFs",
};

function inferCategory(underlying: string): AssetCategory {
  return TICKER_CATEGORY_MAP[underlying.toUpperCase()] ?? "Other";
}

// Generate logo initials from a company name
function initials(name: string): string {
  if (!name) return "";
  return name
    .replace(/\s+xStock$/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Logo colours keyed by first letter
const LOGO_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6",
];

function logoColor(symbol: string): string {
  if (!symbol) return LOGO_COLORS[0];
  const idx = symbol.charCodeAt(0) % LOGO_COLORS.length;
  return LOGO_COLORS[idx];
}

// Map BackedToken into the canonical Asset format
function backedTokenToAsset(token: BackedToken): Asset {
  const mint = extractSolanaMint(token);
  const symbol = token.symbol || "";
  const id = symbol.toLowerCase();
  const ticker = token.underlyingSymbol || symbol.replace(/x$/i, "");
  const companyName = token.name ? token.name.replace(/\s+xStock$/i, "") : symbol;

  return {
    id,
    companyName,
    ticker,
    tokenTicker: symbol,
    category: inferCategory(ticker),
    description: token.description || `${symbol} — tokenized equity on xStocks`,

    // Pricing: official price is unavailable from public feed without institutional key.
    // Per Borderless transparency rules: never invent or fabricate prices.
    price: undefined,
    change24h: undefined,
    changePercent24h: undefined,

    // Display metadata
    logoInitials: initials(companyName) || initials(symbol),
    logoColor: logoColor(symbol),

    // Availability
    popular: ["NVDAx", "AAPLx", "TSLAx", "MSFTx", "AMZNx", "GOOGLx", "METAx", "SPYx", "QQQx"].includes(symbol),
    available: !token.isTradingHalted,
    isTradingHalted: !!token.isTradingHalted,

    // Real xStocks metadata verified from Backed API
    mintAddress: mint,
    mintNetwork: mint ? "Solana" : undefined,
    isin: token.isin || undefined,
    logoUrl: token.logo || undefined,
    xstocksId: token.id || undefined,

    tokenDataSource: "live",
    priceDataSource: "unavailable",
  };
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Next.js: cache for 300 seconds (5 mins)
      next: { revalidate: 300 },
    } as RequestInit);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches all official xStocks in a single HTTP request.
 * Omitting pageSize returns the complete active token catalogue from api.backed.fi.
 */
async function fetchAllTokens(): Promise<BackedToken[]> {
  const url = `${BACKED_API_BASE}/token?type=xstocks`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch /token: HTTP ${res.status}`);
  }
  const data: BackedTokenListResponse = await res.json();
  return data.nodes || [];
}

export class XStocksProvider implements MarketDataProvider {
  readonly name = "XStocksProvider";
  readonly isLive = true;

  private cachedAssets: Asset[] | null = null;
  private cacheTime = 0;
  private readonly cacheTtlMs = 300_000; // 5 minutes in-memory cache
  private inflightFetch: Promise<Asset[]> | null = null;

  private async ensureCache(): Promise<Asset[]> {
    // 1. Return in-memory cache if still fresh
    if (this.cachedAssets && Date.now() - this.cacheTime < this.cacheTtlMs) {
      return this.cachedAssets;
    }

    // 2. Deduplicate concurrent requests (e.g. generateMetadata and page render)
    if (this.inflightFetch) {
      return this.inflightFetch;
    }

    this.inflightFetch = (async () => {
      try {
        const tokens = await fetchAllTokens();
        if (tokens.length > 0) {
          this.cachedAssets = tokens.map(backedTokenToAsset);
          this.cacheTime = Date.now();
          return this.cachedAssets;
        }
      } catch (err) {
        console.warn("[XStocksProvider] Upstream fetch failed, using fallback:", err);
      }

      // If we have stale cache, serve it rather than failing
      if (this.cachedAssets && this.cachedAssets.length > 0) {
        return this.cachedAssets;
      }

      // Safe fallback to built-in mock assets so SSR never crashes
      return mockAssets.map((a) => ({
        ...a,
        tokenDataSource: "demo" as const,
        priceDataSource: "demo" as const,
      }));
    })().finally(() => {
      this.inflightFetch = null;
    });

    return this.inflightFetch;
  }

  async getAssets(): Promise<Asset[]> {
    return this.ensureCache();
  }

  async getAsset(idOrSymbol: string): Promise<Asset | undefined> {
    if (!idOrSymbol) return undefined;
    const { clean, base, withX } = normalizeSymbol(idOrSymbol);
    const assets = await this.ensureCache();

    const found = assets.find(
      (a) =>
        a.id.toLowerCase() === clean ||
        a.id.toLowerCase() === withX ||
        a.id.toLowerCase() === base ||
        a.tokenTicker.toLowerCase() === clean ||
        a.tokenTicker.toLowerCase() === withX ||
        a.ticker.toLowerCase() === clean ||
        a.ticker.toLowerCase() === base ||
        (a.mintAddress && a.mintAddress.toLowerCase() === clean)
    );

    if (!found) return undefined;

    // Fast optional enrichment: query official token multiplier from public endpoint
    try {
      const multUrl = `${BACKED_API_BASE}/token/${encodeURIComponent(found.tokenTicker)}/multiplier?network=Solana`;
      const multRes = await fetchWithTimeout(multUrl, 2500);
      if (multRes.ok) {
        const multData = await multRes.json();
        if (typeof multData.currentMultiplier === "number") {
          return {
            ...found,
            currentMultiplier: multData.currentMultiplier,
          };
        }
      }
    } catch {
      // Non-blocking: multiplier failure does not impede asset detail rendering
    }

    return found;
  }
}
