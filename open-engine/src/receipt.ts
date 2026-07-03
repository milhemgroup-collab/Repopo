import type { WorkReceipt } from './types.js';
import { type Clock, toIso } from './util.js';

/** What a runner supplies; the generator fills defaults and stamps it. */
export type ReceiptInput = Partial<Omit<WorkReceipt, 'generatedBy' | 'generatedAt'>>;

export interface ReceiptValidation {
  valid: boolean;
  issues: string[];
}

/**
 * ReceiptGenerator — no ticket may reach `agent-done` without a work receipt.
 *
 * A receipt is the proof-of-work handoff: what was done, what was touched, what
 * was skipped, what assumptions were made, and what risks remain. The generator
 * both builds a well-formed receipt and validates that it says something real.
 */
export interface ReceiptGenerator {
  generate(agentId: string, input: ReceiptInput): WorkReceipt;
  validate(receipt: WorkReceipt): ReceiptValidation;
}

export class DefaultReceiptGenerator implements ReceiptGenerator {
  constructor(private readonly clock: Clock) {}

  generate(agentId: string, input: ReceiptInput): WorkReceipt {
    return {
      summary: input.summary?.trim() ?? '',
      filesChanged: input.filesChanged ?? [],
      commandsRun: input.commandsRun ?? [],
      testsRun: input.testsRun ?? [],
      outputsCreated: input.outputsCreated ?? [],
      skipped: input.skipped ?? [],
      assumptions: input.assumptions ?? [],
      risksRemaining: input.risksRemaining ?? [],
      followUpTickets: input.followUpTickets ?? [],
      artifacts: input.artifacts ?? [],
      generatedBy: agentId,
      generatedAt: toIso(this.clock.now()),
    };
  }

  validate(receipt: WorkReceipt): ReceiptValidation {
    const issues: string[] = [];
    if (!receipt.summary || receipt.summary.trim().length === 0) {
      issues.push('receipt.summary is required — state what was completed');
    }
    const touchedSomething =
      receipt.filesChanged.length +
        receipt.outputsCreated.length +
        receipt.artifacts.length >
      0;
    if (!touchedSomething && receipt.skipped.length === 0) {
      issues.push(
        'receipt must record at least one output (files/outputs/artifacts) or explicitly list what was skipped',
      );
    }
    return { valid: issues.length === 0, issues };
  }
}
