import { createInterface } from 'node:readline/promises';
import { writeFileSync } from 'node:fs';
import type { TaskSpec } from './types.js';
import { DefaultTaskSpecValidator } from './validator.js';

/**
 * Interactive task wizard — the friendly front door to "prompts are not tasks".
 *
 * It asks plain-language questions and assembles a valid {@link TaskSpec}, so a
 * newcomer never has to hand-write JSON or memorise the required fields. Fields
 * the validator requires (objective, capability, Definition of Done, acceptance
 * tests) are collected as required prompts, so the result validates by
 * construction.
 *
 * The interview logic is decoupled from readline via the {@link WizardIO}
 * interface: production wires it to the terminal; tests wire it to a scripted
 * list of answers.
 */

/** Terminal abstraction: ask a question (get a line) and write a line out. */
export interface WizardIO {
  ask(question: string): Promise<string>;
  write(line: string): void;
}

const CAPABILITY_HINTS = 'e.g. code, research, writing, design, review, ops';

async function askTrimmed(io: WizardIO, q: string): Promise<string> {
  return (await io.ask(q)).trim();
}

async function askRequired(io: WizardIO, q: string): Promise<string> {
  for (;;) {
    const answer = await askTrimmed(io, q);
    if (answer) return answer;
    io.write('  (required — please enter a value)');
  }
}

async function askList(io: WizardIO, q: string, opts: { min?: number } = {}): Promise<string[]> {
  for (;;) {
    const raw = await askTrimmed(io, q);
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length >= (opts.min ?? 0)) return items;
    io.write(`  (please give at least ${opts.min} — comma-separated)`);
  }
}

async function askLines(io: WizardIO, label: string, opts: { min?: number } = {}): Promise<string[]> {
  const min = opts.min ?? 0;
  io.write(`${label} (one per line; blank line to finish${min ? `, at least ${min}` : ''}):`);
  const items: string[] = [];
  for (;;) {
    const line = await askTrimmed(io, `  ${items.length + 1}. `);
    if (!line) {
      if (items.length >= min) return items;
      io.write(`  (need at least ${min} — keep going)`);
      continue;
    }
    items.push(line);
  }
}

async function askYesNo(io: WizardIO, q: string, def = true): Promise<boolean> {
  const answer = (await askTrimmed(io, q + (def ? ' [Y/n] ' : ' [y/N] '))).toLowerCase();
  if (!answer) return def;
  return answer.startsWith('y');
}

export interface WizardResult {
  spec: TaskSpec;
  queue: string;
  priority: number;
  saveTo?: string;
  submit: boolean;
}

/**
 * Run the interview against an injected IO and assemble the result.
 * `save` is injected too so tests don't touch the filesystem.
 */
export async function interview(
  io: WizardIO,
  save: (path: string, spec: TaskSpec) => void,
): Promise<WizardResult> {
  io.write('\nOpen Engine — new task');
  io.write('Answer a few questions; a valid work ticket will be assembled for you.\n');

  const objective = await askRequired(io, 'Objective (one sentence — what does "done" produce?): ');
  const background = await askTrimmed(io, 'Background (context an agent needs; optional): ');
  const requiredCapability = await askList(io, `Required capabilities (comma-separated; ${CAPABILITY_HINTS}): `, { min: 1 });
  const inputSources = await askList(io, 'Input sources (files/URLs/ticket ids, comma-separated; optional): ');
  const constraints = await askList(io, 'Constraints (comma-separated; optional): ');
  const risks = await askList(io, 'Known risks (comma-separated; optional): ');
  const definitionOfDone = await askLines(io, 'Definition of Done — checkable completion criteria', { min: 1 });
  const acceptanceTests = await askLines(io, 'Acceptance tests — how the DoD is verified', { min: 1 });

  const queueRaw = await askTrimmed(io, 'Queue name [default]: ');
  const priorityRaw = await askTrimmed(io, 'Priority (higher runs first) [0]: ');

  const spec = new DefaultTaskSpecValidator().normalize({
    objective,
    background,
    requiredCapability,
    inputSources,
    constraints,
    risks,
    definitionOfDone,
    acceptanceTests,
    artifacts: [],
  });

  io.write('\n--- Ticket preview ---');
  io.write(`Objective: ${spec.objective}`);
  io.write(`Capabilities: ${spec.requiredCapability.join(', ')}`);
  io.write(`Definition of Done:\n${spec.definitionOfDone.map((d) => `  - ${d}`).join('\n')}`);
  io.write(`Acceptance tests:\n${spec.acceptanceTests.map((t) => `  - ${t}`).join('\n')}\n`);

  let saveTo: string | undefined;
  if (await askYesNo(io, 'Save this spec to a JSON file (so you can re-use or edit it)?', false)) {
    const path = (await askTrimmed(io, '  File path [task.json]: ')) || 'task.json';
    save(path, spec);
    saveTo = path;
    io.write(`  saved to ${saveTo}`);
  }

  const submit = await askYesNo(io, 'Submit this ticket to the queue now?', true);
  return { spec, queue: queueRaw || 'default', priority: Number(priorityRaw) || 0, saveTo, submit };
}

/**
 * Production entry point: wire the interview to the real terminal.
 * Returns `null` if the user cancels (Ctrl+C / Ctrl+D / end of input).
 */
export async function runWizard(): Promise<WizardResult | null> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const io: WizardIO = {
    ask: (q) => rl.question(q),
    write: (line) => process.stdout.write(line + '\n'),
  };
  try {
    return await interview(io, (path, spec) => writeFileSync(path, JSON.stringify(spec, null, 2) + '\n'));
  } catch (err) {
    // readline rejects with AbortError on Ctrl+C/Ctrl+D or when stdin ends.
    if (err instanceof Error && (err.name === 'AbortError' || (err as NodeJS.ErrnoException).code === 'ABORT_ERR')) {
      process.stdout.write('\nCancelled — no ticket created.\n');
      return null;
    }
    throw err;
  } finally {
    rl.close();
  }
}
