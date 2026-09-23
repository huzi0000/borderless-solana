import type { ExecutionProvider } from "./provider";
import type {
  ExecutionQuoteRequest,
  ExecutionQuote,
  TradeExecutionRequest,
  TradeExecutionResult,
  ExecutionMode,
} from "./types";
import { getNetworkDisplayName } from "@/lib/solana/network";

export class DemoExecutionProvider implements ExecutionProvider {
  readonly name = "DemoExecutionProvider";
  readonly mode: ExecutionMode = "simulation";
  readonly isLive = false;
  readonly capabilityDescription =
    "Execution Simulation: Trades update your local demo portfolio. Live atomic execution on Solana requires an onboarded Backed/xStocks institutional client account.";

  async getQuote(req: ExecutionQuoteRequest): Promise<ExecutionQuote> {
    const { asset, side, amountUsd } = req;
    const price = asset.price ?? 0;
    const quantity = price > 0 ? amountUsd / price : 0;

    return {
      quoteId: `quote_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      assetId: asset.id,
      tokenTicker: asset.tokenTicker,
      side,
      amountUsd,
      quantity,
      price,
      priceSource: asset.priceDataSource ?? "unavailable",
      isExecutable: false, // Indicative/simulated only
      mode: "simulation",
      expiresAt: Date.now() + 60_000, // 60s validity window
      network: getNetworkDisplayName(),
      estimatedFeeUsd: 0.0,
      disclaimer: "Simulated Quote — Not an executable Mainnet order",
    };
  }

  async execute(req: TradeExecutionRequest): Promise<TradeExecutionResult> {
    const { quote } = req;

    // Generate a clearly labeled simulated demo transaction ID
    const demoTxId = `demo_tx_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    return {
      success: true,
      txIdentifier: demoTxId,
      mode: "simulation",
      assetId: quote.assetId,
      tokenTicker: quote.tokenTicker,
      side: quote.side,
      amountUsd: quote.amountUsd,
      quantity: quote.quantity,
      price: quote.price,
      timestamp: Date.now(),
      network: quote.network,
      message: "Order simulated successfully in local demo portfolio.",
      simulated: true,
    };
  }
}
