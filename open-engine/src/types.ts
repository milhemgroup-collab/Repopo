/**
 * Open Engine — core domain types.
 *
 * Design principle: **the ticket is the state manager**. Chat messages are not
 * the source of truth; a structured work ticket is. Every field an agent needs
 * to continue the work lives here or is linked from here.
 */

/** The ticket lifecycle. Transitions are enforced by the {@link StateMachine}. */
export type TicketState =
  | 'agent-instructions' // draft: statement of work is being authored / not yet validated
  | 'agent-to-do' // validated and available to be claimed
  | 'agent-working' // claimed by an agent and executing
  | 'needs-input' // blocked; waiting on a human/parent to answer blocker questions
  | 'agent-done' // completed; a work receipt exists
  | 'agent-failed'; // terminal failure

export const TICKET_STATES: readonly TicketState[] = [
  'agent-instructions',
  'agent-to-do',
  'agent-working',
  'needs-input',
  'agent-done',
  'agent-failed',
];

export const TERMINAL_STATES: readonly TicketState[] = ['agent-done', 'agent-failed'];

/**
 * A structured Statement of Work. **Prompts are not tasks.** A valid task is a
 * structured statement with enough context for any capable agent to continue.
 */
export interface TaskSpec {
  /** One-sentence objective — what "done" produces. Required. */
  objective: string;
  /** Background an agent needs but could not infer from the objective alone. */
  background: string;
  /** Where to read inputs from (files, URLs, ticket ids, datasets). */
  inputSources: string[];
  /** Artifacts that already exist and are relevant (paths, links). */
  artifacts: string[];
  /** Capabilities an agent must have to claim this (e.g. "code", "research"). Required. */
  requiredCapability: string[];
  /** Hard constraints the agent must not violate. */
  constraints: string[];
  /** Known risks the agent should watch for. */
  risks: string[];
  /** Definition of Done — objective, checkable completion criteria. Required, non-empty. */
  definitionOfDone: string[];
  /** Acceptance tests that verify the DoD. Required, non-empty. */
  acceptanceTests: string[];
}

/** A claim lock. Only one agent may hold a ticket at a time. */
export interface ClaimLock {
  agentId: string;
  /** Opaque token the holder must present to release or complete the claim. */
  token: string;
  claimedAt: string;
  /** After this, the claim is considered stale and may be reclaimed. */
  expiresAt: string;
  lastHeartbeatAt: string;
}

/** A precise blocking question raised when the task lacks essential context. */
export interface BlockerQuestion {
  id: string;
  question: string;
  /** Exactly what information is missing and why it blocks progress. */
  missingContext: string;
  askedBy: string;
  askedAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  /** If set, this is a delegation-wait: resolved when these children finish. */
  waitsOnChildren?: string[];
}

/** A mandatory record of what an agent actually did before a ticket may close. */
export interface WorkReceipt {
  summary: string;
  filesChanged: string[];
  commandsRun: string[];
  testsRun: string[];
  outputsCreated: string[];
  skipped: string[];
  assumptions: string[];
  risksRemaining: string[];
  followUpTickets: string[];
  artifacts: string[];
  generatedBy: string;
  generatedAt: string;
}

export interface Ticket {
  id: string;
  state: TicketState;
  spec: TaskSpec;
  /** Optional named queue this ticket belongs to. */
  queue: string;
  /** Priority; higher is picked first among available tickets. */
  priority: number;
  claim: ClaimLock | null;
  blockerQuestions: BlockerQuestion[];
  /** Child (delegated / handoff) ticket ids created from this ticket. */
  childTickets: string[];
  /** Parent ticket id, if this was delegated from another ticket. */
  parentTicket: string | null;
  receipt: WorkReceipt | null;
  createdAt: string;
  updatedAt: string;
}

/** Canonical audit event types. Every state transition emits at least one. */
export type AuditEventType =
  | 'ticket.created'
  | 'ticket.validated'
  | 'ticket.claimed'
  | 'agent.heartbeat'
  | 'progress.logged'
  | 'blocker.raised'
  | 'input.received'
  | 'ticket.returned'
  | 'child.created'
  | 'receipt.generated'
  | 'ticket.completed'
  | 'ticket.failed'
  | 'claim.released'
  | 'transition';

export interface AuditEvent {
  id: string;
  ticketId: string;
  type: AuditEventType;
  /** Who caused the event (agent id, "human", or "system"). */
  actor: string;
  at: string;
  /** Arbitrary structured detail; JSON-serialized in storage. */
  payload: Record<string, unknown>;
}

export interface TicketFilter {
  state?: TicketState;
  queue?: string;
  /** Only tickets whose required capabilities are all satisfied by these. */
  capabilities?: string[];
  parentTicket?: string | null;
}

/** Result of an atomic claim attempt. */
export type ClaimResult =
  | { ok: true; ticket: Ticket; token: string }
  | { ok: false; reason: 'not-found' | 'wrong-state' | 'already-claimed' };
