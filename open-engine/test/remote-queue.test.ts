import { describe, expect, it } from 'vitest';
import { Db } from '../src/db.js';
import { fixedClock } from '../src/util.js';
import { SqliteAuditLogger } from '../src/audit.js';
import { Engine } from '../src/engine.js';
import { JiraQueueAdapter, LinearQueueAdapter } from '../src/adapters/remote-queue.js';
import { MockAgentRunner } from '../src/runners/mock-runner.js';
import { validSpec } from './helpers.js';

describe('remote adapters (dry-run)', () => {
  it('runs the full lifecycle through Linear in dry-run and logs mapped columns', async () => {
    const logs: string[] = [];
    const clock = fixedClock('2026-01-01T00:00:00.000Z');
    const db = new Db(':memory:');
    const queue = new LinearQueueAdapter(db, clock, { log: (l) => logs.push(l) });
    const audit = new SqliteAuditLogger(db, clock);
    const engine = new Engine({ queue, audit, clock });
    engine.registerRunner(new MockAgentRunner({ id: 'mock', capabilities: ['code'] }));

    const { ticket } = engine.submit(validSpec());
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('done');

    // Dry-run defaults on (no apiKey) and outbound calls are logged with mapped columns.
    expect(logs.some((l) => l.includes('[linear:dry-run]'))).toBe(true);
    expect(logs.some((l) => l.includes('In Progress'))).toBe(true);
    expect(logs.some((l) => l.includes('Done'))).toBe(true);
    engine.close();
  });

  it('Jira maps engine states onto its workflow columns', () => {
    const db = new Db(':memory:');
    const clock = fixedClock('2026-01-01T00:00:00.000Z');
    const queue = new JiraQueueAdapter(db, clock, { log: () => {} });
    expect(queue.stateMapping['needs-input']).toBe('Blocked');
    expect(queue.stateMapping['agent-done']).toBe('Done');
    db.close();
  });
});
