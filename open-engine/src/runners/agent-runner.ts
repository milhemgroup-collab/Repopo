import type { Ticket } from '../types.js';
import type { ReceiptInput } from '../receipt.js';

/** A blocking question an agent needs answered before it can proceed. */
export interface RunBlocker {
  question: string;
  missingContext: string;
}

/** A child unit of work an agent wants to delegate to a specialized agent. */
export interface DelegationRequest {
  spec: Parameters<import('../validator.js').TaskSpecValidator['normalize']>[0];
  queue?: string;
  priority?: number;
  /** If true, the parent waits (moves to needs-input) until the child is done. */
  blockParent?: boolean;
  note?: string;
}

/** The outcome an agent reports back to the engine after a run. */
export type RunResult =
  | { outcome: 'done'; receipt: ReceiptInput; progress?: string[] }
  | { outcome: 'blocked'; blockers: RunBlocker[]; progress?: string[] }
  | { outcome: 'failed'; error: string; progress?: string[] }
  | { outcome: 'delegated'; delegations: DelegationRequest[]; progress?: string[] };

/** Context handed to a runner so it can emit progress/heartbeats mid-run. */
export interface RunContext {
  /** Append a progress line to the ticket's audit trail. */
  logProgress(message: string): void;
  /** Renew the claim lease so a long run is not reclaimed as stale. */
  heartbeat(): void;
}

/**
 * AgentRunner — the swappable execution backend. A runner is any capable agent:
 * a mock (for tests), a shell task, or a real LLM-driven coder. The engine only
 * cares about the {@link RunResult} contract, never how the work got done.
 */
export interface AgentRunner {
  readonly id: string;
  readonly capabilities: string[];
  run(ticket: Ticket, ctx: RunContext): Promise<RunResult>;
}
