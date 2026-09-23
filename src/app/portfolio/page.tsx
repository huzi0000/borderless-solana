"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Wallet,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PercentBadge } from "@/components/ui/PriceChange";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  fetchLiveWalletHoldings,
  type LiveWalletHolding,
  type LiveHoldingsResult,
} from "@/lib/solana/holdings";
import {
  getSolanaNetwork,
  getNetworkDisplayName,
  getSolanaExplorerUrl,
} from "@/lib/solana/network";
import type { Asset, MarketsApiResponse } from "@/lib/market-data/types";
import { getAllAssets } from "@/data/assets";

type PortfolioMode = "demo" | "live";

export default function PortfolioPage() {
  const { getCalculatedHoldings, trades, resetPortfolio, hydrated } = usePortfolio();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();

  const [activeTab, setActiveTab] = useState<PortfolioMode>("demo");
  const [liveResult, setLiveResult] = useState<LiveHoldingsResult | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [marketAssets, setMarketAssets] = useState<Asset[]>(() => getAllAssets());

  const currentNetwork = getSolanaNetwork();
  const isMainnet = currentNetwork === "mainnet-beta";

  // Load verified market assets for mint matching
  useEffect(() => {
    fetch("/api/markets")
      .then((res) => res.json())
      .then((data: MarketsApiResponse) => {
        if (data.assets && data.assets.length > 0) {
          setMarketAssets(data.assets);
        }
      })
      .catch((err) => {
        console.warn("[Portfolio] Failed to load market assets:", err);
      });
  }, []);

  // Inspect live wallet holdings when in live mode and wallet is connected
  const scanLiveHoldings = async () => {
    if (!connected || !publicKey) {
      setLiveResult(null);
      return;
    }

    setLiveLoading(true);
    try {
      const result = await fetchLiveWalletHoldings(connection, publicKey, marketAssets);
      setLiveResult(result);
    } catch (err) {
      console.error("[Portfolio] Live scan error:", err);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "live" && connected && publicKey) {
      scanLiveHoldings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, connected, publicKey, marketAssets]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <div className="h-8 w-40 animate-pulse rounded-md bg-surface-raised" />
          <div className="mt-2 h-4 w-60 animate-pulse rounded-md bg-surface-raised" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  // Demo calculations
  const demoHoldings = getCalculatedHoldings();
  const totalDemoValue = demoHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalDemoCost = demoHoldings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalDemoPnl = totalDemoValue - totalDemoCost;
  const totalDemoPnlPercent = totalDemoCost > 0 ? (totalDemoPnl / totalDemoCost) * 100 : 0;
  const todayDemoChange = demoHoldings.reduce((sum, h) => sum + h.todayChange, 0);
  const todayDemoChangePercent = totalDemoValue > 0 ? (todayDemoChange / totalDemoValue) * 100 : 0;

  const isDemoOverallPositive = totalDemoPnl >= 0;
  const isDemoTodayPositive = todayDemoChange >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Portfolio</h1>
            {activeTab === "demo" ? (
              <DemoBadge />
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Wallet Mode
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            {activeTab === "demo"
              ? "Simulated demo portfolio state saved locally in your browser."
              : "Read-only inspection of verified xStock SPL tokens in your connected Solana wallet."}
          </p>
        </div>

        {/* Action button */}
        {activeTab === "demo" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={resetPortfolio}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
              title="Reset demo portfolio to initial state"
            >
              <RotateCcw size={12} />
              Reset demo data
            </button>
          </div>
        ) : (
          connected && (
            <button
              onClick={scanLiveHoldings}
              disabled={liveLoading}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={liveLoading ? "animate-spin" : ""} />
              {liveLoading ? "Scanning RPC…" : "Refresh wallet"}
            </button>
          )
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mb-8 flex items-center justify-between border-b border-surface-border pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-surface-border">
          <button
            onClick={() => setActiveTab("demo")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "demo"
                ? "bg-surface-raised text-text-primary border border-surface-border shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Demo Portfolio</span>
            <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-mono text-amber-400">
              Simulated
            </span>
          </button>
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "live"
                ? "bg-surface-raised text-text-primary border border-surface-border shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
            }`}
          >
            <Wallet size={14} className="text-emerald-400" />
            <span>Live Wallet</span>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
              On-Chain
            </span>
          </button>
        </div>

        {/* Network indicator */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Network:</span>
          <span className="font-mono text-text-secondary font-medium flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${isMainnet ? "bg-emerald-400" : "bg-cyan-400"}`} />
            {getNetworkDisplayName()}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: LIVE WALLET TAB                                  */}
      {/* ========================================================= */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {/* Disconnected State */}
          {!connected || !publicKey ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-8 text-center max-w-xl mx-auto">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised text-text-muted border border-surface-border">
                <Wallet size={24} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-1">
                Connect Wallet to Inspect Live Holdings
              </h2>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed max-w-sm mx-auto">
                Read-only inspection: Borderless securely queries SPL token accounts on Solana and matches them strictly against verified xStocks mint addresses.
              </p>
              <button
                onClick={() => openWalletModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black hover:bg-accent/90 transition-all shadow-lg shadow-accent/10"
              >
                <Wallet size={14} />
                Connect Solana Wallet
              </button>
            </div>
          ) : liveResult?.status === "network_mismatch" ? (
            /* Network Mismatch State: Connected to Devnet while xStocks are on Mainnet */
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400 flex-shrink-0 border border-cyan-500/20">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Solana Devnet Active — Network Awareness
                    </h3>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                      Devnet
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    {liveResult.message}
                  </p>
                  <div className="rounded-lg bg-background/60 border border-surface-border p-3 text-xs font-mono text-text-muted space-y-1">
                    <div>Connected Wallet: {publicKey.toBase58()}</div>
                    <div>Application Network: {getNetworkDisplayName()}</div>
                    <div>Verified xStocks Target Network: Solana Mainnet</div>
                  </div>
                  <p className="mt-3 text-[11px] text-text-muted">
                    Borderless strictly enforces on-chain honesty: Devnet token balances are never misrepresented as real Mainnet equities.
                  </p>
                </div>
              </div>
            </div>
          ) : liveLoading ? (
            /* Loading State */
            <div className="space-y-4">
              <div className="h-10 w-48 animate-pulse rounded-md bg-surface-raised" />
              <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-raised" />
                ))}
              </div>
            </div>
          ) : liveResult?.status === "connected_empty" ? (
            /* Empty Wallet State */
            <div className="rounded-2xl border border-surface-border bg-surface p-8 text-center max-w-xl mx-auto">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-text-muted border border-surface-border">
                <Layers size={22} className="text-text-muted" />
              </div>
              <h2 className="text-base font-bold text-text-primary mb-1">
                No Verified xStocks Found
              </h2>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                {liveResult.message}
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-xs font-semibold text-text-primary hover:border-accent/40 transition-colors"
              >
                Browse Available xStocks
              </Link>
            </div>
          ) : liveResult?.status === "connected_matching" && liveResult.holdings.length > 0 ? (
            /* Verified Live Holdings Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">
                    Verified On-Chain Holdings
                  </h2>
                  <p className="text-xs text-text-muted">
                    Matched {liveResult.holdings.length} asset{liveResult.holdings.length !== 1 ? "s" : ""} by verified SPL mint address on Solana Mainnet.
                  </p>
                </div>
                <DataSourceBadge source="live" label="VERIFIED ON-CHAIN" />
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block rounded-xl border border-surface-border overflow-hidden bg-surface">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-raised text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Verified Mint</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Price Status</th>
                      <th className="px-4 py-3 text-right">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border bg-background">
                    {liveResult.holdings.map((h) => (
                      <tr key={h.mintAddress} className="transition-colors hover:bg-surface/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <AssetLogo
                              asset={{
                                logoInitials: h.logoInitials,
                                logoColor: h.logoColor,
                                companyName: h.companyName,
                                logoUrl: h.logoUrl,
                              }}
                              size="sm"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-text-primary">
                                  {h.tokenTicker}
                                </span>
                                <span className="text-xs text-text-muted">·</span>
                                <span className="text-xs text-text-muted">{h.underlyingTicker}</span>
                              </div>
                              <span className="text-xs text-text-muted">{h.companyName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-text-secondary">
                              {h.mintAddress.slice(0, 6)}...{h.mintAddress.slice(-6)}
                            </span>
                            <CopyButton text={h.mintAddress} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-sm font-semibold text-text-primary">
                          {formatNumber(h.quantity, h.decimals > 4 ? 4 : h.decimals)} {h.tokenTicker}
                        </td>
                        <td className="px-4 py-4 text-right text-xs">
                          {h.price ? (
                            <span className="text-text-primary font-medium">{formatCurrency(h.price)}</span>
                          ) : (
                            <span className="text-text-muted font-mono text-[11px]" title="Live institutional quote key required">
                              Live price unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <a
                            href={getSolanaExplorerUrl(h.mintAddress, "address", "mainnet-beta")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            <span>Solscan</span>
                            <ExternalLink size={11} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="grid gap-3 sm:hidden">
                {liveResult.holdings.map((h) => (
                  <div key={h.mintAddress} className="rounded-xl border border-surface-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AssetLogo
                          asset={{
                            logoInitials: h.logoInitials,
                            logoColor: h.logoColor,
                            companyName: h.companyName,
                            logoUrl: h.logoUrl,
                          }}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{h.tokenTicker}</div>
                          <div className="text-xs text-text-muted">{h.companyName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-text-primary tabular-nums">
                          {formatNumber(h.quantity, 4)}
                        </div>
                        <div className="text-[11px] text-text-muted">Live price unavailable</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-text-muted">
                        {h.mintAddress.slice(0, 8)}...
                      </span>
                      <a
                        href={getSolanaExplorerUrl(h.mintAddress, "address", "mainnet-beta")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-1"
                      >
                        <span>Solscan</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Live Mode Disclosure */}
          <div className="rounded-xl border border-surface-border bg-surface p-4 text-xs text-text-muted leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-text-secondary mb-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              On-Chain Token Verification Guarantee
            </div>
            Borderless scans your connected wallet directly using standard Solana JSON-RPC. Tokens are identified strictly by their official Solana SPL mint address. No private keys, signatures, or custody permissions are ever requested.
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: DEMO PORTFOLIO TAB                               */}
      {/* ========================================================= */}
      {activeTab === "demo" && (
        <>
          {/* Wallet Status Banner */}
          {!connected && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised text-text-muted">
                  <Wallet size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Connect your Solana wallet</p>
                  <p className="text-[11px] text-text-secondary">
                    Connect Phantom, Solflare, or Backpack to associate simulated orders with your address.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openWalletModal(true)}
                className="rounded-lg bg-surface-raised border border-accent/30 px-3 py-1.5 text-xs font-medium text-text-primary hover:border-accent hover:bg-surface transition-colors"
              >
                Connect wallet
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
            <div className="rounded-xl border border-surface-border bg-surface p-5">
              <p className="mb-1 text-xs text-text-muted">Total value (Demo)</p>
              <p className="text-2xl font-bold tabular-nums text-text-primary">
                {formatCurrency(totalDemoValue)}
              </p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface p-5">
              <p className="mb-1 text-xs text-text-muted">Today&apos;s change</p>
              <p className={`text-2xl font-bold tabular-nums ${isDemoTodayPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isDemoTodayPositive ? "+" : ""}{formatCurrency(todayDemoChange)}
              </p>
              <p className={`text-xs ${isDemoTodayPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isDemoTodayPositive ? "+" : ""}{todayDemoChangePercent.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface p-5">
              <p className="mb-1 text-xs text-text-muted">Total return</p>
              <p className={`text-2xl font-bold tabular-nums ${isDemoOverallPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isDemoOverallPositive ? "+" : ""}{formatCurrency(totalDemoPnl)}
              </p>
              <p className={`text-xs ${isDemoOverallPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isDemoOverallPositive ? "+" : ""}{totalDemoPnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Allocation bar */}
          {demoHoldings.length > 0 && (
            <div className="mb-8 rounded-xl border border-surface-border bg-surface p-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                Allocation
              </p>
              <div className="flex h-2.5 overflow-hidden rounded-full gap-0.5 bg-surface-raised">
                {demoHoldings.map((h) => {
                  const pct = totalDemoValue > 0 ? (h.marketValue / totalDemoValue) * 100 : 0;
                  return (
                    <div
                      key={h.assetId}
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: h.logoColor,
                      }}
                      title={`${h.tokenTicker}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {demoHoldings.map((h) => {
                  const pct = totalDemoValue > 0 ? (h.marketValue / totalDemoValue) * 100 : 0;
                  return (
                    <div key={h.assetId} className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: h.logoColor }}
                      />
                      <span className="text-xs text-text-secondary">{h.tokenTicker}</span>
                      <span className="text-xs text-text-muted font-mono">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Holdings Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Demo Holdings</h2>
              <span className="text-xs text-text-muted">{demoHoldings.length} positions</span>
            </div>

            {demoHoldings.length === 0 ? (
              <EmptyState
                title="No holdings in portfolio"
                description="You have sold all positions or haven't made any demo purchases yet."
                action={{ label: "Explore markets", href: "/discover" }}
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block rounded-xl border border-surface-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right hidden md:table-cell">Avg. Price</th>
                        <th className="px-4 py-3 text-right">Current</th>
                        <th className="px-4 py-3 text-right">Value</th>
                        <th className="px-4 py-3 text-right">P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border bg-background">
                      {demoHoldings.map((h) => (
                        <tr key={h.assetId} className="group transition-colors hover:bg-surface/50">
                          <td className="px-4 py-4">
                            <Link href={`/asset/${h.assetId}`} className="flex items-center gap-3 focus:outline-none">
                              <AssetLogo
                                asset={{ logoInitials: h.logoInitials, logoColor: h.logoColor, companyName: h.companyName }}
                                size="sm"
                              />
                              <div>
                                <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                                  {h.tokenTicker}
                                </div>
                                <div className="text-xs text-text-muted truncate max-w-[140px]">
                                  {h.companyName}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm text-text-secondary">
                            {formatNumber(h.quantity, 4)}
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm text-text-secondary hidden md:table-cell">
                            {formatCurrency(h.averagePrice)}
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm text-text-primary">
                            {formatCurrency(h.currentPrice)}
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm font-medium text-text-primary">
                            {formatCurrency(h.marketValue)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className={`text-sm font-medium tabular-nums ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)}
                            </div>
                            <PercentBadge percent={h.pnlPercent} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid gap-3 sm:hidden">
                  {demoHoldings.map((h) => (
                    <Link
                      key={h.assetId}
                      href={`/asset/${h.assetId}`}
                      className="rounded-xl border border-surface-border bg-surface p-4 block transition-colors hover:border-surface-raised active:bg-surface-raised"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo
                            asset={{ logoInitials: h.logoInitials, logoColor: h.logoColor, companyName: h.companyName }}
                            size="sm"
                          />
                          <div>
                            <div className="text-sm font-medium text-text-primary">{h.tokenTicker}</div>
                            <div className="text-xs text-text-muted">{formatNumber(h.quantity, 4)} units</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-text-primary tabular-nums">
                            {formatCurrency(h.marketValue)}
                          </div>
                          <PercentBadge percent={h.pnlPercent} />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-surface-border">
                        <span className="text-text-muted">Total P&amp;L</span>
                        <span className={`tabular-nums font-medium ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)} ({h.pnlPercent >= 0 ? "+" : ""}{h.pnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent Demo Trades Activity */}
          {trades.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Clock size={14} className="text-text-muted" />
                  Recent Demo Activity
                </h2>
                <span className="text-xs text-text-muted">{trades.length} trades</span>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface overflow-hidden">
                <div className="divide-y divide-surface-border">
                  {trades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${
                            trade.side === "BUY"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {trade.side === "BUY" ? (
                            <ArrowDownRight size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {trade.side === "BUY" ? "Bought" : "Sold"} {trade.tokenTicker}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {trade.id.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-text-primary tabular-nums">
                          {formatCurrency(trade.amountUsd)}
                        </div>
                        <div className="text-[11px] text-text-secondary tabular-nums">
                          {formatNumber(trade.quantity, 4)} @ {formatCurrency(trade.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 text-center">
            <p className="text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
              Simulated portfolio values are stored locally in your browser. Live atomic execution on Solana requires an authorized Backed institutional client account.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
