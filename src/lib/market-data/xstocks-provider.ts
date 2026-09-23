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
//
// What this does NOT provide (requires auth or client account):
//   - Live prices (falls back to mock prices, labelled DEMO PRICES)
//   - Real quotes / execution (DemoExecutionProvider stays active)
//
// IMPORTANT:
//   - Never invent mint addresses — only use addresses from API
//   - Never silently fake success
//   - If the API is unreachable, fall back to MockMarketDataProvider
// ============================================================

import type { MarketDataProvider } from "./provider";
import type {
  Asset,
  BackedToken,
  BackedTokenListResponse,
} from "./types";
import { mockAssets } from "@/data/assets";

type AssetCategory = Asset["category"];


const BACKED_API_BASE = "https://api.backed.fi/api/v1";
const FETCH_TIMEOUT_MS = 8000;

// Extract the Solana mint address from a token's deployments array.
// The Backed API prefixes Solana addresses with "svm:" — strip that.
function extractSolanaMint(token: BackedToken): string | undefined {
  const deployment = token.deployments.find(
    (d) => d.network === "Solana" && d.address.startsWith("svm:")
  );
  if (!deployment) return undefined;
  return deployment.address.replace(/^svm:/, "");
}

// Determine the best display category based on the underlying symbol.
// We only categorise tickers we actually know — the rest get "Other".
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
  return name
    .replace(/\s+xStock$/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Logo colours keyed by first letter — consistent but not fabricated per-company
const LOGO_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6",
];
function logoColor(symbol: string): string {
  const idx = symbol.charCodeAt(0) % LOGO_COLORS.length;
  return LOGO_COLORS[idx];
}

// Build a mock-price lookup map from the existing demo data so we can
// reuse realistic prices for assets we recognise, rather than showing $0.
const mockPriceMap = new Map(
  mockAssets.map((a) => [a.tokenTicker.toLowerCase(), a])
);

function getMockPriceData(tokenSymbol: string) {
  const mock = mockPriceMap.get(tokenSymbol.toLowerCase());
  if (mock) {
    return {
      price: mock.price,
      change24h: mock.change24h,
      changePercent24h: mock.changePercent24h,
      popular: mock.popular,
      logoInitials: mock.logoInitials,
      logoColor: mock.logoColor,
    };
  }
  // Unknown asset — use a neutral price placeholder
  return {
    price: 100.0,
    change24h: 0,
    changePercent24h: 0,
    popular: false,
    logoInitials: initials(tokenSymbol),
    logoColor: logoColor(tokenSymbol),
  };
}

function backedTokenToAsset(token: BackedToken): Asset {
  const priceData = getMockPriceData(token.symbol);
  const mint = extractSolanaMint(token);

  // id: lowercase version of the symbol without trailing 'x', e.g. "nvdax"
  const id = token.symbol.toLowerCase();

  // The ticker without the trailing 'x' suffix is the underlying symbol
  const ticker = token.underlyingSymbol;

  return {
    id,
    companyName: token.name.replace(/\s+xStock$/i, ""),
    ticker,
    tokenTicker: token.symbol,
    category: inferCategory(ticker),
    description: token.description || `${token.symbol} — tokenized equity on xStocks`,

    // Prices: always mock / demo (no API key for collateral/quote)
    price: priceData.price,
    change24h: priceData.change24h,
    changePercent24h: priceData.changePercent24h,

    // Display
    logoInitials: priceData.logoInitials,
    logoColor: priceData.logoColor,

    // Availability
    popular: priceData.popular,
    available: !token.isTradingHalted,
    isTradingHalted: token.isTradingHalted,

    // ── Real xStocks fields ────────────────────────────────
    mintAddress: mint,
    mintNetwork: mint ? "Solana" : undefined,
    isin: token.isin,
    logoUrl: token.logo,
    xstocksId: token.id,

    // Token metadata is LIVE (from official API).
    // Prices are DEMO (no key — labelled in UI).
    tokenDataSource: "live",
    priceDataSource: "demo",
  };
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Next.js: cache for 60 seconds on the server
      next: { revalidate: 60 },
    } as RequestInit);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAllTokens(): Promise<BackedToken[]> {
  const tokens: BackedToken[] = [];
  let page = 0;
  const pageSize = 100;

  // Fetch up to 10 pages (1000 tokens) — the full xStocks catalogue
  // In practice the catalogue has a few hundred tokens.
  for (let i = 0; i < 10; i++) {
    const url = `${BACKED_API_BASE}/token?type=xstocks&pageSize=${pageSize}&page=${page}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[XStocksProvider] /token page ${page} returned ${res.status}`);
      break;
    }
    const data: BackedTokenListResponse = await res.json();
    tokens.push(...data.nodes);
    if (!data.page.hasNextPage) break;
    page++;
  }

  return tokens;
}

export class XStocksProvider implements MarketDataProvider {
  readonly name = "XStocksProvider";
  readonly isLive = true;

  private cachedAssets: Asset[] | null = null;
  private cacheTime = 0;
  private readonly cacheTtlMs = 60_000; // 60 seconds

  private async ensureCache(): Promise<Asset[]> {
    if (this.cachedAssets && Date.now() - this.cacheTime < this.cacheTtlMs) {
      return this.cachedAssets;
    }
    const tokens = await fetchAllTokens();
    if (tokens.length === 0) {
      throw new Error("XStocksProvider: received 0 tokens from API");
    }
    this.cachedAssets = tokens.map(backedTokenToAsset);
    this.cacheTime = Date.now();
    return this.cachedAssets;
  }

  async getAssets(): Promise<Asset[]> {
    return this.ensureCache();
  }

  async getAsset(idOrSymbol: string): Promise<Asset | undefined> {
    if (!idOrSymbol) return undefined;
    const q = idOrSymbol.toLowerCase().trim();
    const assets = await this.ensureCache();
    return assets.find(
      (a) =>
        a.id === q ||
        a.tokenTicker.toLowerCase() === q ||
        a.ticker.toLowerCase() === q
    );
  }
}
