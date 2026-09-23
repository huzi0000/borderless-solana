import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { SolanaWalletProvider } from "@/context/SolanaWalletProvider";

export const metadata: Metadata = {
  title: "Borderless — Global Markets on Solana",
  description:
    "Discover tokenized global equities through a simple, non-custodial interface built for the internet economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-text-primary antialiased overflow-x-hidden">
        <SolanaWalletProvider>
          <PortfolioProvider>
            <WatchlistProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </WatchlistProvider>
          </PortfolioProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
