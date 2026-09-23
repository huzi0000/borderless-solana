// ============================================================
// GET /api/markets
// Returns the full asset list from the active market data provider.
// Responds with the data source so clients can label results correctly.
// ============================================================

import { NextResponse } from "next/server";
import { getMarketDataProvider, getMockProvider } from "@/lib/market-data";
import type { MarketsApiResponse, Asset } from "@/lib/market-data/types";

export const runtime = "nodejs";
// Revalidate every 60 seconds when deployed (ISR / cache)
export const revalidate = 60;

export async function GET() {
  let provider = getMarketDataProvider();
  let assets: Asset[] = [];
  let source: "live" | "demo" = "live";

  try {
    assets = await provider.getAssets();
    if (assets.length === 0) throw new Error("Empty asset list from provider");
    source = provider.isLive ? "live" : "demo";
  } catch (err) {
    console.warn("[/api/markets] Primary provider failed, using mock:", err);
    provider = getMockProvider();
    assets = await provider.getAssets();
    source = "demo";
  }

  const body: MarketsApiResponse = {
    assets,
    source,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
