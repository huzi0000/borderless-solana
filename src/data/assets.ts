// ============================================================
// MOCK DATA LAYER
// All market data here is DEMO data for the frontend prototype.
// Phase 3+4: extended Asset type now includes optional real xStocks
// fields (mintAddress, logoUrl, isin) and required data source labels.
// ============================================================

export type AssetCategory =
  | "Technology"
  | "AI"
  | "ETFs"
  | "Consumer"
  | "Finance"
  | "Other";

export interface PricePoint {
  timestamp: number; // Unix ms
  price: number;
}

export interface Asset {
  id: string;
  companyName: string;
  ticker: string; // Underlying ticker, e.g. NVDA
  tokenTicker: string; // Tokenized ticker, e.g. NVDAx
  category: AssetCategory;
  description: string;
  price: number; // USD
  change24h: number; // USD
  changePercent24h: number; // %
  logoInitials: string; // Used for avatar fallback
  logoColor: string; // Hex background for avatar
  popular: boolean;
  available: boolean; // Whether the asset is available for trading
  isTradingHalted?: boolean;
  // Real xStocks fields (optional — populated from Backed API when available)
  mintAddress?: string;     // Verified Solana SPL mint address (no svm: prefix)
  mintNetwork?: "Solana";
  isin?: string;
  logoUrl?: string;         // Official logo from xStocks CDN
  xstocksId?: string;
  // Data source labels — always present, always honest
  tokenDataSource: "live" | "demo";
  priceDataSource: "live" | "demo";
}

// ============================================================
// MOCK HISTORICAL PRICE GENERATOR
// Replace with real OHLCV data from your data provider.
// ============================================================
export function generateMockPriceHistory(
  basePrice: number,
  days: number,
  volatility = 0.02
): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  let price = basePrice * (1 - (days / 365) * 0.12); // rough start offset

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * msPerDay;
    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price + change, price * 0.5);
    points.push({ timestamp, price: parseFloat(price.toFixed(2)) });
  }

  return points;
}

// Intraday mock (24 data points for 1D view)
export function generateMockIntradayHistory(basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const msPerHour = 60 * 60 * 1000;
  let price = basePrice * 0.98;

  for (let i = 24; i >= 0; i--) {
    const timestamp = now - i * msPerHour;
    const change = (Math.random() - 0.47) * 0.008 * price;
    price = Math.max(price + change, price * 0.9);
    points.push({ timestamp, price: parseFloat(price.toFixed(2)) });
  }

  // Ensure last point reflects current price
  if (points.length > 0) {
    points[points.length - 1].price = basePrice;
  }

  return points;
}

// ============================================================
// MOCK ASSETS
// Replace this array with xStocks API data in production.
// All entries tagged tokenDataSource:"demo" and priceDataSource:"demo".
// ============================================================
export const mockAssets: Asset[] = [
  {
    id: "nvdax",
    companyName: "NVIDIA Corporation",
    ticker: "NVDA",
    tokenTicker: "NVDAx",
    category: "AI",
    description:
      "NVIDIA designs graphics processing units (GPUs) and system-on-chip units. The company is a leader in visual computing, data center AI infrastructure, and autonomous vehicle platforms.",
    price: 875.42,
    change24h: 18.35,
    changePercent24h: 2.14,
    logoInitials: "NV",
    logoColor: "#76b900",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "aaplx",
    companyName: "Apple Inc.",
    ticker: "AAPL",
    tokenTicker: "AAPLx",
    category: "Technology",
    description:
      "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. Its ecosystem spans hardware, software, and services across a global customer base.",
    price: 213.55,
    change24h: -1.22,
    changePercent24h: -0.57,
    logoInitials: "AP",
    logoColor: "#555555",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "tslax",
    companyName: "Tesla, Inc.",
    ticker: "TSLA",
    tokenTicker: "TSLAx",
    category: "Consumer",
    description:
      "Tesla designs and manufactures electric vehicles, energy generation, and storage systems. The company also develops autonomous driving software and operates a global charging network.",
    price: 248.72,
    change24h: 5.91,
    changePercent24h: 2.43,
    logoInitials: "TS",
    logoColor: "#cc0000",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "msftx",
    companyName: "Microsoft Corporation",
    ticker: "MSFT",
    tokenTicker: "MSFTx",
    category: "Technology",
    description:
      "Microsoft develops software, services, devices, and solutions. Its portfolio includes the Windows operating system, Microsoft 365, Azure cloud platform, and the Xbox gaming brand.",
    price: 415.38,
    change24h: 3.12,
    changePercent24h: 0.76,
    logoInitials: "MS",
    logoColor: "#0078d4",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "amznx",
    companyName: "Amazon.com, Inc.",
    ticker: "AMZN",
    tokenTicker: "AMZNx",
    category: "Consumer",
    description:
      "Amazon operates e-commerce, cloud computing (AWS), digital advertising, and entertainment businesses. AWS is a leading global cloud platform serving enterprises and startups worldwide.",
    price: 196.45,
    change24h: -2.87,
    changePercent24h: -1.44,
    logoInitials: "AZ",
    logoColor: "#ff9900",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "googlx",
    companyName: "Alphabet Inc.",
    ticker: "GOOGL",
    tokenTicker: "GOOGLx",
    category: "Technology",
    description:
      "Alphabet is the parent company of Google, which operates the world's largest internet search engine, YouTube, Google Cloud, and a suite of advertising and productivity products.",
    price: 178.93,
    change24h: 1.05,
    changePercent24h: 0.59,
    logoInitials: "AL",
    logoColor: "#4285f4",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "metax",
    companyName: "Meta Platforms, Inc.",
    ticker: "META",
    tokenTicker: "METAx",
    category: "Technology",
    description:
      "Meta builds social technologies including Facebook, Instagram, WhatsApp, and Threads. The company is investing heavily in AI infrastructure and extended reality platforms.",
    price: 492.61,
    change24h: 8.74,
    changePercent24h: 1.81,
    logoInitials: "MT",
    logoColor: "#0081fb",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "spyx",
    companyName: "SPDR S&P 500 ETF Trust",
    ticker: "SPY",
    tokenTicker: "SPYx",
    category: "ETFs",
    description:
      "SPY is one of the largest and most traded ETFs in the world, designed to track the performance of the S&P 500 Index, representing 500 of the largest publicly traded U.S. companies.",
    price: 533.18,
    change24h: 2.31,
    changePercent24h: 0.43,
    logoInitials: "SP",
    logoColor: "#8b5cf6",
    popular: true,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "jpmx",
    companyName: "JPMorgan Chase & Co.",
    ticker: "JPM",
    tokenTicker: "JPMx",
    category: "Finance",
    description:
      "JPMorgan Chase is a global financial services leader offering investment banking, commercial banking, financial transaction processing, asset management, and private banking.",
    price: 218.43,
    change24h: -0.92,
    changePercent24h: -0.42,
    logoInitials: "JP",
    logoColor: "#003087",
    popular: false,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
  {
    id: "qqqx",
    companyName: "Invesco QQQ Trust",
    ticker: "QQQ",
    tokenTicker: "QQQx",
    category: "ETFs",
    description:
      "QQQ tracks the Nasdaq-100 Index, comprising the 100 largest non-financial companies listed on the Nasdaq Stock Market, with heavy weight toward technology and growth sectors.",
    price: 472.88,
    change24h: 4.12,
    changePercent24h: 0.88,
    logoInitials: "QQ",
    logoColor: "#6d28d9",
    popular: false,
    available: true,
    tokenDataSource: "demo",
    priceDataSource: "demo",
  },
];

// ============================================================
// ASSET REPOSITORY
// Abstraction layer — replace internals with API calls later.
// ============================================================
export function getAllAssets(): Asset[] {
  return mockAssets;
}

export function getAssetById(idOrSymbol: string): Asset | undefined {
  if (!idOrSymbol) return undefined;
  const q = idOrSymbol.toLowerCase().trim();
  return mockAssets.find(
    (a) =>
      a.id.toLowerCase() === q ||
      a.tokenTicker.toLowerCase() === q ||
      a.ticker.toLowerCase() === q
  );
}

export const getAssetBySymbol = getAssetById;

export function getAssetsByCategory(category: AssetCategory): Asset[] {
  return mockAssets.filter((a) => a.category === category);
}

export function getPopularAssets(): Asset[] {
  return mockAssets.filter((a) => a.popular);
}

export function searchAssets(query: string): Asset[] {
  const q = query.toLowerCase().trim();
  if (!q) return mockAssets;
  return mockAssets.filter(
    (a) =>
      a.companyName.toLowerCase().includes(q) ||
      a.ticker.toLowerCase().includes(q) ||
      a.tokenTicker.toLowerCase().includes(q)
  );
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  "Technology",
  "AI",
  "ETFs",
  "Consumer",
  "Finance",
];
