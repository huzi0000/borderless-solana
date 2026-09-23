"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpDown } from "lucide-react";
import {
  getAllAssets,
  ASSET_CATEGORIES,
  type AssetCategory,
  type Asset,
} from "@/data/assets";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PercentBadge } from "@/components/ui/PriceChange";
import { WatchlistButton } from "@/components/ui/WatchlistButton";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataSourceBadge, PriceSourceBadge } from "@/components/ui/DataSourceBadge";
import { formatCurrency } from "@/lib/utils";
import type { MarketsApiResponse, DataSource } from "@/lib/market-data/types";

type SortOption = "popular" | "gainers" | "losers" | "az";
type FilterCategory = "All" | AssetCategory;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "gainers", label: "Top gainers" },
  { value: "losers", label: "Top losers" },
  { value: "az", label: "A–Z" },
];

function sortAssets(assets: Asset[], sort: SortOption): Asset[] {
  switch (sort) {
    case "gainers":
      return [...assets].sort((a, b) => b.changePercent24h - a.changePercent24h);
    case "losers":
      return [...assets].sort((a, b) => a.changePercent24h - b.changePercent24h);
    case "az":
      return [...assets].sort((a, b) => a.companyName.localeCompare(b.companyName));
    case "popular":
    default:
      return [...assets].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterCategory>("All");
  const [sort, setSort] = useState<SortOption>("popular");
  const [assets, setAssets] = useState<Asset[]>(() => getAllAssets());
  const [marketSource, setMarketSource] = useState<DataSource>("demo");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch verified xStocks from /api/markets on client mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch("/api/markets")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MarketsApiResponse) => {
        if (isMounted && data.assets && data.assets.length > 0) {
          setAssets(data.assets);
          setMarketSource(data.source);
        }
      })
      .catch((err) => {
        console.warn("[Discover] Failed to fetch /api/markets, using fallback:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = assets;

    // Category filter
    if (category !== "All") {
      result = result.filter((a) => a.category === category);
    }

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          a.ticker.toLowerCase().includes(q) ||
          a.tokenTicker.toLowerCase().includes(q) ||
          (a.mintAddress && a.mintAddress.toLowerCase().includes(q))
      );
    }

    return sortAssets(result, sort);
  }, [assets, category, query, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Markets</h1>
              <DataSourceBadge
                source={marketSource}
                label={marketSource === "live" ? "xStocks LIVE TOKENS" : "DEMO TOKENS"}
              />
              <PriceSourceBadge source="demo" />
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Discover tokenized global equities on Solana.
            </p>
          </div>
          <DemoBadge />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, tickers, or mint addresses…"
            className="w-full rounded-lg border border-surface-border bg-surface py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 sm:max-w-sm"
          />
        </div>

        {/* Filters + Sort row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["All", ...ASSET_CATEGORIES] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-md px-3 py-2 min-h-[36px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  category === cat
                    ? "bg-surface-raised text-text-primary border border-surface-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none bg-transparent text-xs text-text-secondary cursor-pointer hover:text-text-primary focus:outline-none"
              aria-label="Sort assets"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No assets found"
          description={`No results matching "${query}"${category !== "All" ? ` in ${category}` : ""}. Try a different search.`}
          action={{ label: "Clear filters", onClick: () => { setQuery(""); setCategory("All"); } }}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hidden lg:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Reference Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    24h
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-12">
                    <span className="sr-only">Watch</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-background">
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="group transition-colors hover:bg-surface/50"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/asset/${asset.id}`}
                        className="flex items-center gap-3 focus:outline-none"
                      >
                        <AssetLogo asset={asset} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                              {asset.tokenTicker}
                            </span>
                            <span className="text-xs text-text-muted">·</span>
                            <span className="text-xs text-text-muted">{asset.ticker}</span>
                            <DataSourceBadge
                              source={asset.tokenDataSource}
                              label={asset.tokenDataSource === "live" ? "xStocks" : "Demo"}
                              size="xs"
                            />
                          </div>
                          <span className="text-xs text-text-muted">{asset.companyName}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="rounded border border-surface-border px-2 py-0.5 text-xs text-text-muted">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-sm text-text-primary">
                      <Link href={`/asset/${asset.id}`} className="block focus:outline-none">
                        <div>{formatCurrency(asset.price)}</div>
                        <span className="text-[10px] text-text-muted font-mono">Demo Price</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/asset/${asset.id}`} className="flex justify-end focus:outline-none">
                        <PercentBadge percent={asset.changePercent24h} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      {asset.isTradingHalted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Halted
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs ${asset.available ? "text-emerald-400" : "text-text-muted"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${asset.available ? "bg-emerald-400" : "bg-text-muted"}`} />
                          {asset.available ? "Available" : "Unavailable"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <WatchlistButton assetId={asset.id} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="grid gap-2 sm:hidden">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-4"
              >
                <Link
                  href={`/asset/${asset.id}`}
                  className="flex flex-1 items-center gap-3 focus:outline-none min-w-0"
                >
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

          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>
              {filtered.length} asset{filtered.length !== 1 ? "s" : ""} shown
              {isLoading && " (updating from xStocks API…)"}
            </span>
            <span className="font-mono text-[11px]">
              Solana SPL Tokens
            </span>
          </div>
        </>
      )}
    </div>
  );
}
