"use client";

import { type DataSource } from "@/lib/market-data/types";

interface DataSourceBadgeProps {
  source: DataSource;
  label?: string;
  className?: string;
  size?: "sm" | "xs";
}

/**
 * DataSourceBadge
 * Renders a small pill that honestly communicates whether the data
 * next to it came from the official xStocks API or is demo/mock data.
 *
 * IMPORTANT: Never remove or hide this badge. Honest disclosure
 * of live vs simulated data is a core product requirement.
 */
export function DataSourceBadge({
  source,
  label,
  className = "",
  size = "xs",
}: DataSourceBadgeProps) {
  const isLive = source === "live";
  const text = label ?? (isLive ? "LIVE DATA" : "DEMO DATA");

  const sizeClass = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-1.5 py-0.5 text-[9px]";

  if (isLive) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 font-mono font-semibold uppercase tracking-wider text-emerald-400 ${sizeClass} ${className}`}
        title="Token metadata verified from the official xStocks API"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 font-mono font-semibold uppercase tracking-wider text-amber-400 ${sizeClass} ${className}`}
      title="This data is simulated for demo purposes"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {text}
    </span>
  );
}

interface PriceSourceBadgeProps {
  source: DataSource;
  className?: string;
}

/**
 * PriceSourceBadge — specifically for price fields.
 * Prices require an API key we don't have, so they are always demo.
 */
export function PriceSourceBadge({ source, className = "" }: PriceSourceBadgeProps) {
  return (
    <DataSourceBadge
      source={source}
      label={source === "live" ? "LIVE PRICE" : "DEMO PRICE"}
      className={className}
    />
  );
}
