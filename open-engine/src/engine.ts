import type {
  BlockerQuestion,
  ClaimLock,
  TaskSpec,
  Ticket,
  TicketFilter,
} from './types.js';
import { Db } from './db.js';
import { SqliteAuditLogger, type AuditLogger } from './audit.js';
import { DefaultTaskSpecValidator, type TaskSpecValidator, type ValidationResult } from './validator.js';
import { StateMachine, type Trigger } from './state-machine.js';
import { DefaultReceiptGenerator, type ReceiptGenerator } from './receipt.js';
import {
  DefaultDelegationEngine,
  type DelegationEngine,
} from './delegation.js';
import { LocalQueueAdapter } from './adapters/local-queue.js';
import type { QueueAdapter } from './adapters/queue-adapter.js';
import type { AgentRunner, DelegationRequest, RunContext } from './runners/agent-runner.js';
import { type Clock, newId, systemClock, toIso } from './util.js';

export interface EngineOptions {
  dbPath?: string;
  queue?: QueueAdapter;
  validator?: TaskSpecValidator;
  receiptGenerator?: ReceiptGenerator;
  audit?: AuditLogger;
  clock?: Clock;
  /** Claim lease in ms handed to the queue on each claim. */
  leaseMs?: number;
}

export interface SubmitResult {
  ticket: Ticket;
  validation: ValidationResult;
}

/** What happened when the engine ran a single ticket. */
export type ProcessResult =
  | { status: 'idle' } // nothing available to run
  | { status: 'no-runner'; ticket: Ticket }
  | { status: 'claim-failed'; ticketId: string; reason: string }
  | { status: 'done'; ticket: Ticket }
  | { status: 'blocked'; ticket: Ticket }
  | { status: 'failed'; ticket: Ticket; error: string }
  | { status: 'delegated'; ticket: Ticket; children: Ticket[]; parentWaits: boolean };

/**
 * Engine — the orchestration core. It owns the lifecycle; every collaborator
 * (queue, validator, state machine, receipt generator, delegation engine, audit
 * logger) is an injected, swappable interface.
 *
 * The engine never lets a ticket skip its guards: a ticket only leaves
 * `agent-instructions` after validation, only reaches `agent-done` with a
 * receipt, and only enters `needs-input` with an open question — and every one
 * of those moves is written to the audit log.
 */
export class Engine {
  readonly queue: QueueAdapter;
  readonly audit: AuditLogger;
  readonly validator: TaskSpecValidator;
  readonly sm = new StateMachine();
  readonly receipts: ReceiptGenerator;
  readonly delegation: DelegationEngine;
  private readonly clock: Clock;
  private readonly leaseMs?: number;
  private readonly db?: Db;
  private readonly runners = new Map<string, AgentRunner>();

  constructor(opts: EngineOptions = {}) {
    this.clock = opts.clock ?? systemClock;
    this.leaseMs = opts.leaseMs;
    if (opts.queue && opts.audit) {
      this.queue = opts.queue;
      this.audit = opts.audit;
    } else {
      this.db = new Db(opts.dbPath ?? ':memory:');
      this.queue = opts.queue ?? new LocalQueueAdapter(this.db, this.clock);
      this.audit = opts.audit ?? new SqliteAuditLogger(this.db, this.clock);
    }
    this.validator = opts.validator ?? new DefaultTaskSpecValidator();
    this.receipts = opts.receiptGenerator ?? new DefaultReceiptGenerator(this.clock);
    this.delegation = new DefaultDelegationEngine(
      (req, parent) => this.createChildTicket(req, parent),
      this.audit,
    );
  }

  close(): void {
    this.db?.close();
  }

  registerRunner(runner: AgentRunner): this {
    this.runners.set(runner.id, runner);
    return this;
  }

  getTicket(id: string): Ticket | null {
    return this.queue.get(id);
  }

  list(filter?: TicketFilter): Ticket[] {
    return this.queue.list(filter);
  }

  history(ticketId: string) {
    return this.audit.history(ticketId);
  }

  // --- lifecycle: create + validate ---

  private blankTicket(spec: TaskSpec, queue: string, priority: number, parent: string | null): Ticket {
    const nowIso = toIso(this.clock.now());
    return {
      id: newId('tkt'),
      state: 'agent-instructions',
      spec,
      queue,
      priority,
      claim: null,
      blockerQuestions: [],
      childTickets: [],
      parentTicket: parent,
      receipt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  /**
   * Submit a statement of work. Creates the ticket in `agent-instructions`,
   * validates it, and promotes it to `agent-to-do` iff the spec is valid.
   * An invalid spec stays in `agent-instructions` with its issues recorded.
   */
  submit(
    partialSpec: Partial<TaskSpec>,
    opts: { queue?: string; priority?: number } = {},
  ): SubmitResult {
    const spec = this.validator.normalize(partialSpec);
    const ticket = this.blankTicket(spec, opts.queue ?? 'default', opts.priority ?? 0, null);
    this.queue.put(ticket);
    this.audit.record(ticket.id, 'ticket.created', 'human', {
      objective: spec.objective,
      queue: ticket.queue,
    });

    const validation = this.validator.validate(spec);
    if (validation.valid) {
      this.fire(ticket, 'validate', 'system');
      this.audit.record(ticket.id, 'ticket.validated', 'system', { valid: true });
    } else {
      this.audit.record(ticket.id, 'ticket.validated', 'system', {
        valid: false,
        issues: validation.issues,
      });
    }
    return { ticket: this.queue.get(ticket.id)!, validation };
  }

  private createChildTicket(req: DelegationRequest, parent: Ticket): Ticket {
    const spec = this.validator.normalize(req.spec);
    const ticket = this.blankTicket(
      spec,
      req.queue ?? parent.queue,
      req.priority ?? parent.priority,
      parent.id,
    );
    this.queue.put(ticket);
    this.audit.record(ticket.id, 'ticket.created', 'system', {
      objective: spec.objective,
      parent: parent.id,
    });
    const validation = this.validator.validate(spec);
    if (validation.valid) {
      this.fire(ticket, 'validate', 'system');
      this.audit.record(ticket.id, 'ticket.validated', 'system', { valid: true });
    }
    return this.queue.get(ticket.id)!;
  }

  // --- lifecycle: transition helper ---

  /** Apply a trigger, enforcing the state machine and writing a transition event. */
  private fire(ticket: Ticket, trigger: Trigger, actor: string): Ticket {
    const check = this.sm.can(ticket, trigger);
    if (!check.ok) {
      throw new Error(`illegal transition (${trigger}) on ${ticket.id}: ${check.reason}`);
    }
    const from = ticket.state;
    ticket.state = this.sm.rule(trigger).to;
    this.queue.update(ticket);
    this.audit.record(ticket.id, 'transition', actor, { trigger, from, to: ticket.state });
    return ticket;
  }

  // --- lifecycle: needs-input round trip ---

  /**
   * Answer one or more blocker questions on a `needs-input` ticket and return it
   * to `agent-to-do`. This is the "no silent ambiguity" round trip: the ticket
   * only resumes once the missing context has been supplied.
   */
  provideInput(
    ticketId: string,
    answers: Array<{ questionId: string; answer: string; by?: string }>,
  ): Ticket {
    const ticket = this.requireTicket(ticketId);
    const by = answers[0]?.by ?? 'human';
    for (const a of answers) {
      const q = ticket.blockerQuestions.find((x) => x.id === a.questionId);
      if (!q) throw new Error(`no blocker question ${a.questionId} on ${ticketId}`);
      q.answer = a.answer;
      q.answeredBy = a.by ?? 'human';
      q.answeredAt = toIso(this.clock.now());
    }
    this.queue.update(ticket);
    this.audit.record(ticketId, 'input.received', by, {
      answered: answers.map((a) => a.questionId),
    });

    if (ticket.blockerQuestions.every((q) => q.answer)) {
      this.fire(ticket, 'return-to-queue', by);
      this.audit.record(ticketId, 'ticket.returned', by, {});
    }
    return this.queue.get(ticketId)!;
  }

  // --- lifecycle: execution ---

  private pickRunner(ticket: Ticket): AgentRunner | null {
    const required = ticket.spec.requiredCapability;
    for (const runner of this.runners.values()) {
      const caps = new Set(runner.capabilities);
      if (required.every((c) => caps.has(c))) return runner;
    }
    return null;
  }

  private buildContext(ticketId: string, agentId: string, token: string): RunContext {
    return {
      logProgress: (message: string) => {
        this.audit.record(ticketId, 'progress.logged', agentId, { message });
      },
      heartbeat: () => {
        const t = this.queue.get(ticketId);
        if (!t || !t.claim || t.claim.token !== token) return;
        const now = this.clock.now();
        const claim: ClaimLock = {
          ...t.claim,
          lastHeartbeatAt: toIso(now),
          expiresAt: toIso(new Date(now.getTime() + (this.leaseMs ?? 5 * 60 * 1000))),
        };
        t.claim = claim;
        this.queue.update(t);
        this.audit.record(ticketId, 'agent.heartbeat', agentId, {});
      },
    };
  }

  /** Claim and run the single highest-priority ticket a runner can handle. */
  async processNext(filter?: TicketFilter): Promise<ProcessResult> {
    const ticket = this.queue.nextAvailable(filter);
    if (!ticket) return { status: 'idle' };
    return this.runTicket(ticket.id);
  }

  /**
   * Run one ticket end-to-end: pick a capable runner, claim atomically, execute,
   * then translate the runner's outcome into guarded state transitions.
   */
  async runTicket(ticketId: string, preferredAgentId?: string): Promise<ProcessResult> {
    const ticket = this.requireTicket(ticketId);
    const runner = preferredAgentId
      ? this.runners.get(preferredAgentId) ?? null
      : this.pickRunner(ticket);
    if (!runner) return { status: 'no-runner', ticket };

    const claim = this.queue.claim(ticketId, { agentId: runner.id, leaseMs: this.leaseMs });
    if (!claim.ok) return { status: 'claim-failed', ticketId, reason: claim.reason };

    this.audit.record(ticketId, 'ticket.claimed', runner.id, { token: claim.token });
    const ctx = this.buildContext(ticketId, runner.id, claim.token);

    let result;
    try {
      result = await runner.run(claim.ticket, ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.applyFailure(ticketId, runner.id, `runner threw: ${message}`);
    }

    switch (result.outcome) {
      case 'done':
        return this.applyDone(ticketId, runner.id, result.receipt);
      case 'blocked':
        return this.applyBlocked(ticketId, runner.id, result.blockers);
      case 'failed':
        return this.applyFailure(ticketId, runner.id, result.error);
      case 'delegated':
        return this.applyDelegated(ticketId, runner.id, result.delegations);
    }
  }

  private applyDone(ticketId: string, agentId: string, input: Parameters<ReceiptGenerator['generate']>[1]): ProcessResult {
    const ticket = this.requireTicket(ticketId);
    const receipt = this.receipts.generate(agentId, input);
    const check = this.receipts.validate(receipt);
    if (!check.valid) {
      // A missing/empty receipt must not close a ticket — treat as failure.
      return this.applyFailure(ticketId, agentId, `invalid work receipt: ${check.issues.join('; ')}`);
    }
    ticket.receipt = receipt;
    this.queue.update(ticket);
    this.audit.record(ticketId, 'receipt.generated', agentId, { summary: receipt.summary });
    this.fire(ticket, 'complete', agentId);
    this.audit.record(ticketId, 'ticket.completed', agentId, {});
    this.queue.release(ticketId, this.claimToken(ticket));
    this.maybeResumeParent(ticket);
    return { status: 'done', ticket: this.queue.get(ticketId)! };
  }

  private applyBlocked(ticketId: string, agentId: string, blockers: Array<{ question: string; missingContext: string }>): ProcessResult {
    const ticket = this.requireTicket(ticketId);
    const now = toIso(this.clock.now());
    const created: BlockerQuestion[] = blockers.map((b) => ({
      id: newId('q'),
      question: b.question,
      missingContext: b.missingContext,
      askedBy: agentId,
      askedAt: now,
    }));
    ticket.blockerQuestions.push(...created);
    const token = this.claimToken(ticket);
    this.queue.update(ticket);
    this.audit.record(ticketId, 'blocker.raised', agentId, {
      questions: created.map((q) => ({ id: q.id, question: q.question })),
    });
    this.fire(ticket, 'raise-blocker', agentId);
    this.queue.release(ticketId, token);
    return { status: 'blocked', ticket: this.queue.get(ticketId)! };
  }

  private applyFailure(ticketId: string, agentId: string, error: string): ProcessResult {
    const ticket = this.requireTicket(ticketId);
    const token = this.claimToken(ticket);
    if (ticket.state === 'agent-working') {
      this.fire(ticket, 'fail', agentId);
    }
    this.audit.record(ticketId, 'ticket.failed', agentId, { error });
    if (token) this.queue.release(ticketId, token);
    return { status: 'failed', ticket: this.queue.get(ticketId)!, error };
  }

  private applyDelegated(ticketId: string, agentId: string, requests: DelegationRequest[]): ProcessResult {
    const ticket = this.requireTicket(ticketId);
    const outcome = this.delegation.delegate(ticket, requests, agentId);
    const token = this.claimToken(ticket);

    if (outcome.parentWaits) {
      // Parent pauses on an auto-generated delegation-wait blocker.
      const waitIds = requests
        .map((r, i) => (r.blockParent ? ticket.childTickets[ticket.childTickets.length - requests.length + i] : null))
        .filter((x): x is string => !!x);
      const q: BlockerQuestion = {
        id: newId('q'),
        question: `Waiting on delegated child ticket(s): ${waitIds.join(', ')}`,
        missingContext: 'Parent cannot proceed until the delegated children finish.',
        askedBy: agentId,
        askedAt: toIso(this.clock.now()),
        waitsOnChildren: waitIds,
      };
      ticket.blockerQuestions.push(q);
      this.queue.update(ticket);
      this.audit.record(ticketId, 'blocker.raised', agentId, {
        questions: [{ id: q.id, question: q.question }],
        delegationWait: true,
      });
      this.fire(ticket, 'raise-blocker', agentId);
    } else {
      // Non-blocking: re-queue the parent to continue after spawning children.
      this.queue.update(ticket);
      this.fire(ticket, 'delegate-continue', agentId);
    }
    if (token) this.queue.release(ticketId, token);
    return {
      status: 'delegated',
      ticket: this.queue.get(ticketId)!,
      children: outcome.children,
      parentWaits: outcome.parentWaits,
    };
  }

  /**
   * When a child reaches a terminal state, resolve any parent delegation-wait
   * whose children are all finished, and return the parent to the queue.
   */
  private maybeResumeParent(child: Ticket): void {
    if (!child.parentTicket) return;
    const parent = this.queue.get(child.parentTicket);
    if (!parent || parent.state !== 'needs-input') return;

    let changed = false;
    for (const q of parent.blockerQuestions) {
      if (!q.waitsOnChildren || q.answer) continue;
      const allDone = q.waitsOnChildren.every((id) => {
        const c = this.queue.get(id);
        return c && (c.state === 'agent-done' || c.state === 'agent-failed');
      });
      if (allDone) {
        q.answer = `resolved: children ${q.waitsOnChildren.join(', ')} finished`;
        q.answeredBy = 'system';
        q.answeredAt = toIso(this.clock.now());
        changed = true;
      }
    }
    if (!changed) return;
    this.queue.update(parent);
    this.audit.record(parent.id, 'input.received', 'system', { resumedFromChild: child.id });
    if (parent.blockerQuestions.every((q) => q.answer)) {
      this.fire(parent, 'return-to-queue', 'system');
      this.audit.record(parent.id, 'ticket.returned', 'system', {});
    }
  }

  // --- helpers ---

  private requireTicket(id: string): Ticket {
    const t = this.queue.get(id);
    if (!t) throw new Error(`ticket ${id} not found`);
    return t;
  }

  private claimToken(ticket: Ticket): string {
    return ticket.claim?.token ?? '';
  }
}
