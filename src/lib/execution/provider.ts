import type {
  ExecutionQuoteRequest,
  ExecutionQuote,
  TradeExecutionRequest,
  TradeExecutionResult,
  ExecutionMode,
} from "./types";

export interface ExecutionProvider {
  /** Human-readable provider identifier */
  readonly name: string;

  /** Operating execution mode */
  readonly mode: ExecutionMode;

  /** Whether this provider moves real funds / executes on-chain */
  readonly isLive: boolean;

  /** Capability statement displayed in UI disclosures */
  readonly capabilityDescription: string;

  /** Generates an indicative or executable quote */
  getQuote(request: ExecutionQuoteRequest): Promise<ExecutionQuote>;

  /** Executes trade through the provider */
  execute(request: TradeExecutionRequest): Promise<TradeExecutionResult>;
}
