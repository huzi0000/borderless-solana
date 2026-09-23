# Borderless

A consumer-facing application for discovering and accessing tokenized global equities on Solana.

> **This is a frontend-only MVP prototype.** All market data is demo data. No blockchain transactions are executed.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — hero, market preview, product explanation |
| `/discover` | Markets — search, filter, sort all assets |
| `/asset/[id]` | Asset detail — chart, price, buy panel |
| `/portfolio` | Demo portfolio with holdings and P&L |
| `/watchlist` | Saved assets (localStorage) |

## Mock Data

All market data lives in `src/data/assets.ts`. Replace `mockAssets` and the generator functions with real API calls (xStocks, Helius, etc.) during integration.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Recharts
- Lucide React

## Future Integration Points

- `src/data/assets.ts` → Replace with xStocks API
- `src/data/portfolio.ts` → Replace with Solana RPC/Helius wallet data
- `src/components/BuyPanel.tsx` → `calculateEstimate()` → Replace with real QuoteProvider
- `src/context/WatchlistContext.tsx` → Optionally sync to wallet/account
