"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function AssetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
        <AlertCircle size={26} />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-2 sm:text-2xl">
        Market data temporarily unavailable
      </h1>
      <p className="mx-auto max-w-md text-sm text-text-secondary mb-6 leading-relaxed">
        We encountered a temporary connection issue while querying official xStocks market data.
        You can try refreshing or return to the market directory.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black hover:bg-accent/90 transition-colors"
        >
          <RefreshCw size={13} />
          Try again
        </button>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={13} />
          Return to Markets
        </Link>
      </div>
    </div>
  );
}
