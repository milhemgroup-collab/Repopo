import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import type { AuditEvent, Ticket } from './types.js';

// `node:sqlite` is a recent Node builtin. Load it through createRequire so
// bundlers/test-runners that don't yet know the specifier leave it alone and
// Node resolves it natively at runtime.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

/**
 * Thin durable store over `node:sqlite` (Node's built-in SQLite, no native deps).
 *
 * Rows keep the hot columns (id, state, queue, priority, parent) queryable and
 * stash the rest of the ticket as JSON. The store is deliberately dumb: all
 * lifecycle rules live in the engine and state machine, not in SQL.
 */
export class Db {
  readonly raw: DatabaseSyncType;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.raw = new DatabaseSync(path);
    this.raw.exec('PRAGMA journal_mode = WAL;');
    this.raw.exec('PRAGMA foreign_keys = ON;');
    this.migrate();
  }

  private migrate(): void {
    this.raw.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id            TEXT PRIMARY KEY,
        state         TEXT NOT NULL,
        queue         TEXT NOT NULL DEFAULT 'default',
        priority      INTEGER NOT NULL DEFAULT 0,
        parent_ticket TEXT,
        claim_agent   TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        data          TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
      CREATE INDEX IF NOT EXISTS idx_tickets_queue ON tickets(queue);

      CREATE TABLE IF NOT EXISTS events (
        seq       INTEGER PRIMARY KEY AUTOINCREMENT,
        id        TEXT NOT NULL,
        ticket_id TEXT NOT NULL,
        type      TEXT NOT NULL,
        actor     TEXT NOT NULL,
        at        TEXT NOT NULL,
        payload   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_ticket ON events(ticket_id, seq);
    `);
  }

  close(): void {
    this.raw.close();
  }

  // --- tickets ---

  upsertTicket(t: Ticket): void {
    this.raw
      .prepare(
        `INSERT INTO tickets (id, state, queue, priority, parent_ticket, claim_agent, created_at, updated_at, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           state = excluded.state,
           queue = excluded.queue,
           priority = excluded.priority,
           parent_ticket = excluded.parent_ticket,
           claim_agent = excluded.claim_agent,
           updated_at = excluded.updated_at,
           data = excluded.data`,
      )
      .run(
        t.id,
        t.state,
        t.queue,
        t.priority,
        t.parentTicket,
        t.claim?.agentId ?? null,
        t.createdAt,
        t.updatedAt,
        JSON.stringify(t),
      );
  }

  getTicket(id: string): Ticket | null {
    const row = this.raw.prepare('SELECT data FROM tickets WHERE id = ?').get(id) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as Ticket) : null;
  }

  allTickets(): Ticket[] {
    const rows = this.raw
      .prepare('SELECT data FROM tickets ORDER BY created_at ASC')
      .all() as Array<{ data: string }>;
    return rows.map((r) => JSON.parse(r.data) as Ticket);
  }

  // --- events ---

  appendEvent(e: AuditEvent): void {
    this.raw
      .prepare('INSERT INTO events (id, ticket_id, type, actor, at, payload) VALUES (?, ?, ?, ?, ?, ?)')
      .run(e.id, e.ticketId, e.type, e.actor, e.at, JSON.stringify(e.payload));
  }

  eventsFor(ticketId: string): AuditEvent[] {
    const rows = this.raw
      .prepare('SELECT id, ticket_id, type, actor, at, payload FROM events WHERE ticket_id = ? ORDER BY seq ASC')
      .all(ticketId) as Array<Record<string, string>>;
    return rows.map(this.rowToEvent);
  }

  allEvents(limit = 500): AuditEvent[] {
    const rows = this.raw
      .prepare('SELECT id, ticket_id, type, actor, at, payload FROM events ORDER BY seq DESC LIMIT ?')
      .all(limit) as Array<Record<string, string>>;
    return rows.map(this.rowToEvent).reverse();
  }

  private rowToEvent(r: Record<string, string>): AuditEvent {
    return {
      id: r.id!,
      ticketId: r.ticket_id!,
      type: r.type as AuditEvent['type'],
      actor: r.actor!,
      at: r.at!,
      payload: JSON.parse(r.payload!) as Record<string, unknown>,
    };
  }

  /** Run `fn` inside an IMMEDIATE transaction so claim races resolve atomically. */
  transaction<T>(fn: () => T): T {
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.raw.exec('COMMIT');
      return result;
    } catch (err) {
      this.raw.exec('ROLLBACK');
      throw err;
    }
  }
}
