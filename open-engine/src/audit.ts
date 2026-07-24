import type { AuditEvent, AuditEventType } from './types.js';
import type { Db } from './db.js';
import { type Clock, newId, toIso } from './util.js';

/**
 * AuditLogger — every state transition and side effect writes an event here.
 *
 * The audit log is append-only and is the durable narrative of a ticket: who
 * did what, when, and why. It is what lets a fresh agent reconstruct history
 * without replaying a chat.
 */
export interface AuditLogger {
  record(
    ticketId: string,
    type: AuditEventType,
    actor: string,
    payload?: Record<string, unknown>,
  ): AuditEvent;
  history(ticketId: string): AuditEvent[];
  recent(limit?: number): AuditEvent[];
}

export class SqliteAuditLogger implements AuditLogger {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  record(
    ticketId: string,
    type: AuditEventType,
    actor: string,
    payload: Record<string, unknown> = {},
  ): AuditEvent {
    const event: AuditEvent = {
      id: newId('evt'),
      ticketId,
      type,
      actor,
      at: toIso(this.clock.now()),
      payload,
    };
    this.db.appendEvent(event);
    return event;
  }

  history(ticketId: string): AuditEvent[] {
    return this.db.eventsFor(ticketId);
  }

  recent(limit = 100): AuditEvent[] {
    return this.db.allEvents(limit);
  }
}
