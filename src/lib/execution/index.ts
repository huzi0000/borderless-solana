import type { ExecutionProvider } from "./provider";
import { DemoExecutionProvider } from "./demo-provider";

export type { ExecutionProvider } from "./provider";
export * from "./types";
export { DemoExecutionProvider } from "./demo-provider";

let _executionProvider: ExecutionProvider | null = null;

/**
 * Returns the active execution provider.
 * Active provider is DemoExecutionProvider, as live execution requires
 * an onboarded Backed institutional client account.
 */
export function getExecutionProvider(): ExecutionProvider {
  if (!_executionProvider) {
    _executionProvider = new DemoExecutionProvider();
  }
  return _executionProvider;
}
