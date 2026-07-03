import type { TaskSpec } from './types.js';

export interface ValidationIssue {
  field: keyof TaskSpec | 'spec';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * TaskSpecValidator — enforces "prompts are not tasks".
 *
 * A ticket may not leave `agent-instructions` for `agent-to-do` until its spec
 * carries enough structure for any capable agent to act without guessing:
 * an objective, at least one required capability, a Definition of Done, and
 * acceptance tests that verify it.
 */
export interface TaskSpecValidator {
  validate(spec: Partial<TaskSpec>): ValidationResult;
  /** Fill absent optional array fields so a partial spec becomes a full one. */
  normalize(spec: Partial<TaskSpec>): TaskSpec;
}

const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const nonEmptyList = (a: unknown): a is string[] =>
  Array.isArray(a) && a.length > 0 && a.every(nonEmpty);

export class DefaultTaskSpecValidator implements TaskSpecValidator {
  normalize(spec: Partial<TaskSpec>): TaskSpec {
    return {
      objective: spec.objective?.trim() ?? '',
      background: spec.background?.trim() ?? '',
      inputSources: spec.inputSources ?? [],
      artifacts: spec.artifacts ?? [],
      requiredCapability: spec.requiredCapability ?? [],
      constraints: spec.constraints ?? [],
      risks: spec.risks ?? [],
      definitionOfDone: spec.definitionOfDone ?? [],
      acceptanceTests: spec.acceptanceTests ?? [],
    };
  }

  validate(spec: Partial<TaskSpec>): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!nonEmpty(spec.objective)) {
      issues.push({ field: 'objective', message: 'objective is required and must be non-empty' });
    }
    if (!nonEmptyList(spec.requiredCapability)) {
      issues.push({
        field: 'requiredCapability',
        message: 'at least one required capability must be declared so a queue can route the ticket',
      });
    }
    if (!nonEmptyList(spec.definitionOfDone)) {
      issues.push({
        field: 'definitionOfDone',
        message: 'a Definition of Done is required; a ticket with no checkable done-criteria cannot be closed',
      });
    }
    if (!nonEmptyList(spec.acceptanceTests)) {
      issues.push({
        field: 'acceptanceTests',
        message: 'at least one acceptance test is required to verify the Definition of Done',
      });
    }

    return { valid: issues.length === 0, issues };
  }
}
