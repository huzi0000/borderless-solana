import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type SolanaNetworkType = "devnet" | "mainnet-beta";

export function getSolanaNetwork(): SolanaNetworkType {
  const env = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase().trim();
  if (env === "mainnet" || env === "mainnet-beta") {
    return "mainnet-beta";
  }
  return "devnet";
}

export function getWalletAdapterNetwork(): WalletAdapterNetwork {
  const net = getSolanaNetwork();
  return net === "mainnet-beta"
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;
}

export function getNetworkDisplayName(network = getSolanaNetwork()): string {
  return network === "mainnet-beta" ? "Solana Mainnet" : "Solana Devnet";
}

export function getSolanaExplorerUrl(
  path: string,
  type: "address" | "tx" = "address",
  network = getSolanaNetwork()
): string {
  const clusterParam = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/${type}/${path}${clusterParam}`;
}
