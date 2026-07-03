import type { Ticket } from '../types.js';
import type { AgentRunner, RunContext, RunResult } from './agent-runner.js';

/**
 * Scripted behaviours the mock runner can be told to perform. This is how the
 * MVP demonstrates every lifecycle path (done / blocked / delegated / failed)
 * without a real model, and how the test suite drives the engine.
 */
export type MockBehaviour =
  | { kind: 'done' }
  | { kind: 'blocked'; questions: string[] }
  | { kind: 'fail'; error: string }
  | {
      kind: 'delegate';
      childObjective: string;
      childCapability: string[];
      blockParent?: boolean;
    };

/**
 * MockAgentRunner — a deterministic runner used for demos and tests.
 *
 * By default it "does the work": logs a couple of progress lines, heartbeats,
 * and returns a valid receipt. A per-ticket or default behaviour override lets
 * a caller force any other outcome.
 */
export class MockAgentRunner implements AgentRunner {
  readonly id: string;
  readonly capabilities: string[];
  private readonly behaviours = new Map<string, MockBehaviour>();
  private defaultBehaviour: MockBehaviour = { kind: 'done' };

  constructor(opts: { id: string; capabilities: string[] }) {
    this.id = opts.id;
    this.capabilities = opts.capabilities;
  }

  /** Force a behaviour for a specific ticket id. */
  program(ticketId: string, behaviour: MockBehaviour): this {
    this.behaviours.set(ticketId, behaviour);
    return this;
  }

  /** Change the fallback behaviour for un-programmed tickets. */
  setDefault(behaviour: MockBehaviour): this {
    this.defaultBehaviour = behaviour;
    return this;
  }

  async run(ticket: Ticket, ctx: RunContext): Promise<RunResult> {
    const behaviour = this.behaviours.get(ticket.id) ?? this.defaultBehaviour;
    ctx.logProgress(`agent ${this.id} started on "${ticket.spec.objective}"`);
    ctx.heartbeat();

    switch (behaviour.kind) {
      case 'done':
        ctx.logProgress('verifying acceptance tests');
        return {
          outcome: 'done',
          progress: ['work complete'],
          receipt: {
            summary: `Completed: ${ticket.spec.objective}`,
            filesChanged: ['(mock) no real files changed'],
            commandsRun: ['(mock) ran acceptance checks'],
            testsRun: ticket.spec.acceptanceTests,
            outputsCreated: ['(mock) demonstration output'],
            assumptions: ['ran under MockAgentRunner; no real side effects'],
          },
        };
      case 'blocked':
        return {
          outcome: 'blocked',
          blockers: behaviour.questions.map((q) => ({
            question: q,
            missingContext: 'Required to satisfy the Definition of Done; not present in the ticket spec.',
          })),
        };
      case 'fail':
        return { outcome: 'failed', error: behaviour.error };
      case 'delegate':
        return {
          outcome: 'delegated',
          delegations: [
            {
              spec: {
                objective: behaviour.childObjective,
                requiredCapability: behaviour.childCapability,
                definitionOfDone: [`Deliver: ${behaviour.childObjective}`],
                acceptanceTests: ['child work reviewed by parent agent'],
                background: `Delegated from parent ticket ${ticket.id}.`,
              },
              blockParent: behaviour.blockParent,
              note: `Specialized sub-task delegated by ${this.id}`,
            },
          ],
        };
    }
  }
}
