import type { Ticket } from './types.js';
import type { DelegationRequest } from './runners/agent-runner.js';
import type { AuditLogger } from './audit.js';

export interface DelegationOutcome {
  children: Ticket[];
  /** True if any request asked the parent to wait for its child. */
  parentWaits: boolean;
}

/** How the delegation engine asks the engine to mint a validated child ticket. */
export type ChildTicketFactory = (
  req: DelegationRequest,
  parent: Ticket,
) => Ticket;

/**
 * DelegationEngine — turns an agent's delegation requests into real child
 * tickets, wires parent<->child links, and reports whether the parent should
 * pause (needs-input) or keep working while children run.
 *
 * Delegation is itself audited: a `child.created` event is written against the
 * parent for every spawned ticket, so the handoff is never invisible.
 */
export interface DelegationEngine {
  delegate(
    parent: Ticket,
    requests: DelegationRequest[],
    actorAgentId: string,
  ): DelegationOutcome;
}

export class DefaultDelegationEngine implements DelegationEngine {
  constructor(
    private readonly createChild: ChildTicketFactory,
    private readonly audit: AuditLogger,
  ) {}

  delegate(parent: Ticket, requests: DelegationRequest[], actorAgentId: string): DelegationOutcome {
    const children: Ticket[] = [];
    let parentWaits = false;

    for (const req of requests) {
      const child = this.createChild(req, parent);
      parent.childTickets.push(child.id);
      if (req.blockParent) parentWaits = true;

      this.audit.record(parent.id, 'child.created', actorAgentId, {
        childId: child.id,
        objective: child.spec.objective,
        blockParent: req.blockParent ?? false,
        note: req.note,
      });
    }

    return { children, parentWaits };
  }
}
