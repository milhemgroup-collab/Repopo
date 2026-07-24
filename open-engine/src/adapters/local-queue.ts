import type { ClaimResult, Ticket, TicketFilter } from '../types.js';
import type { Db } from '../db.js';
import { type Clock, newId, toIso } from '../util.js';
import type { ClaimOptions, QueueAdapter } from './queue-adapter.js';

const DEFAULT_LEASE_MS = 5 * 60 * 1000;

function capabilitiesSatisfied(required: string[], available?: string[]): boolean {
  if (!available) return true;
  const have = new Set(available);
  return required.every((c) => have.has(c));
}

function matches(t: Ticket, f?: TicketFilter): boolean {
  if (!f) return true;
  if (f.state && t.state !== f.state) return false;
  if (f.queue && t.queue !== f.queue) return false;
  if (f.parentTicket !== undefined && t.parentTicket !== f.parentTicket) return false;
  if (f.capabilities && !capabilitiesSatisfied(t.spec.requiredCapability, f.capabilities)) return false;
  return true;
}

/**
 * LocalQueueAdapter — durable, local-first queue backed by SQLite.
 *
 * This is the MVP default: Open Engine works with zero external credentials.
 * Claims are made inside an IMMEDIATE transaction with a re-read guard, so two
 * agents racing for the same ticket cannot both win.
 */
export class LocalQueueAdapter implements QueueAdapter {
  readonly name = 'local';

  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  put(ticket: Ticket): Ticket {
    this.db.upsertTicket(ticket);
    return ticket;
  }

  update(ticket: Ticket): Ticket {
    ticket.updatedAt = toIso(this.clock.now());
    this.db.upsertTicket(ticket);
    return ticket;
  }

  get(id: string): Ticket | null {
    return this.db.getTicket(id);
  }

  list(filter?: TicketFilter): Ticket[] {
    return this.db.allTickets().filter((t) => matches(t, filter));
  }

  private isClaimActive(t: Ticket, now: Date): boolean {
    if (!t.claim) return false;
    return new Date(t.claim.expiresAt).getTime() > now.getTime();
  }

  /**
   * A ticket is available to claim if it is fresh in `agent-to-do`, or if it is
   * `agent-working` but its claim lease has expired (an abandoned run).
   */
  private isAvailable(t: Ticket, now: Date): boolean {
    if (this.isClaimActive(t, now)) return false;
    if (t.state === 'agent-to-do') return true;
    if (t.state === 'agent-working' && t.claim) return true; // claim present but expired
    return false;
  }

  nextAvailable(filter?: TicketFilter): Ticket | null {
    const now = this.clock.now();
    const candidates = this.db
      .allTickets()
      .filter((t) => this.isAvailable(t, now))
      .filter((t) => matches(t, { ...filter, state: undefined }))
      .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));
    return candidates[0] ?? null;
  }

  claim(id: string, opts: ClaimOptions): ClaimResult {
    return this.db.transaction(() => {
      const t = this.db.getTicket(id);
      if (!t) return { ok: false, reason: 'not-found' } as const;

      const now = this.clock.now();
      if (this.isClaimActive(t, now)) {
        return { ok: false, reason: 'already-claimed' } as const;
      }
      if (!this.isAvailable(t, now)) {
        return { ok: false, reason: 'wrong-state' } as const;
      }

      const token = newId('claim');
      const nowIso = toIso(now);
      const leaseMs = opts.leaseMs ?? DEFAULT_LEASE_MS;
      t.state = 'agent-working';
      t.claim = {
        agentId: opts.agentId,
        token,
        claimedAt: nowIso,
        expiresAt: toIso(new Date(now.getTime() + leaseMs)),
        lastHeartbeatAt: nowIso,
      };
      t.updatedAt = nowIso;
      this.db.upsertTicket(t);
      return { ok: true, ticket: t, token } as const;
    });
  }

  release(id: string, token: string): boolean {
    return this.db.transaction(() => {
      const t = this.db.getTicket(id);
      if (!t || !t.claim || t.claim.token !== token) return false;
      t.claim = null;
      t.updatedAt = toIso(this.clock.now());
      this.db.upsertTicket(t);
      return true;
    });
  }
}
