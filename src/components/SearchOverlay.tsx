"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { searchAssets } from "@/data/assets";
import type { Asset } from "@/data/assets";
import { AssetLogo } from "@/components/ui/AssetLogo";
import { PercentBadge } from "@/components/ui/PriceChange";
import { formatCurrency } from "@/lib/utils";

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  useEffect(() => {
    setResults(searchAssets(query));
  }, [query]);

  const handleSelect = (asset: Asset) => {
    onClose();
    router.push(`/asset/${asset.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search panel */}
      <div className="relative mx-auto mt-16 w-full max-w-2xl px-4">
        <div className="rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
            <Search size={16} className="flex-shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies or tickers…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              aria-label="Search assets"
            />
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 && query.trim() !== "" ? (
              <div className="px-4 py-8 text-center text-sm text-text-secondary">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <ul role="listbox" aria-label="Search results">
                {results.slice(0, 8).map((asset) => (
                  <li key={asset.id} role="option" aria-selected="false">
                    <button
                      onClick={() => handleSelect(asset)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-raised group"
                    >
                      <AssetLogo asset={asset} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {asset.tokenTicker}
                          </span>
                          <span className="text-xs text-text-muted">{asset.companyName}</span>
                        </div>
                        <span className="text-xs text-text-muted">{asset.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm tabular-nums text-text-secondary">
                          {formatCurrency(asset.price)}
                        </span>
                        <PercentBadge percent={asset.changePercent24h} />
                        <ArrowRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!query && (
              <div className="px-4 py-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                  Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {["NVDAx", "AAPLx", "TSLAx", "SPYx", "MSFTx"].map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => setQuery(ticker)}
                      className="rounded-md border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-text-muted">
          Press <kbd className="rounded border border-surface-border bg-surface-raised px-1 py-0.5 text-[10px]">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
