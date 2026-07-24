import { describe, expect, it } from 'vitest';
import { formatReport, runDoctor } from '../src/doctor.js';

describe('doctor', () => {
  it('reports healthy on a working install', async () => {
    const report = await runDoctor({ dbPath: ':memory:' });
    expect(report.healthy).toBe(true);
    const failures = report.checks.filter((c) => c.status === 'fail');
    expect(failures).toEqual([]);
  });

  it('actually exercises the lifecycle and validator, not just imports', async () => {
    const report = await runDoctor({ dbPath: ':memory:' });
    const byName = Object.fromEntries(report.checks.map((c) => [c.name, c]));

    expect(byName['Ticket lifecycle']?.status).toBe('pass');
    expect(byName['Ticket lifecycle']?.detail).toContain('agent-done');
    expect(byName['Task validation']?.status).toBe('pass');
    expect(byName['SQLite support']?.status).toBe('pass');
  });

  it('fails the Node check on a too-old runtime and explains the fix', async () => {
    const report = await runDoctor({ dbPath: ':memory:', nodeVersion: 'v20.11.0' });
    const node = report.checks.find((c) => c.name === 'Node.js version');
    expect(node?.status).toBe('fail');
    expect(node?.fix).toMatch(/nodejs\.org/);
    expect(report.healthy).toBe(false);
  });

  it('renders a readable report including fix hints', async () => {
    const report = await runDoctor({ dbPath: ':memory:', nodeVersion: 'v20.11.0' });
    const text = formatReport(report, '0.1.0');
    expect(text).toContain('Open Engine 0.1.0 — health check');
    expect(text).toContain('✕');
    expect(text).toContain('->');
    expect(text).toContain('Some checks failed');
  });
});
