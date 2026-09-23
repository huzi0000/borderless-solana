import Link from "next/link";
import { ArrowRight, Globe, Shield, Zap } from "lucide-react";
import { getPopularAssets } from "@/data/assets";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PercentBadge } from "@/components/ui/PriceChange";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const featuredAssets = getPopularAssets();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* ── Hero ── */}
      <section className="pt-16 pb-14 sm:pt-20 sm:pb-16">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-text-muted">
          Global Markets · Solana
        </p>
        <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          Global markets.
          <br />
          One wallet.
        </h1>
        <p className="mb-8 max-w-lg text-base text-text-secondary leading-relaxed sm:text-lg">
          Discover tokenized global equities through a simple, non-custodial interface built for
          the internet economy.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Explore markets
            <ArrowRight size={14} />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-surface-raised hover:text-text-primary"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* ── Market preview ── */}
      <section className="pb-16">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-text-primary">Markets</h2>
            <DemoBadge />
          </div>
          <Link
            href="/discover"
            className="flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Asset
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  24h
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted hidden lg:table-cell">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-background">
              {featuredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="group transition-colors hover:bg-surface/50 cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/asset/${asset.id}`}
                      className="flex items-center gap-3 focus:outline-none"
                    >
                      <AssetLogo asset={asset} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                            {asset.tokenTicker}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">{asset.companyName}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-sm text-text-primary">
                    <Link href={`/asset/${asset.id}`} className="block focus:outline-none">
                      {formatCurrency(asset.price)}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/asset/${asset.id}`} className="block focus:outline-none">
                      <PercentBadge percent={asset.changePercent24h} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                    <Link href={`/asset/${asset.id}`} className="block focus:outline-none">
                      <span className="rounded-md border border-surface-border px-2 py-0.5 text-xs text-text-muted">
                        {asset.category}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-2 sm:hidden">
          {featuredAssets.map((asset) => (
            <Link
              key={asset.id}
              href={`/asset/${asset.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-4 transition-colors hover:border-surface-raised active:bg-surface-raised"
            >
              <div className="flex items-center gap-3">
                <AssetLogo asset={asset} size="sm" />
                <div>
                  <div className="text-sm font-medium text-text-primary">{asset.tokenTicker}</div>
                  <div className="text-xs text-text-muted">{asset.companyName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm tabular-nums font-medium text-text-primary">
                  {formatCurrency(asset.price)}
                </div>
                <PercentBadge percent={asset.changePercent24h} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why Borderless ── */}
      <section className="border-t border-surface-border py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
            Why Borderless
          </p>
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Built differently.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: <Globe size={18} />,
              title: "Global Access",
              description:
                "Explore tokenized versions of global market assets from one interface, without geographic restrictions.",
            },
            {
              icon: <Zap size={18} />,
              title: "Simple by Design",
              description:
                "No pools, routes, or DeFi terminology required. Just find an asset and decide how much you want.",
            },
            {
              icon: <Shield size={18} />,
              title: "Self-Custody",
              description:
                "Designed around wallet-based access. Borderless never holds your funds or requires an account.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-surface-border bg-surface p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-raised text-accent">
                {item.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-surface-border py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
            How it works
          </p>
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Three steps.</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Discover",
              description: "Browse available tokenized equities across markets, sectors, and ETFs.",
            },
            {
              step: "02",
              title: "Choose",
              description:
                "Select an asset and enter how much USDC you want to use. See the estimated outcome.",
            },
            {
              step: "03",
              title: "Review",
              description:
                "Inspect the full order details before approving through your connected wallet.",
            },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="text-3xl font-bold tabular-nums text-surface-border">
                  {item.step}
                </span>
              </div>
              <div className="pt-1">
                <h3 className="mb-1.5 text-sm font-semibold text-text-primary">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                {i < 2 && (
                  <div className="mt-4 hidden sm:block h-px w-full bg-surface-border" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-text-secondary leading-relaxed">
          <span className="font-medium text-amber-400">Note:</span> Wallet connectivity and trade
          execution will be enabled in a future integration phase. This prototype demonstrates the
          interface and experience.
        </div>
      </section>
    </div>
  );
}
