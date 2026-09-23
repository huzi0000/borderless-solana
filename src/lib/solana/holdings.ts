import { Connection, PublicKey } from "@solana/web3.js";
import { getSolanaNetwork, type SolanaNetworkType } from "./network";
import type { Asset } from "@/lib/market-data/types";

// Standard Solana SPL Token Programs
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export interface LiveWalletHolding {
  mintAddress: string;
  tokenTicker: string;
  underlyingTicker: string;
  companyName: string;
  category: string;
  decimals: number;
  rawAmount: string;
  quantity: number;
  logoUrl?: string;
  logoInitials: string;
  logoColor: string;
  isin?: string;
  // Honest pricing: if real price is unavailable, undefined
  price?: number;
  marketValue?: number;
  priceStatus: "live" | "unavailable";
  network: SolanaNetworkType;
}

export type LiveHoldingsStatus =
  | "connected_matching"
  | "connected_empty"
  | "network_mismatch"
  | "error";

export interface LiveHoldingsResult {
  holdings: LiveWalletHolding[];
  status: LiveHoldingsStatus;
  message?: string;
  network: SolanaNetworkType;
  isMainnet: boolean;
  totalTokenAccountsScanned: number;
  verifiedMatchesCount: number;
}

/**
 * Scans the connected wallet's SPL token accounts on Solana
 * and matches token mints STRICTLY against verified xStocks mint addresses.
 *
 * CRITICAL SECURITY & HONESTY RULES:
 * 1. Read-only: never requests signatures or secret keys.
 * 2. Strict matching by mint address only; never by ticker or company name.
 * 3. Network aware: xStocks exist on Mainnet. If connected to Devnet,
 *    we clearly report network mismatch rather than pretending Devnet has Mainnet xStocks.
 * 4. Transparent pricing: when live pricing requires an onboarded institutional API key,
 *    we report "Live price unavailable" instead of calculating a fake dollar valuation.
 */
export async function fetchLiveWalletHoldings(
  connection: Connection,
  walletPublicKey: PublicKey,
  verifiedAssets: Asset[]
): Promise<LiveHoldingsResult> {
  const currentNetwork = getSolanaNetwork();
  const isMainnet = currentNetwork === "mainnet-beta";

  // Build a strict lookup map: mintAddress -> Asset
  // ONLY for assets that have a verified Solana mintAddress
  const mintToAssetMap = new Map<string, Asset>();
  for (const asset of verifiedAssets) {
    if (asset.mintAddress && asset.mintNetwork === "Solana") {
      mintToAssetMap.set(asset.mintAddress, asset);
    }
  }

  // Network Guard: xStocks are issued on Solana Mainnet
  if (!isMainnet) {
    return {
      holdings: [],
      status: "network_mismatch",
      message:
        "Official xStocks tokens are issued on Solana Mainnet. Your wallet connection is currently set to Solana Devnet. Switch NEXT_PUBLIC_SOLANA_NETWORK to mainnet-beta in production to inspect live Mainnet holdings.",
      network: currentNetwork,
      isMainnet: false,
      totalTokenAccountsScanned: 0,
      verifiedMatchesCount: 0,
    };
  }

  try {
    // Query both standard SPL Token and Token-2022 accounts
    const [standardAccounts, token2022Accounts] = await Promise.allSettled([
      connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        programId: TOKEN_PROGRAM_ID,
      }),
      connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ]);

    const allAccounts: Array<{
      mint: string;
      uiAmount: number;
      decimals: number;
      amount: string;
    }> = [];

    if (standardAccounts.status === "fulfilled") {
      for (const { account } of standardAccounts.value.value) {
        const info = account?.data?.parsed?.info;
        if (info && info.mint && info.tokenAmount) {
          allAccounts.push({
            mint: info.mint,
            uiAmount: info.tokenAmount.uiAmount ?? 0,
            decimals: info.tokenAmount.decimals ?? 0,
            amount: info.tokenAmount.amount ?? "0",
          });
        }
      }
    }

    if (token2022Accounts.status === "fulfilled") {
      for (const { account } of token2022Accounts.value.value) {
        const info = account?.data?.parsed?.info;
        if (info && info.mint && info.tokenAmount) {
          allAccounts.push({
            mint: info.mint,
            uiAmount: info.tokenAmount.uiAmount ?? 0,
            decimals: info.tokenAmount.decimals ?? 0,
            amount: info.tokenAmount.amount ?? "0",
          });
        }
      }
    }

    // Match by mint address ONLY
    const matchedHoldings: LiveWalletHolding[] = [];

    for (const tokenAcct of allAccounts) {
      if (tokenAcct.uiAmount <= 0) continue;

      const matchedAsset = mintToAssetMap.get(tokenAcct.mint);
      if (matchedAsset) {
        matchedHoldings.push({
          mintAddress: matchedAsset.mintAddress!,
          tokenTicker: matchedAsset.tokenTicker,
          underlyingTicker: matchedAsset.ticker,
          companyName: matchedAsset.companyName,
          category: matchedAsset.category,
          decimals: tokenAcct.decimals,
          rawAmount: tokenAcct.amount,
          quantity: tokenAcct.uiAmount,
          logoUrl: matchedAsset.logoUrl,
          logoInitials: matchedAsset.logoInitials,
          logoColor: matchedAsset.logoColor,
          isin: matchedAsset.isin,
          // Real live price is only set if verified live source exists
          price: matchedAsset.priceDataSource === "live" ? matchedAsset.price : undefined,
          marketValue:
            matchedAsset.priceDataSource === "live"
              ? tokenAcct.uiAmount * matchedAsset.price
              : undefined,
          priceStatus: matchedAsset.priceDataSource === "live" ? "live" : "unavailable",
          network: currentNetwork,
        });
      }
    }

    if (matchedHoldings.length === 0) {
      return {
        holdings: [],
        status: "connected_empty",
        message: `Scanned ${allAccounts.length} token accounts on Solana Mainnet. No verified xStocks holdings found in this wallet.`,
        network: currentNetwork,
        isMainnet: true,
        totalTokenAccountsScanned: allAccounts.length,
        verifiedMatchesCount: 0,
      };
    }

    return {
      holdings: matchedHoldings,
      status: "connected_matching",
      network: currentNetwork,
      isMainnet: true,
      totalTokenAccountsScanned: allAccounts.length,
      verifiedMatchesCount: matchedHoldings.length,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      holdings: [],
      status: "error",
      message: `Failed to inspect token accounts via Solana RPC: ${errMsg}`,
      network: currentNetwork,
      isMainnet: true,
      totalTokenAccountsScanned: 0,
      verifiedMatchesCount: 0,
    };
  }
}
