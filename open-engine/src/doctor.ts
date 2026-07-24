import { createRequire } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Engine } from './engine.js';
import { MockAgentRunner } from './runners/mock-runner.js';
import type { TicketState } from './types.js';

/**
 * Self-diagnosis for an Open Engine install.
 *
 * `open-engine doctor` answers one question — "is this actually working on this
 * machine?" — without the user having to know what to look for. Each check is
 * independent and reports a status plus a human-readable fix when it fails.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  /** Present when the user needs to do something about it. */
  fix?: string;
}

export interface DoctorReport {
  checks: CheckResult[];
  healthy: boolean;
}

const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 5;

/** Node >= 22.5 is a hard requirement: `node:sqlite` does not exist before it. */
function checkNodeVersion(version: string): CheckResult {
  const m = /^v(\d+)\.(\d+)\./.exec(version);
  if (!m) {
    return {
      name: 'Node.js version',
      status: 'warn',
      detail: `could not parse version "${version}"`,
    };
  }
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const ok = major > MIN_NODE_MAJOR || (major === MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR);
  return ok
    ? { name: 'Node.js version', status: 'pass', detail: `${version} (need >= v22.5)` }
    : {
        name: 'Node.js version',
        status: 'fail',
        detail: `${version} is too old (need >= v22.5)`,
        fix: 'Install the current Node LTS from https://nodejs.org, then re-run this command.',
      };
}

/** The built-in SQLite module — the only "native" dependency, and it ships with Node. */
function checkSqlite(): CheckResult {
  try {
    const req = createRequire(import.meta.url);
    const mod = req('node:sqlite') as { DatabaseSync?: unknown };
    if (typeof mod.DatabaseSync !== 'function') {
      return {
        name: 'SQLite support',
        status: 'fail',
        detail: 'node:sqlite loaded but DatabaseSync is missing',
        fix: 'Upgrade to the current Node LTS (>= v22.5).',
      };
    }
    return { name: 'SQLite support', status: 'pass', detail: 'node:sqlite available (no native build needed)' };
  } catch (err) {
    return {
      name: 'SQLite support',
      status: 'fail',
      detail: `node:sqlite unavailable: ${err instanceof Error ? err.message : String(err)}`,
      fix: 'Upgrade to the current Node LTS (>= v22.5).',
    };
  }
}

/** Is the state directory usable, and where does it live? */
function checkStateLocation(dbPath: string): CheckResult {
  const abs = resolve(dbPath);
  const dir = dirname(abs);
  const exists = existsSync(abs);
  if (exists) {
    try {
      const size = statSync(abs).size;
      return {
        name: 'State database',
        status: 'pass',
        detail: `${abs} (${size.toLocaleString()} bytes)`,
      };
    } catch {
      /* fall through to the generic report below */
    }
  }
  return {
    name: 'State database',
    status: 'pass',
    detail: existsSync(dir)
      ? `${abs} (not created yet — will be created on first ticket)`
      : `${abs} (directory will be created on first ticket)`,
  };
}

/**
 * The real proof: run a whole ticket lifecycle in an in-memory engine and
 * confirm it reaches agent-done with a receipt and a complete audit trail.
 */
async function checkLifecycle(): Promise<CheckResult> {
  try {
    const engine = new Engine({ dbPath: ':memory:' });
    try {
      engine.registerRunner(new MockAgentRunner({ id: 'doctor', capabilities: ['diagnostic'] }));
      const { ticket, validation } = engine.submit({
        objective: 'Self-test: verify the ticket lifecycle end to end',
        requiredCapability: ['diagnostic'],
        definitionOfDone: ['Ticket reaches agent-done with a work receipt'],
        acceptanceTests: ['doctor confirms state and receipt'],
      });
      if (!validation.valid) {
        return { name: 'Ticket lifecycle', status: 'fail', detail: 'self-test spec failed validation' };
      }

      const result = await engine.runTicket(ticket.id);
      const done = engine.getTicket(ticket.id);
      const events = engine.history(ticket.id).map((e) => e.type);

      if (result.status !== 'done' || done?.state !== 'agent-done') {
        return {
          name: 'Ticket lifecycle',
          status: 'fail',
          detail: `expected agent-done, got ${done?.state ?? 'unknown'} (${result.status})`,
        };
      }
      if (!done.receipt) {
        return { name: 'Ticket lifecycle', status: 'fail', detail: 'ticket closed without a work receipt' };
      }
      const required = ['ticket.created', 'ticket.claimed', 'receipt.generated', 'ticket.completed'];
      const missing = required.filter((t) => !events.includes(t as (typeof events)[number]));
      if (missing.length > 0) {
        return {
          name: 'Ticket lifecycle',
          status: 'fail',
          detail: `audit trail missing: ${missing.join(', ')}`,
        };
      }
      return {
        name: 'Ticket lifecycle',
        status: 'pass',
        detail: `submit -> claim -> run -> receipt -> agent-done (${events.length} audit events)`,
      };
    } finally {
      engine.close();
    }
  } catch (err) {
    return {
      name: 'Ticket lifecycle',
      status: 'fail',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Confirm a bare prompt is still refused — the core "prompts are not tasks" rule. */
function checkValidatorRejectsPrompt(): CheckResult {
  try {
    const engine = new Engine({ dbPath: ':memory:' });
    try {
      const { ticket, validation } = engine.submit({ objective: 'make it better' });
      const held = ticket.state === 'agent-instructions';
      return !validation.valid && held
        ? {
            name: 'Task validation',
            status: 'pass',
            detail: 'bare prompts are refused and held in agent-instructions',
          }
        : {
            name: 'Task validation',
            status: 'fail',
            detail: 'a bare prompt was accepted — the validator is not enforcing structure',
          };
    } finally {
      engine.close();
    }
  } catch (err) {
    return {
      name: 'Task validation',
      status: 'fail',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Summarise what is already in the user's real queue. */
function checkQueue(dbPath: string): CheckResult {
  try {
    const engine = new Engine({ dbPath });
    try {
      const tickets = engine.list();
      if (tickets.length === 0) {
        return {
          name: 'Your queue',
          status: 'pass',
          detail: 'no tickets yet — run `open-engine new` to create one',
        };
      }
      const counts = new Map<TicketState, number>();
      for (const t of tickets) counts.set(t.state, (counts.get(t.state) ?? 0) + 1);
      const summary = [...counts.entries()].map(([s, n]) => `${n} ${s}`).join(', ');
      return { name: 'Your queue', status: 'pass', detail: `${tickets.length} ticket(s): ${summary}` };
    } finally {
      engine.close();
    }
  } catch (err) {
    return {
      name: 'Your queue',
      status: 'warn',
      detail: `could not read the queue: ${err instanceof Error ? err.message : String(err)}`,
      fix: 'Check that the state database path is writable.',
    };
  }
}

/** Run every diagnostic and summarise overall health. */
export async function runDoctor(opts: { dbPath: string; nodeVersion?: string }): Promise<DoctorReport> {
  const checks: CheckResult[] = [
    checkNodeVersion(opts.nodeVersion ?? process.version),
    checkSqlite(),
    checkStateLocation(opts.dbPath),
    checkValidatorRejectsPrompt(),
    await checkLifecycle(),
    checkQueue(opts.dbPath),
  ];
  return { checks, healthy: checks.every((c) => c.status !== 'fail') };
}

const GLYPH: Record<CheckStatus, string> = { pass: '✓', warn: '!', fail: '✕' };

/** Render the report as plain text for the terminal. */
export function formatReport(report: DoctorReport, version: string): string {
  const lines: string[] = ['', `Open Engine ${version} — health check`, ''];
  const width = Math.max(...report.checks.map((c) => c.name.length));
  for (const c of report.checks) {
    lines.push(`  ${GLYPH[c.status]} ${c.name.padEnd(width)}  ${c.detail}`);
    if (c.fix) lines.push(`      -> ${c.fix}`);
  }
  lines.push('');
  lines.push(
    report.healthy
      ? '  Everything works. Open Engine is healthy on this machine.'
      : '  Some checks failed — see the -> lines above for how to fix them.',
  );
  lines.push('');
  return lines.join('\n');
}
