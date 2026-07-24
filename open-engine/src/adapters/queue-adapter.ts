import type { ClaimResult, Ticket, TicketFilter } from '../types.js';

export interface ClaimOptions {
  agentId: string;
  /** Claim lease duration in ms; after this the claim may be stolen if stale. */
  leaseMs?: number;
}

/**
 * QueueAdapter — the swappable boundary between Open Engine and wherever tickets
 * live. The local SQLite adapter is the reference implementation; Linear and
 * Jira adapters implement the same contract against their APIs.
 *
 * Adapters own two things the engine deliberately does not:
 *  1. durable persistence of tickets, and
 *  2. **atomic** claim/release so two agents never work the same ticket.
 */
export interface QueueAdapter {
  readonly name: string;

  /** Persist a brand-new ticket (already constructed by the engine). */
  put(ticket: Ticket): Ticket;

  /** Persist changes to an existing ticket. */
  update(ticket: Ticket): Ticket;

  get(id: string): Ticket | null;

  list(filter?: TicketFilter): Ticket[];

  /**
   * Atomically move a matching `agent-to-do` ticket to `agent-working` and
   * stamp a claim lock. Must be safe under concurrency.
   */
  claim(id: string, opts: ClaimOptions): ClaimResult;

  /** Release a claim; the token must match the current lock holder. */
  release(id: string, token: string): boolean;

  /** The highest-priority available (`agent-to-do`) ticket matching `filter`. */
  nextAvailable(filter?: TicketFilter): Ticket | null;
}
