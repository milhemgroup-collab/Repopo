import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Engine } from '../src/engine.js';
import { MockAgentRunner } from '../src/runners/mock-runner.js';
import { validSpec } from './helpers.js';

let engine: Engine;
let runner: MockAgentRunner;

beforeEach(() => {
  engine = new Engine({ dbPath: ':memory:' });
  runner = new MockAgentRunner({ id: 'mock', capabilities: ['code', 'research', 'general'] });
  engine.registerRunner(runner);
});

afterEach(() => engine.close());

describe('submission + validation', () => {
  it('promotes a valid spec to agent-to-do', () => {
    const { ticket, validation } = engine.submit(validSpec());
    expect(validation.valid).toBe(true);
    expect(ticket.state).toBe('agent-to-do');
  });

  it('holds an invalid spec in agent-instructions', () => {
    const { ticket, validation } = engine.submit({ objective: 'do stuff' });
    expect(validation.valid).toBe(false);
    expect(ticket.state).toBe('agent-instructions');
  });
});

describe('happy path', () => {
  it('runs a ticket to agent-done with a work receipt', async () => {
    const { ticket } = engine.submit(validSpec());
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('done');
    const done = engine.getTicket(ticket.id)!;
    expect(done.state).toBe('agent-done');
    expect(done.receipt).not.toBeNull();
    expect(done.receipt!.summary).toContain(ticket.spec.objective);
    expect(done.claim).toBeNull(); // claim released
  });

  it('records a full audit trail', async () => {
    const { ticket } = engine.submit(validSpec());
    await engine.runTicket(ticket.id);
    const types = engine.history(ticket.id).map((e) => e.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'ticket.created',
        'ticket.validated',
        'transition',
        'ticket.claimed',
        'progress.logged',
        'agent.heartbeat',
        'receipt.generated',
        'ticket.completed',
      ]),
    );
  });
});

describe('no silent ambiguity', () => {
  it('moves to needs-input with a blocker instead of guessing', async () => {
    const { ticket } = engine.submit(validSpec());
    runner.program(ticket.id, { kind: 'blocked', questions: ['Which auth scheme?'] });
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('blocked');
    const blocked = engine.getTicket(ticket.id)!;
    expect(blocked.state).toBe('needs-input');
    expect(blocked.blockerQuestions).toHaveLength(1);
    expect(blocked.claim).toBeNull();
  });

  it('returns to the queue once the blocker is answered, then completes', async () => {
    const { ticket } = engine.submit(validSpec());
    runner.program(ticket.id, { kind: 'blocked', questions: ['Which auth scheme?'] });
    await engine.runTicket(ticket.id);
    const blocked = engine.getTicket(ticket.id)!;
    const q = blocked.blockerQuestions[0]!;

    const returned = engine.provideInput(ticket.id, [{ questionId: q.id, answer: 'OAuth2' }]);
    expect(returned.state).toBe('agent-to-do');

    runner.program(ticket.id, { kind: 'done' });
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('done');
    expect(engine.getTicket(ticket.id)!.state).toBe('agent-done');
  });
});

describe('failure path', () => {
  it('moves to agent-failed and records the error', async () => {
    const { ticket } = engine.submit(validSpec());
    runner.program(ticket.id, { kind: 'fail', error: 'compile error' });
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('failed');
    expect(engine.getTicket(ticket.id)!.state).toBe('agent-failed');
    const failEvt = engine.history(ticket.id).find((e) => e.type === 'ticket.failed');
    expect(failEvt?.payload.error).toBe('compile error');
  });

  it('treats a thrown runner as a failure, not a crash', async () => {
    const { ticket } = engine.submit(validSpec());
    const throwing = new MockAgentRunner({ id: 'boom', capabilities: ['code'] });
    throwing.run = async () => {
      throw new Error('kaboom');
    };
    const e2 = new Engine({ dbPath: ':memory:' });
    e2.registerRunner(throwing);
    const { ticket: t2 } = e2.submit(validSpec());
    const res = await e2.runTicket(t2.id);
    expect(res.status).toBe('failed');
    expect(e2.getTicket(t2.id)!.state).toBe('agent-failed');
    e2.close();
  });
});

describe('receipts are mandatory', () => {
  it('refuses to complete on an empty receipt and fails instead', async () => {
    const { ticket } = engine.submit(validSpec());
    // Runner claims "done" but returns an empty receipt.
    runner.run = async () => ({ outcome: 'done', receipt: { summary: '' } });
    const res = await engine.runTicket(ticket.id);
    expect(res.status).toBe('failed');
    expect(engine.getTicket(ticket.id)!.state).toBe('agent-failed');
  });
});

describe('delegation', () => {
  it('creates a child, parks the parent, and resumes it when the child finishes', async () => {
    const { ticket: parent } = engine.submit(validSpec({ objective: 'Ship the feature' }));
    runner.program(parent.id, {
      kind: 'delegate',
      childObjective: 'Write the migration',
      childCapability: ['code'],
      blockParent: true,
    });

    const res = await engine.runTicket(parent.id);
    expect(res.status).toBe('delegated');
    if (res.status !== 'delegated') return;

    const parentAfter = engine.getTicket(parent.id)!;
    expect(parentAfter.state).toBe('needs-input');
    expect(parentAfter.childTickets).toHaveLength(1);

    const childId = parentAfter.childTickets[0]!;
    const child = engine.getTicket(childId)!;
    expect(child.parentTicket).toBe(parent.id);
    expect(child.state).toBe('agent-to-do');

    // Finish the child; parent should auto-resume to the queue.
    runner.program(childId, { kind: 'done' });
    await engine.runTicket(childId);
    expect(engine.getTicket(childId)!.state).toBe('agent-done');
    expect(engine.getTicket(parent.id)!.state).toBe('agent-to-do');

    const childCreated = engine.history(parent.id).find((e) => e.type === 'child.created');
    expect(childCreated?.payload.childId).toBe(childId);
  });

  it('re-queues the parent immediately for non-blocking delegation', async () => {
    const { ticket: parent } = engine.submit(validSpec());
    runner.program(parent.id, {
      kind: 'delegate',
      childObjective: 'Background research',
      childCapability: ['research'],
      blockParent: false,
    });
    const res = await engine.runTicket(parent.id);
    expect(res.status).toBe('delegated');
    expect(engine.getTicket(parent.id)!.state).toBe('agent-to-do');
  });
});

describe('processNext', () => {
  it('picks the highest-priority available ticket', async () => {
    engine.submit(validSpec({ objective: 'low' }), { priority: 1 });
    const hi = engine.submit(validSpec({ objective: 'high' }), { priority: 10 });
    const res = await engine.processNext();
    expect(res.status).toBe('done');
    if (res.status === 'done') expect(res.ticket.id).toBe(hi.ticket.id);
  });

  it('is idle when nothing is available', async () => {
    const res = await engine.processNext();
    expect(res.status).toBe('idle');
  });
});
