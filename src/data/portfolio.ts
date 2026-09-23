// ============================================================
// MOCK PORTFOLIO DATA
// Demo portfolio for the frontend prototype.
// Replace with real wallet-based holdings via Solana RPC/Helius
// during the wallet integration phase.
// ============================================================

export interface Holding {
  assetId: string;
  quantity: number;
  averagePrice: number;
}

export const mockHoldings: Holding[] = [
  { assetId: "nvdax", quantity: 0.48, averagePrice: 720.5 },
  { assetId: "aaplx", quantity: 2.35, averagePrice: 198.3 },
  { assetId: "tslax", quantity: 1.1, averagePrice: 215.0 },
  { assetId: "spyx", quantity: 0.75, averagePrice: 510.22 },
];
