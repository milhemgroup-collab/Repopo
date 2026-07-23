import { describe, expect, it } from 'vitest';
import { interview, type WizardIO } from '../src/wizard.js';
import { DefaultTaskSpecValidator } from '../src/validator.js';
import { Engine } from '../src/engine.js';

/** A WizardIO backed by a scripted list of answers. */
function scriptedIO(answers: string[]): { io: WizardIO; output: string[] } {
  const queue = [...answers];
  const output: string[] = [];
  const io: WizardIO = {
    ask: async (q) => {
      output.push(q);
      if (queue.length === 0) throw new Error(`wizard asked more than scripted: "${q}"`);
      return queue.shift()!;
    },
    write: (line) => output.push(line),
  };
  return { io, output };
}

const ANSWERS = [
  'Add rate limiting to the login endpoint', // objective
  'Brute-force attempts spiked last week.', // background
  'code, security', // capabilities
  'src/auth/login.ts', // input sources
  'No new external services', // constraints
  'Must not lock out legitimate users', // risks
  'Login limited to 5 attempts/min per IP', // DoD 1
  'Returns HTTP 429 when exceeded', // DoD 2
  '', // DoD done
  'Integration test simulates 6 rapid logins', // acceptance 1
  '', // acceptance done
  'security', // queue
  '5', // priority
  'n', // save to file? no
  'y', // submit? yes
];

describe('task wizard', () => {
  it('assembles a valid spec from plain answers', async () => {
    const { io } = scriptedIO(ANSWERS);
    const result = await interview(io, () => {
      throw new Error('should not save when user answers "n"');
    });

    expect(result.queue).toBe('security');
    expect(result.priority).toBe(5);
    expect(result.submit).toBe(true);
    expect(result.saveTo).toBeUndefined();
    expect(result.spec.requiredCapability).toEqual(['code', 'security']);
    expect(result.spec.definitionOfDone).toEqual([
      'Login limited to 5 attempts/min per IP',
      'Returns HTTP 429 when exceeded',
    ]);
    expect(result.spec.acceptanceTests).toEqual(['Integration test simulates 6 rapid logins']);

    // The whole point: the assembled spec passes validation by construction.
    expect(new DefaultTaskSpecValidator().validate(result.spec).valid).toBe(true);
  });

  it('re-prompts until required fields are provided', async () => {
    // Objective blank twice, then given; capability blank once, then given.
    const answers = [
      '', // objective (blank -> reprompt)
      '   ', // objective (whitespace -> reprompt)
      'Real objective',
      '', // background
      '', // capabilities (blank -> reprompt, min 1)
      'code',
      '', // input sources
      '', // constraints
      '', // risks
      'It works', // DoD 1
      '', // DoD done
      'A test', // acceptance 1
      '', // acceptance done
      '', // queue -> default
      '', // priority -> 0
      'n', // save
      'y', // submit
    ];
    const { io } = scriptedIO(answers);
    const result = await interview(io, () => {});
    expect(result.spec.objective).toBe('Real objective');
    expect(result.spec.requiredCapability).toEqual(['code']);
    expect(result.queue).toBe('default');
    expect(result.priority).toBe(0);
  });

  it('produces a spec the engine accepts and can run end-to-end', async () => {
    const { io } = scriptedIO(ANSWERS);
    const { spec, queue, priority } = await interview(io, () => {});

    const engine = new Engine({ dbPath: ':memory:' });
    const { ticket, validation } = engine.submit(spec, { queue, priority });
    expect(validation.valid).toBe(true);
    expect(ticket.state).toBe('agent-to-do');
    engine.close();
  });
});
