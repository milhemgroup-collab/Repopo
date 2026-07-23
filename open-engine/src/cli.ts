#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { Command } from 'commander';
import { Engine } from './engine.js';
import { MockAgentRunner } from './runners/mock-runner.js';
import { runWizard } from './wizard.js';
import type { TaskSpec, Ticket } from './types.js';

loadEnv();

const DB_PATH = process.env.OPEN_ENGINE_DB ?? '.open-engine/engine.db';

function engine(): Engine {
  return new Engine({ dbPath: DB_PATH });
}

function print(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function ticketLine(t: Ticket): string {
  const claim = t.claim ? ` [claimed by ${t.claim.agentId}]` : '';
  return `${t.id}  ${t.state.padEnd(18)} ${t.spec.objective}${claim}`;
}

/** Attach a mock runner so `run`/`work` can execute tickets without a real model. */
function withMockRunners(e: Engine): Engine {
  e.registerRunner(
    new MockAgentRunner({ id: 'mock-generalist', capabilities: ['code', 'research', 'writing', 'general'] }),
  );
  return e;
}

const program = new Command();
program
  .name('open-engine')
  .description('Ticket-as-state-manager multi-agent orchestration. The ticket is the source of truth.')
  .version('0.1.0');

program
  .command('submit')
  .description('Submit a statement of work from a JSON spec file (or --stdin)')
  .option('-f, --file <path>', 'path to a TaskSpec JSON file')
  .option('--stdin', 'read the TaskSpec JSON from stdin')
  .option('-q, --queue <name>', 'queue name', 'default')
  .option('-p, --priority <n>', 'priority (higher runs first)', '0')
  .action((opts) => {
    const raw = opts.stdin
      ? readFileSync(0, 'utf8')
      : readFileSync(opts.file, 'utf8');
    const spec = JSON.parse(raw) as Partial<TaskSpec>;
    const e = engine();
    try {
      const { ticket, validation } = e.submit(spec, {
        queue: opts.queue,
        priority: Number(opts.priority),
      });
      print({ ticket: { id: ticket.id, state: ticket.state }, validation });
      if (!validation.valid) process.exitCode = 2;
    } finally {
      e.close();
    }
  });

program
  .command('new')
  .description('Guided wizard: answer plain questions and it builds + submits a valid ticket')
  .action(async () => {
    if (!process.stdin.isTTY) {
      process.stderr.write(
        'The `new` wizard needs an interactive terminal. In a non-interactive context, ' +
          'use `open-engine submit -f <spec.json>` or pipe a spec via `submit --stdin`.\n',
      );
      process.exitCode = 1;
      return;
    }
    const result = await runWizard();
    if (!result) return;
    if (!result.submit) {
      process.stdout.write('Not submitted.' + (result.saveTo ? ` Spec saved to ${result.saveTo}.` : '') + '\n');
      return;
    }
    const e = engine();
    try {
      const { ticket, validation } = e.submit(result.spec, {
        queue: result.queue,
        priority: result.priority,
      });
      if (validation.valid) {
        process.stdout.write(`\n✓ Ticket ${ticket.id} created in state "${ticket.state}".\n`);
        process.stdout.write('Next steps:\n');
        process.stdout.write(`  open-engine show ${ticket.id}      # inspect it\n`);
        process.stdout.write('  open-engine work                   # let an agent run the queue\n');
      } else {
        process.stdout.write('Validation failed:\n');
        print(validation.issues);
        process.exitCode = 2;
      }
    } finally {
      e.close();
    }
  });

program
  .command('list')
  .description('List tickets, optionally filtered by state or queue')
  .option('-s, --state <state>', 'filter by state')
  .option('-q, --queue <name>', 'filter by queue')
  .action((opts) => {
    const e = engine();
    try {
      const tickets = e.list({ state: opts.state, queue: opts.queue });
      if (tickets.length === 0) {
        process.stdout.write('(no tickets)\n');
        return;
      }
      for (const t of tickets) process.stdout.write(ticketLine(t) + '\n');
    } finally {
      e.close();
    }
  });

program
  .command('show <ticketId>')
  .description('Show a ticket in full (spec, blockers, receipt)')
  .action((ticketId) => {
    const e = engine();
    try {
      const t = e.getTicket(ticketId);
      if (!t) {
        process.stderr.write(`ticket ${ticketId} not found\n`);
        process.exitCode = 1;
        return;
      }
      print(t);
    } finally {
      e.close();
    }
  });

program
  .command('history <ticketId>')
  .description('Show the audit trail for a ticket')
  .action((ticketId) => {
    const e = engine();
    try {
      for (const ev of e.history(ticketId)) {
        process.stdout.write(`${ev.at}  ${ev.type.padEnd(18)} ${ev.actor}  ${JSON.stringify(ev.payload)}\n`);
      }
    } finally {
      e.close();
    }
  });

program
  .command('run <ticketId>')
  .description('Run one ticket with the mock runner (demo/local execution)')
  .action(async (ticketId) => {
    const e = withMockRunners(engine());
    try {
      const result = await e.runTicket(ticketId);
      print(result);
    } finally {
      e.close();
    }
  });

program
  .command('work')
  .description('Claim and run the next available ticket (repeat until idle)')
  .option('--once', 'process a single ticket then stop')
  .action(async (opts) => {
    const e = withMockRunners(engine());
    try {
      for (;;) {
        const result = await e.processNext();
        if (result.status === 'idle') {
          process.stdout.write('queue idle\n');
          break;
        }
        process.stdout.write(`${result.status}: ${'ticket' in result ? result.ticket.id : ''}\n`);
        if (opts.once) break;
      }
    } finally {
      e.close();
    }
  });

program
  .command('answer <ticketId> <questionId> <answer>')
  .description('Answer a blocker question and return the ticket to the queue')
  .option('--by <who>', 'who answered', 'human')
  .action((ticketId, questionId, answer, opts) => {
    const e = engine();
    try {
      const t = e.provideInput(ticketId, [{ questionId, answer, by: opts.by }]);
      print({ id: t.id, state: t.state, openBlockers: t.blockerQuestions.filter((q) => !q.answer).length });
    } finally {
      e.close();
    }
  });

program.parseAsync(process.argv);
