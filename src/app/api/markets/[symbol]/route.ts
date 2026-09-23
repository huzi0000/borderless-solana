// ============================================================
// GET /api/markets/[symbol]
// Returns a single asset by symbol, id, or tokenTicker.
// Falls back to mock provider if real provider fails.
// ============================================================

import { NextResponse } from "next/server";
import { getMarketDataProvider, getMockProvider } from "@/lib/market-data";
import type { MarketAssetApiResponse, Asset } from "@/lib/market-data/types";

export const runtime = "nodejs";
export const revalidate = 60;

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  let provider = getMarketDataProvider();
  let asset: Asset | undefined = undefined;
  let source: "live" | "demo" = "live";

  try {
    asset = await provider.getAsset(symbol);
    source = provider.isLive ? "live" : "demo";

    // If the live provider doesn't know this asset, try mock as fallback
    if (!asset) {
      const mockProvider = getMockProvider();
      asset = await mockProvider.getAsset(symbol);
      source = "demo";
    }
  } catch (err) {
    console.warn(`[/api/markets/${symbol}] Primary provider failed:`, err);
    const mockProvider = getMockProvider();
    asset = await mockProvider.getAsset(symbol);
    source = "demo";
  }

  if (!asset) {
    return NextResponse.json(
      { error: `Asset not found: ${symbol}` },
      { status: 404 }
    );
  }

  const body: MarketAssetApiResponse = {
    asset,
    source,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
