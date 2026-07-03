import type { ClaimResult, Ticket, TicketFilter } from '../types.js';
import type { Clock } from '../util.js';
import type { Db } from '../db.js';
import { LocalQueueAdapter } from './local-queue.js';
import type { ClaimOptions, QueueAdapter } from './queue-adapter.js';

/** Maps Open Engine states onto a provider's workflow column names. */
export interface StateMapping {
  [engineState: string]: string;
}

export interface RemoteConfig {
  apiKey?: string;
  /** Project/board/team identifier in the provider. */
  project?: string;
  /**
   * When true (the default whenever no apiKey is present), no network calls are
   * made: operations run against the local store and outbound calls are logged.
   */
  dryRun?: boolean;
  /** Sink for logged outbound intents; defaults to console.error. */
  log?: (line: string) => void;
}

/**
 * RemoteQueueAdapter — base for provider integrations (Linear, Jira).
 *
 * External integrations are optional. Per the build contract we implement
 * dry-run and local-mock behaviour first: when there is no API key, the adapter
 * transparently uses a local SQLite queue and records the API calls it *would*
 * have made. Wiring a real key is then a matter of overriding the `pushRemote`
 * hook — the engine never has to change.
 */
export abstract class RemoteQueueAdapter implements QueueAdapter {
  abstract readonly name: string;
  abstract readonly stateMapping: StateMapping;
  protected readonly local: LocalQueueAdapter;
  protected readonly dryRun: boolean;
  private readonly log: (line: string) => void;

  constructor(db: Db, clock: Clock, protected readonly config: RemoteConfig = {}) {
    this.local = new LocalQueueAdapter(db, clock);
    this.dryRun = config.dryRun ?? !config.apiKey;
    this.log = config.log ?? ((line) => console.error(line));
  }

  /** Where a real integration would issue the provider API call. */
  protected pushRemote(op: string, ticket: Ticket): void {
    const column = this.stateMapping[ticket.state] ?? ticket.state;
    if (this.dryRun) {
      this.log(`[${this.name}:dry-run] ${op} ${ticket.id} -> column "${column}"`);
      return;
    }
    // A live subclass overrides this to call the provider's REST/GraphQL API.
    throw new Error(
      `${this.name} live mode not implemented in MVP; run with dryRun to use the local mock`,
    );
  }

  put(ticket: Ticket): Ticket {
    const t = this.local.put(ticket);
    this.pushRemote('create', t);
    return t;
  }

  update(ticket: Ticket): Ticket {
    const t = this.local.update(ticket);
    this.pushRemote('update', t);
    return t;
  }

  get(id: string): Ticket | null {
    return this.local.get(id);
  }

  list(filter?: TicketFilter): Ticket[] {
    return this.local.list(filter);
  }

  claim(id: string, opts: ClaimOptions): ClaimResult {
    const res = this.local.claim(id, opts);
    if (res.ok) this.pushRemote('claim', res.ticket);
    return res;
  }

  release(id: string, token: string): boolean {
    const ok = this.local.release(id, token);
    const t = this.local.get(id);
    if (ok && t) this.pushRemote('release', t);
    return ok;
  }

  nextAvailable(filter?: TicketFilter): Ticket | null {
    return this.local.nextAvailable(filter);
  }
}

/** Linear integration (dry-run/local-mock in the MVP). */
export class LinearQueueAdapter extends RemoteQueueAdapter {
  readonly name = 'linear';
  readonly stateMapping: StateMapping = {
    'agent-instructions': 'Triage',
    'agent-to-do': 'Todo',
    'agent-working': 'In Progress',
    'needs-input': 'Blocked',
    'agent-done': 'Done',
    'agent-failed': 'Canceled',
  };
}

/** Jira integration (dry-run/local-mock in the MVP). */
export class JiraQueueAdapter extends RemoteQueueAdapter {
  readonly name = 'jira';
  readonly stateMapping: StateMapping = {
    'agent-instructions': 'Backlog',
    'agent-to-do': 'To Do',
    'agent-working': 'In Progress',
    'needs-input': 'Blocked',
    'agent-done': 'Done',
    'agent-failed': 'Rejected',
  };
}
