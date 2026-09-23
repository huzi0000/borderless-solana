"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { getAssetById } from "@/data/assets";
import type { Asset } from "@/data/assets";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PercentBadge } from "@/components/ui/PriceChange";
import { WatchlistButton } from "@/components/ui/WatchlistButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { formatCurrency } from "@/lib/utils";
import type { MarketsApiResponse } from "@/lib/market-data/types";

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();
  const [mounted, setMounted] = useState(false);
  const [marketAssetsMap, setMarketAssetsMap] = useState<Map<string, Asset>>(new Map());

  // Avoid hydration mismatch — wait until client mounts
  useEffect(() => {
    setMounted(true);

    // Refresh current metadata through the market provider API route
    fetch("/api/markets")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MarketsApiResponse) => {
        if (data.assets && data.assets.length > 0) {
          const map = new Map<string, Asset>();
          for (const a of data.assets) {
            map.set(a.id.toLowerCase(), a);
            map.set(a.tokenTicker.toLowerCase(), a);
          }
          setMarketAssetsMap(map);
        }
      })
      .catch((err) => {
        console.warn("[Watchlist] Failed to refresh metadata from /api/markets, using fallback:", err);
      });
  }, []);

  // Resolve asset: prefer live market provider metadata, fallback to static mock
  const watchedAssets: Asset[] = mounted
    ? watchlist
        .map((id) => {
          const q = id.toLowerCase().trim();
          return marketAssetsMap.get(q) || getAssetById(id);
        })
        .filter((a): a is Asset => a !== undefined)
    : [];

  if (!mounted) {
    // Skeleton while hydrating
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <div className="h-8 w-32 animate-pulse rounded-md bg-surface-raised" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded-md bg-surface-raised" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Watchlist</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {watchedAssets.length > 0
            ? `${watchedAssets.length} asset${watchedAssets.length !== 1 ? "s" : ""} saved`
            : "Track assets you want to follow."}
        </p>
      </div>

      {watchedAssets.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={20} />}
          title="Your watchlist is empty"
          description="Save assets from the markets to keep track of them here."
          action={{ label: "Explore markets", href: "/discover" }}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Asset</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">24h</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-12">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-background">
                {watchedAssets.map((asset) => (
                  <tr key={asset.id} className="group transition-colors hover:bg-surface/50">
                    <td className="px-4 py-3.5">
                      <Link href={`/asset/${asset.id}`} className="flex items-center gap-3 focus:outline-none">
                        <AssetLogo asset={asset} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                              {asset.tokenTicker}
                            </span>
                            <DataSourceBadge
                              source={asset.tokenDataSource}
                              label={asset.tokenDataSource === "live" ? "xStocks" : "Demo"}
                              size="xs"
                            />
                          </div>
                          <div className="text-xs text-text-muted">{asset.companyName}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-sm text-text-primary">
                      {formatCurrency(asset.price)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <PercentBadge percent={asset.changePercent24h} />
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      <span className="rounded border border-surface-border px-2 py-0.5 text-xs text-text-muted">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <WatchlistButton assetId={asset.id} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2 sm:hidden">
            {watchedAssets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-4">
                <Link href={`/asset/${asset.id}`} className="flex flex-1 items-center gap-3 min-w-0 focus:outline-none">
                  <AssetLogo asset={asset} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary">{asset.tokenTicker}</span>
                      <DataSourceBadge
                        source={asset.tokenDataSource}
                        label={asset.tokenDataSource === "live" ? "xStocks" : "Demo"}
                        size="xs"
                      />
                    </div>
                    <div className="truncate text-xs text-text-muted">{asset.companyName}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm tabular-nums font-medium text-text-primary">
                      {formatCurrency(asset.price)}
                    </div>
                    <PercentBadge percent={asset.changePercent24h} />
                  </div>
                  <WatchlistButton assetId={asset.id} size="sm" />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-text-muted">
            Watchlist is saved locally on this device. Metadata refreshes through xStocks market provider.
          </p>
        </>
      )}
    </div>
  );
}
