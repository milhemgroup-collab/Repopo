import { describe, expect, it } from 'vitest';
import { Db } from '../src/db.js';
import { LocalQueueAdapter } from '../src/adapters/local-queue.js';
import { SqliteAuditLogger } from '../src/audit.js';
import { Engine } from '../src/engine.js';
import { fixedClock } from '../src/util.js';
import { validSpec } from './helpers.js';

function makeEngine(dbPath: string, clock = fixedClock('2026-01-01T00:00:00.000Z')) {
  const db = new Db(dbPath);
  const queue = new LocalQueueAdapter(db, clock);
  const audit = new SqliteAuditLogger(db, clock);
  return { engine: new Engine({ queue, audit, clock, leaseMs: 1000 }), clock, db };
}

describe('atomic claim', () => {
  it('lets only one claimant win a race for the same ticket', () => {
    const { engine, queue } = (() => {
      const db = new Db(':memory:');
      const clock = fixedClock('2026-01-01T00:00:00.000Z');
      const q = new LocalQueueAdapter(db, clock);
      const a = new SqliteAuditLogger(db, clock);
      return { engine: new Engine({ queue: q, audit: a, clock }), queue: q };
    })();
    const { ticket } = engine.submit(validSpec());

    const first = queue.claim(ticket.id, { agentId: 'a1' });
    const second = queue.claim(ticket.id, { agentId: 'a2' });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('already-claimed');
  });

  it('rejects claiming a ticket that is not agent-to-do', () => {
    const db = new Db(':memory:');
    const clock = fixedClock('2026-01-01T00:00:00.000Z');
    const queue = new LocalQueueAdapter(db, clock);
    const audit = new SqliteAuditLogger(db, clock);
    const engine = new Engine({ queue, audit, clock });
    const { ticket } = engine.submit({ objective: 'incomplete' }); // stays agent-instructions
    const res = queue.claim(ticket.id, { agentId: 'a1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('wrong-state');
  });
});

describe('claim lease expiry', () => {
  it('allows a stale claim to be stolen after the lease expires', () => {
    const db = new Db(':memory:');
    const clock = fixedClock('2026-01-01T00:00:00.000Z');
    const queue = new LocalQueueAdapter(db, clock);
    const audit = new SqliteAuditLogger(db, clock);
    const engine = new Engine({ queue, audit, clock, leaseMs: 1000 });
    const { ticket } = engine.submit(validSpec());

    const first = queue.claim(ticket.id, { agentId: 'slow', leaseMs: 1000 });
    expect(first.ok).toBe(true);

    // Before expiry the ticket is not available.
    expect(queue.nextAvailable()).toBeNull();

    clock.advance(1001);
    // After expiry it reappears as available and can be re-claimed.
    expect(queue.nextAvailable()?.id).toBe(ticket.id);
    const stolen = queue.claim(ticket.id, { agentId: 'fast', leaseMs: 1000 });
    expect(stolen.ok).toBe(true);
    if (stolen.ok) expect(stolen.ticket.claim?.agentId).toBe('fast');
  });
});

describe('durability', () => {
  it('persists tickets and events across engine instances', () => {
    const path = `.open-engine/test-${process.pid}-${Math.floor(performance.now())}.db`;
    const { engine } = makeEngine(path);
    const { ticket } = engine.submit(validSpec());
    engine.close();

    const { engine: reopened } = makeEngine(path);
    const loaded = reopened.getTicket(ticket.id);
    expect(loaded?.spec.objective).toBe(validSpec().objective);
    expect(reopened.history(ticket.id).length).toBeGreaterThan(0);
    reopened.close();
  });
});
