import { describe, expect, it } from 'vitest';
import { StateMachine } from '../src/state-machine.js';
import type { Ticket } from '../src/types.js';

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    state: 'agent-working',
    spec: {
      objective: 'x',
      background: '',
      inputSources: [],
      artifacts: [],
      requiredCapability: ['code'],
      constraints: [],
      risks: [],
      definitionOfDone: ['done'],
      acceptanceTests: ['test'],
    },
    queue: 'default',
    priority: 0,
    claim: null,
    blockerQuestions: [],
    childTickets: [],
    parentTicket: null,
    receipt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const sm = new StateMachine();

describe('StateMachine', () => {
  it('allows validate only from agent-instructions', () => {
    expect(sm.can(ticket({ state: 'agent-instructions' }), 'validate').ok).toBe(true);
    expect(sm.can(ticket({ state: 'agent-working' }), 'validate').ok).toBe(false);
  });

  it('blocks completing without a receipt', () => {
    expect(sm.can(ticket({ receipt: null }), 'complete').ok).toBe(false);
    expect(
      sm.can(ticket({ receipt: { summary: 's', filesChanged: [], commandsRun: [], testsRun: [], outputsCreated: [], skipped: [], assumptions: [], risksRemaining: [], followUpTickets: [], artifacts: [], generatedBy: 'a', generatedAt: 'x' } }), 'complete').ok,
    ).toBe(true);
  });

  it('blocks entering needs-input without an open blocker question', () => {
    expect(sm.can(ticket({ blockerQuestions: [] }), 'raise-blocker').ok).toBe(false);
    expect(
      sm.can(
        ticket({
          blockerQuestions: [
            { id: 'q1', question: 'q', missingContext: 'm', askedBy: 'a', askedAt: 'x' },
          ],
        }),
        'raise-blocker',
      ).ok,
    ).toBe(true);
  });

  it('lists available triggers for the current state', () => {
    const avail = sm.available(ticket({ state: 'agent-to-do' }));
    expect(avail).toEqual(['claim']);
  });
});
