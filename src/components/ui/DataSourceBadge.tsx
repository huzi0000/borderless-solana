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
 * next to it came from the official xStocks API, demo/mock data, or is unavailable.
 *
 * IMPORTANT: Never remove or hide this badge. Honest disclosure
 * of live vs simulated vs unavailable data is a core product requirement.
 */
export function DataSourceBadge({
  source,
  label,
  className = "",
  size = "xs",
}: DataSourceBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-1.5 py-0.5 text-[9px]";

  if (source === "live") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 font-mono font-semibold uppercase tracking-wider text-emerald-400 ${sizeClass} ${className}`}
        title="Token metadata verified from the official xStocks API"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {label ?? "LIVE DATA"}
      </span>
    );
  }

  if (source === "unavailable") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border border-surface-border bg-surface-raised font-mono font-medium uppercase tracking-wider text-text-muted ${sizeClass} ${className}`}
        title="Data is unavailable from public API feed"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
        {label ?? "UNAVAILABLE"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 font-mono font-semibold uppercase tracking-wider text-amber-400 ${sizeClass} ${className}`}
      title="This data is simulated for demo purposes"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {label ?? "DEMO DATA"}
    </span>
  );
}

interface PriceSourceBadgeProps {
  source: DataSource;
  className?: string;
}

/**
 * PriceSourceBadge — specifically for price fields.
 */
export function PriceSourceBadge({ source, className = "" }: PriceSourceBadgeProps) {
  const defaultLabel =
    source === "live"
      ? "LIVE PRICE"
      : source === "unavailable"
      ? "PRICE UNAVAILABLE"
      : "DEMO PRICE";

  return (
    <DataSourceBadge
      source={source}
      label={defaultLabel}
      className={className}
    />
  );
}
