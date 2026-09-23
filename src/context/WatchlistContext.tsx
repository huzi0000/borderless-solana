"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const WATCHLIST_KEY = "borderless_watchlist";

interface WatchlistContextType {
  watchlist: string[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  isWatched: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Safely read from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchlist(parsed.filter((item): item is string => typeof item === "string"));
        }
      }
    } catch {
      // localStorage not available or corrupt
      setWatchlist([]);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch {
      // localStorage not available
    }
  }, [watchlist, hydrated]);

  const addToWatchlist = (id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeFromWatchlist = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== id));
  };

  const isWatched = (id: string) => watchlist.includes(id);

  const toggleWatchlist = (id: string) => {
    if (isWatched(id)) {
      removeFromWatchlist(id);
    } else {
      addToWatchlist(id);
    }
  };

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, isWatched, toggleWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextType {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used inside WatchlistProvider");
  return ctx;
}
