import type { Ticket, TicketState } from './types.js';

/** A guarded, named transition trigger. */
export type Trigger =
  | 'validate' // agent-instructions -> agent-to-do
  | 'claim' // agent-to-do -> agent-working
  | 'raise-blocker' // agent-working -> needs-input
  | 'return-to-queue' // needs-input -> agent-to-do
  | 'complete' // agent-working -> agent-done
  | 'fail' // agent-working -> agent-failed
  | 'delegate-continue' // agent-working -> agent-to-do (re-queue after non-blocking delegation)
  | 'reopen'; // agent-failed -> agent-to-do (retry)

export interface TransitionCheck {
  ok: boolean;
  reason?: string;
}

interface TransitionRule {
  from: TicketState;
  to: TicketState;
  /** Optional guard evaluated against the ticket at transition time. */
  guard?: (t: Ticket) => TransitionCheck;
}

const ok: TransitionCheck = { ok: true };

/**
 * StateMachine — the single authority on which transitions are legal.
 *
 * Guards encode the non-negotiable invariants:
 *  - you cannot enter `needs-input` without a blocker question,
 *  - you cannot enter `agent-done` without a work receipt.
 * Claim locking is enforced by the queue adapter (it is a concurrency concern),
 * not here, so the same rules hold for single- and multi-process runs.
 */
export class StateMachine {
  private readonly rules: Record<Trigger, TransitionRule> = {
    validate: { from: 'agent-instructions', to: 'agent-to-do' },
    claim: { from: 'agent-to-do', to: 'agent-working' },
    'raise-blocker': {
      from: 'agent-working',
      to: 'needs-input',
      guard: (t) =>
        t.blockerQuestions.some((q) => !q.answer)
          ? ok
          : { ok: false, reason: 'cannot enter needs-input without at least one open blocker question' },
    },
    'return-to-queue': { from: 'needs-input', to: 'agent-to-do' },
    complete: {
      from: 'agent-working',
      to: 'agent-done',
      guard: (t) =>
        t.receipt
          ? ok
          : { ok: false, reason: 'cannot enter agent-done without a work receipt' },
    },
    fail: { from: 'agent-working', to: 'agent-failed' },
    'delegate-continue': { from: 'agent-working', to: 'agent-to-do' },
    reopen: { from: 'agent-failed', to: 'agent-to-do' },
  };

  rule(trigger: Trigger): TransitionRule {
    return this.rules[trigger];
  }

  /** Check whether `trigger` may fire against `ticket` in its current state. */
  can(ticket: Ticket, trigger: Trigger): TransitionCheck {
    const rule = this.rules[trigger];
    if (!rule) return { ok: false, reason: `unknown trigger ${trigger}` };
    if (ticket.state !== rule.from) {
      return { ok: false, reason: `trigger ${trigger} requires state ${rule.from}, ticket is ${ticket.state}` };
    }
    return rule.guard ? rule.guard(ticket) : ok;
  }

  /** The set of triggers currently legal for a ticket. */
  available(ticket: Ticket): Trigger[] {
    return (Object.keys(this.rules) as Trigger[]).filter((tr) => this.can(ticket, tr).ok);
  }
}
