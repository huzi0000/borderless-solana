import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Activity,
  Globe,
  Layers,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";
import { getAssetById, normalizeSymbol } from "@/data/assets";
import type { Asset } from "@/data/assets";
import { getMarketDataProvider } from "@/lib/market-data";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PriceChange } from "@/components/ui/PriceChange";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { WatchlistButton } from "@/components/ui/WatchlistButton";
import { BuyPanel } from "@/components/BuyPanel";
import { DataSourceBadge, PriceSourceBadge } from "@/components/ui/DataSourceBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatCurrency } from "@/lib/utils";
import { getSolanaExplorerUrl } from "@/lib/solana/network";

interface AssetPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AssetPageProps) {
  try {
    const { id } = await params;
    const asset = await fetchAsset(id);
    if (!asset) return { title: "Asset not found | Borderless" };
    return {
      title: `${asset.tokenTicker} — ${asset.companyName} | Borderless`,
      description: `Inspect official ${asset.tokenTicker} tokenized equity on Solana with Borderless.`,
    };
  } catch {
    return { title: "Asset Details | Borderless" };
  }
}

// Fetch the asset directly from the market data provider (server-side direct lookup)
async function fetchAsset(id: string): Promise<Asset | null> {
  if (!id) return null;
  const { clean } = normalizeSymbol(id);
  try {
    const provider = getMarketDataProvider();
    const asset = await provider.getAsset(clean);
    if (asset) return asset;
  } catch (err) {
    console.warn(`[AssetPage] Provider lookup failed for ${id}, using fallback:`, err);
  }
  return getAssetById(clean) ?? null;
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const asset = await fetchAsset(id);
  if (!asset) notFound();

  const hasRealMint = !!(asset.mintAddress && asset.mintNetwork === "Solana");
  const isLiveToken = asset.tokenDataSource === "live";
  const hasPrice = typeof asset.price === "number" && !isNaN(asset.price) && asset.price > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back navigation */}
      <Link
        href="/discover"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
        aria-label="Back to Markets"
      >
        <ArrowLeft size={13} />
        Markets
      </Link>

      {/* Trading-halted warning banner */}
      {asset.isTradingHalted && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-400">Trading Halted</span>
            <p className="text-xs text-red-400/80 mt-0.5">
              The issuer has halted trading for {asset.tokenTicker}. This status is sourced directly from the official xStocks API.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* ── Left column: asset info + chart + market metrics ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <AssetLogo asset={asset} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight sm:text-3xl">{asset.tokenTicker}</h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                    Tokenized Equity
                  </span>
                  <DataSourceBadge source={asset.tokenDataSource} label={isLiveToken ? "LIVE TOKEN" : "DEMO TOKEN"} />
                  <span className="rounded border border-surface-border bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-muted">
                    Official xStocks data
                  </span>
                </div>
                <p className="text-base text-text-secondary mt-0.5 truncate">{asset.companyName}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-text-muted">
                  <span>Underlying: <strong className="text-text-secondary font-mono">{asset.ticker}</strong></span>
                  {asset.isin && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-text-muted">ISIN: {asset.isin}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="rounded border border-surface-border px-1.5 py-0.5 text-xs text-text-muted">
                    {asset.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <WatchlistButton assetId={asset.id} />
            </div>
          </div>

          {/* Current Price Banner */}
          <div className="rounded-xl border border-surface-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <div>
                {hasPrice ? (
                  <>
                    <span className="text-3xl font-bold tabular-nums text-text-primary sm:text-4xl">
                      {formatCurrency(asset.price!)}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <PriceChange
                        value={asset.change24h}
                        percent={asset.changePercent24h}
                        size="lg"
                      />
                      <span className="text-xs text-text-muted">24h</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-text-primary sm:text-3xl">
                      Price unavailable
                    </span>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed max-w-sm">
                      Public real-time price quotes require institutional Backed API credentials.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <PriceSourceBadge source={asset.priceDataSource} />
                <DemoBadge />
              </div>
            </div>

            {/* Historical Chart Placeholder — No fabricated chart data */}
            <div className="mt-4 pt-4 border-t border-surface-border">
              <div className="rounded-lg border border-surface-border bg-surface-raised/40 p-6 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
                <Activity size={18} className="text-text-muted/60" />
                <span className="font-semibold text-text-secondary">Historical Chart Data Unavailable</span>
                <span className="text-[11px] text-text-muted max-w-sm leading-relaxed">
                  Historical OHLCV data is not provided on the public xStocks endpoint. Borderless does not generate synthetic price charts.
                </span>
              </div>
            </div>
          </div>

          {/* Market Information Grid */}
          <div className="rounded-xl border border-surface-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Market Information
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Market Status</span>
                {asset.isTradingHalted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Halted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Available 24/7
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Underlying Asset</span>
                <span className="text-xs font-mono font-medium text-text-primary">
                  {asset.ticker} (US Equities)
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Network</span>
                <span className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Globe size={11} className="text-accent" />
                  {hasRealMint ? "Solana Mainnet" : "Solana Devnet"}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Token Type</span>
                <span className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Layers size={11} className="text-text-muted" />
                  {hasRealMint ? "SPL Token (Verified)" : "SPL Token (Simulated)"}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Token Multiplier</span>
                <span className="text-xs font-mono font-medium text-text-primary">
                  {asset.currentMultiplier ? asset.currentMultiplier.toFixed(6) : "1.000000"}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[11px] text-text-muted block mb-1">Settlement</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <Activity size={11} />
                  Instant (Solana)
                </span>
              </div>
            </div>
          </div>

          {/* ── Token Details — verified official mint data ── */}
          {hasRealMint && asset.mintAddress && (
            <div className="rounded-xl border border-surface-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Fingerprint size={16} className="text-accent" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Token Details
                  </h2>
                </div>
                <DataSourceBadge source="live" label="OFFICIAL MINT" size="xs" />
              </div>

              <div className="space-y-3">
                {/* Mint Address */}
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                  <span className="text-[11px] text-text-muted block mb-1.5">Solana Mint Address</span>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="flex-1 font-mono text-xs text-text-primary break-all leading-relaxed">
                      {asset.mintAddress}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <CopyButton text={asset.mintAddress} title="Copy mint address" />
                      <a
                        href={getSolanaExplorerUrl(asset.mintAddress, "address", "mainnet-beta")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-border p-1.5 text-text-muted transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        title="View on Solscan"
                        aria-label="View token on Solscan explorer"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-text-muted">
                    Verified from the official xStocks API • Solana Mainnet
                  </p>
                </div>

                {/* ISIN */}
                {asset.isin && (
                  <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                    <span className="text-[11px] text-text-muted block mb-1">ISIN</span>
                    <span className="font-mono text-xs text-text-primary">{asset.isin}</span>
                  </div>
                )}

                {/* xStocks ID */}
                {asset.xstocksId && (
                  <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                    <span className="text-[11px] text-text-muted block mb-1">xStocks Token ID</span>
                    <span className="font-mono text-xs text-text-muted">{asset.xstocksId}</span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-[11px] text-text-muted leading-relaxed">
                Mint address sourced directly from{" "}
                <a
                  href="https://api.backed.fi/api-docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                >
                  api.backed.fi
                </a>
                . Token exists on Solana Mainnet.
              </p>
            </div>
          )}

          {/* About Company */}
          <div className="rounded-xl border border-surface-border bg-surface p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              About {asset.companyName}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{asset.description}</p>
          </div>

          {/* Tokenized Asset Disclosure */}
          <div className="rounded-xl border border-surface-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-text-muted" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Tokenized Asset Disclosure
              </h2>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This interface represents a tokenized exposure to the underlying market asset.
              {hasRealMint
                ? " The token mint address displayed above is sourced from the official xStocks API and exists on Solana Mainnet."
                : " In this product prototype, transactions and holdings are simulated locally on Solana Devnet."}
              {" "}Public reference prices are displayed when available; otherwise shown as unavailable. Trade execution in this MVP operates in Trade Simulation mode.
            </p>
          </div>
        </div>

        {/* ── Right column: buy / sell trading panel ── */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <BuyPanel asset={asset} />
            <div className="rounded-xl border border-surface-border bg-surface p-4 text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-text-secondary block mb-1">Interactive Trading Demo</span>
              Trades executed in this panel update your local demo portfolio in simulation mode. Connect any Solana wallet to experience the flow.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
