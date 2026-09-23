"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, ChevronDown, Copy, Check, LogOut, ExternalLink } from "lucide-react";
import {
  getSolanaNetwork,
  getNetworkDisplayName,
  getSolanaExplorerUrl,
} from "@/lib/solana/network";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeNetwork = getSolanaNetwork();
  const networkName = getNetworkDisplayName(activeNetwork);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary transition-all",
          "hover:border-accent/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          connecting && "opacity-60 cursor-not-allowed"
        )}
      >
        <Wallet size={13} className="text-text-secondary" />
        {connecting ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  const base58 = publicKey.toBase58();
  const shortened = `${base58.slice(0, 4)}...${base58.slice(-4)}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-all",
          "hover:border-accent/40 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          dropdownOpen && "border-accent/50 bg-surface-raised"
        )}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono tabular-nums">{shortened}</span>
        <ChevronDown
          size={13}
          className={cn(
            "text-text-muted transition-transform duration-200",
            dropdownOpen && "rotate-180 text-text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-surface-border bg-surface p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mb-3 border-b border-surface-border pb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">Connected Wallet</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {activeNetwork === "mainnet-beta" ? "Mainnet" : "Devnet"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-raised p-2">
              <span className="font-mono text-xs text-text-primary break-all">
                {shortened}
              </span>
              <button
                onClick={handleCopy}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                title="Copy full address"
                aria-label="Copy full wallet address"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <span className="text-text-muted">Network</span>
              <span className="text-text-secondary font-medium">{networkName}</span>
            </div>
            <a
              href={getSolanaExplorerUrl(base58, "address", activeNetwork)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <span>View on Solscan</span>
              <ExternalLink size={12} className="text-text-muted" />
            </a>
          </div>

          <div className="border-t border-surface-border pt-2">
            <button
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
              aria-label="Disconnect wallet"
            >
              <LogOut size={13} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
