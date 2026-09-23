"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Info, Globe2, Wallet, ArrowRight, CheckCircle2, Loader2, Copy, Check } from "lucide-react";
import type { Asset } from "@/data/assets";
import { Modal } from "@/components/ui/Modal";
import { usePortfolio, DemoTrade } from "@/context/PortfolioContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getExecutionProvider } from "@/lib/execution";
import { getNetworkDisplayName } from "@/lib/solana/network";
import type { ExecutionQuote } from "@/lib/execution";

const BUY_PRESETS = [25, 50, 100, 250];
const SELL_PERCENT_PRESETS = [25, 50, 75, 100];

type OrderSide = "BUY" | "SELL";
type OrderStep = "input" | "review" | "processing" | "success";

interface BuyPanelProps {
  asset: Asset;
}

export function BuyPanel({ asset }: BuyPanelProps) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<OrderStep>("input");
  const [modalOpen, setModalOpen] = useState(false);
  const [completedTrade, setCompletedTrade] = useState<DemoTrade | null>(null);
  const [activeQuote, setActiveQuote] = useState<ExecutionQuote | null>(null);
  const [txIdCopied, setTxIdCopied] = useState(false);

  const { publicKey, connected } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { getHolding, executeTrade } = usePortfolio();

  const holding = getHolding(asset.id);
  const availableUnits = holding ? holding.quantity : 0;
  const availableUsdValue = availableUnits * asset.price;

  const numAmount = parseFloat(amount) || 0;
  const estimatedQuantity = asset.price > 0 ? numAmount / asset.price : 0;

  // Validation
  const isPositive = numAmount > 0;
  const hasSufficientBalance = side === "BUY" || numAmount <= availableUsdValue + 0.001;
  const isValid = isPositive && hasSufficientBalance;

  const handleBuyPreset = (val: number) => {
    setAmount(String(val));
  };

  const handleSellPercentPreset = (pct: number) => {
    if (availableUsdValue <= 0) return;
    const calc = (availableUsdValue * pct) / 100;
    setAmount(calc.toFixed(2));
  };

  const handleReviewOrder = async () => {
    if (!isValid) return;
    const provider = getExecutionProvider();
    const quote = await provider.getQuote({
      asset,
      side,
      amountUsd: numAmount,
    });
    setActiveQuote(quote);
    setStep("review");
    setModalOpen(true);
  };

  const handleConfirmTrade = async () => {
    if (!connected || !publicKey) {
      openWalletModal(true);
      return;
    }
    if (!activeQuote) return;

    setStep("processing");

    const provider = getExecutionProvider();
    const result = await provider.execute({
      quote: activeQuote,
      walletAddress: publicKey.toBase58(),
    });

    // Realistic network confirmation simulation
    setTimeout(() => {
      const trade = executeTrade({
        assetId: result.assetId,
        tokenTicker: result.tokenTicker,
        side: result.side,
        amountUsd: result.amountUsd,
        quantity: result.quantity,
        price: result.price,
        walletAddress: publicKey.toBase58(),
      });

      setCompletedTrade(trade);
      setStep("success");
    }, 1100);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setStep("input");
      if (completedTrade) {
        setAmount("");
      }
    }, 250);
  };

  const handleCopyTxId = async () => {
    if (!completedTrade) return;
    try {
      await navigator.clipboard.writeText(completedTrade.id);
      setTxIdCopied(true);
      setTimeout(() => setTxIdCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <>
      <div className="rounded-xl border border-surface-border bg-surface p-5">
        {/* Buy / Sell Tabs */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-surface-border bg-background p-1">
          <button
            onClick={() => {
              setSide("BUY");
              setAmount("");
            }}
            className={cn(
              "rounded-md py-2 text-xs font-semibold transition-all",
              side === "BUY"
                ? "bg-accent text-black shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Buy {asset.tokenTicker}
          </button>
          <button
            onClick={() => {
              setSide("SELL");
              setAmount("");
            }}
            className={cn(
              "rounded-md py-2 text-xs font-semibold transition-all",
              side === "SELL"
                ? "bg-surface-raised text-text-primary border border-surface-border shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Sell {asset.tokenTicker}
          </button>
        </div>

        {/* Available position info when selling */}
        {side === "SELL" && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-surface-raised p-2.5 text-xs">
            <span className="text-text-muted">Available to sell:</span>
            <span className="tabular-nums font-medium text-text-primary">
              {formatNumber(availableUnits, 4)} {asset.tokenTicker} ({formatCurrency(availableUsdValue)})
            </span>
          </div>
        )}

        {/* Amount input */}
        <div className="mb-3">
          <label className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
            <span>{side === "BUY" ? "You pay" : "You sell"}</span>
            <span className="text-[11px] text-text-muted">USD Equivalent</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              className={cn(
                "w-full rounded-lg border border-surface-border bg-surface-raised py-3 pl-7 pr-16 text-sm text-text-primary placeholder:text-text-muted transition-colors",
                "focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20",
                side === "SELL" && numAmount > availableUsdValue && "border-red-500/50 focus:border-red-500"
              )}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted">
              USDC
            </span>
          </div>

          {/* Validation warning */}
          {side === "SELL" && numAmount > availableUsdValue && (
            <p className="mt-1.5 text-xs text-red-400">
              Amount exceeds your holdings of {formatNumber(availableUnits, 4)} {asset.tokenTicker}
            </p>
          )}
        </div>

        {/* Presets */}
        <div className="mb-5 grid grid-cols-4 gap-1.5">
          {side === "BUY"
            ? BUY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleBuyPreset(preset)}
                  className={cn(
                    "rounded-md border py-2 min-h-[36px] text-xs font-medium transition-colors",
                    numAmount === preset
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-surface-border bg-surface-raised text-text-secondary hover:border-accent/20 hover:text-text-primary"
                  )}
                >
                  ${preset}
                </button>
              ))
            : SELL_PERCENT_PRESETS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleSellPercentPreset(pct)}
                  disabled={availableUnits <= 0}
                  className={cn(
                    "rounded-md border border-surface-border bg-surface-raised py-2 min-h-[36px] text-xs font-medium text-text-secondary transition-colors",
                    "hover:border-accent/20 hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {pct === 100 ? "Max" : `${pct}%`}
                </button>
              ))}
        </div>

        {/* Order details */}
        <div className="mb-4 space-y-2.5 rounded-lg border border-surface-border bg-background p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">
              {side === "BUY" ? "Estimated receive" : "Estimated deliver"}
            </span>
            <span className="tabular-nums font-medium text-text-primary">
              {isValid ? `≈ ${formatNumber(estimatedQuantity, 6)} ${asset.tokenTicker}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Reference price</span>
            <span className="tabular-nums text-text-secondary">
              {formatCurrency(asset.price)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Estimated total</span>
            <span className="tabular-nums text-text-primary font-medium">
              {isValid ? `${formatCurrency(numAmount)} USDC` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-text-muted">
              <Globe2 size={11} />
              Network
            </span>
            <span className="text-text-secondary">Solana Devnet</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-text-muted">
              <Info size={11} />
              Transaction type
            </span>
            <span className="text-amber-400 font-medium">Demo / Simulated</span>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleReviewOrder}
          disabled={!isValid}
          className={cn(
            "w-full rounded-lg py-3 text-sm font-semibold transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            side === "BUY"
              ? "bg-accent text-black hover:bg-accent/90 disabled:bg-accent/30 disabled:text-black/50"
              : "bg-surface-raised border border-surface-border text-text-primary hover:bg-surface-border disabled:opacity-40",
            !isValid && "cursor-not-allowed"
          )}
        >
          Review order
        </button>

        {!isValid && (
          <p className="mt-2 text-center text-xs text-text-muted">
            {side === "SELL" && availableUnits <= 0
              ? "You do not hold this asset yet"
              : "Enter an amount to continue"}
          </p>
        )}
      </div>

      {/* Confirmation & Execution Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} size="md">
        <div className="p-6">
          {/* STEP 1: REVIEW */}
          {step === "review" && (
            <>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      side === "BUY"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    )}
                  >
                    {side} Order
                  </span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">Demo Review</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {side === "BUY" ? `Buy ${asset.tokenTicker}` : `Sell ${asset.tokenTicker}`}
                </h3>
              </div>

              <div className="space-y-2.5 rounded-xl border border-surface-border bg-background p-4 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Amount</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(numAmount)} USDC
                  </span>
                </div>
                <div className="border-t border-surface-border" />
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {side === "BUY" ? "Estimated receive" : "Estimated deliver"}
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    ≈ {formatNumber(estimatedQuantity, 6)} {asset.tokenTicker}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Token metadata</span>
                  <span className="text-text-secondary text-xs font-medium">
                    {asset.tokenDataSource === "live" ? "xStocks / Backed (Official)" : "Demo Reference Data"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Price</span>
                  <span className="text-text-secondary text-xs">
                    {formatCurrency(asset.price)} (Demo reference price)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Execution</span>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                    Simulation
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Network</span>
                  <span className="text-text-secondary text-xs font-medium">{getNetworkDisplayName()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Wallet</span>
                  <span className="font-mono text-xs text-text-secondary">
                    {publicKey
                      ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                      : "Not connected"}
                  </span>
                </div>
              </div>

              {/* Safety notice */}
              <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400/90 leading-relaxed">
                <span className="font-semibold">SIMULATED EXECUTION:</span> Live execution is not enabled in this prototype. Live atomic trade execution on Solana requires an authorized Backed/xStocks institutional client account. Trades update your local demo portfolio only.
              </div>

              {/* Action Buttons */}
              {!connected ? (
                <button
                  onClick={() => {
                    openWalletModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-raised border border-accent/40 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Wallet size={16} />
                  Connect wallet to continue
                </button>
              ) : (
                <button
                  onClick={handleConfirmTrade}
                  className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-black transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Confirm demo transaction
                </button>
              )}

              <button
                onClick={handleCloseModal}
                className="mt-2 w-full rounded-lg py-2.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                Cancel
              </button>
            </>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "processing" && (
            <div className="py-12 text-center">
              <Loader2 size={36} className="mx-auto mb-4 animate-spin text-accent" />
              <h3 className="mb-2 text-base font-semibold text-text-primary">
                Processing demo transaction...
              </h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                Submitting simulated order for {formatNumber(estimatedQuantity, 4)} {asset.tokenTicker} on Solana Devnet...
              </p>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && completedTrade && (
            <div className="py-4 text-center animate-in fade-in duration-200">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="mb-1 text-lg font-bold text-text-primary">
                Demo transaction successful
              </h3>
              <p className="mb-5 text-xs text-text-secondary max-w-sm mx-auto">
                Your simulated {completedTrade.side.toLowerCase()} order has been confirmed and applied to your local portfolio.
              </p>

              {/* Receipt details */}
              <div className="space-y-2 rounded-xl border border-surface-border bg-background p-4 text-left text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Asset</span>
                  <span className="font-semibold text-text-primary">{completedTrade.tokenTicker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Side</span>
                  <span className={cn("font-medium", completedTrade.side === "BUY" ? "text-emerald-400" : "text-amber-400")}>
                    {completedTrade.side}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Quantity</span>
                  <span className="tabular-nums font-semibold text-text-primary">
                    {formatNumber(completedTrade.quantity, 6)} {completedTrade.tokenTicker}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Reference price</span>
                  <span className="tabular-nums text-text-secondary">
                    {formatCurrency(completedTrade.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Timestamp</span>
                  <span className="text-text-secondary">
                    {new Date(completedTrade.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Connected wallet</span>
                  <span className="font-mono text-text-secondary">
                    {completedTrade.walletAddress.slice(0, 4)}...{completedTrade.walletAddress.slice(-4)}
                  </span>
                </div>
                <div className="border-t border-surface-border pt-2 flex items-center justify-between">
                  <span className="text-text-muted">Demo Tx ID</span>
                  <button
                    onClick={handleCopyTxId}
                    className="flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
                    title="Copy Transaction ID"
                  >
                    <span>{completedTrade.id.slice(0, 16)}...</span>
                    {txIdCopied ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/portfolio"
                  onClick={handleCloseModal}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-raised border border-surface-border py-2.5 text-xs font-semibold text-text-primary hover:border-accent/40 transition-colors"
                >
                  View in Portfolio
                  <ArrowRight size={12} />
                </Link>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg bg-accent py-2.5 text-xs font-semibold text-black hover:bg-accent/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export const TradingPanel = BuyPanel;
