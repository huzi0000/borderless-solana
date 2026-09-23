"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  assetId: string;
  className?: string;
  size?: "sm" | "md";
}

export function WatchlistButton({ assetId, className, size = "md" }: WatchlistButtonProps) {
  const { isWatched, toggleWatchlist } = useWatchlist();
  const watched = isWatched(assetId);

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist(assetId);
      }}
      className={cn(
        "flex items-center justify-center rounded-md transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        size === "sm"
          ? "h-8 w-8 sm:h-7 sm:w-7 text-xs"
          : "h-9 w-9 sm:h-8 sm:w-8",
        watched
          ? "text-accent hover:text-accent/80"
          : "text-text-muted hover:text-text-secondary",
        className
      )}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={watched}
    >
      {watched ? (
        <BookmarkCheck size={iconSize} strokeWidth={2} />
      ) : (
        <Bookmark size={iconSize} strokeWidth={1.5} />
      )}
    </button>
  );
}
