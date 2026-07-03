import { describe, expect, it } from 'vitest';
import { DefaultTaskSpecValidator } from '../src/validator.js';
import { validSpec } from './helpers.js';

const v = new DefaultTaskSpecValidator();

describe('TaskSpecValidator', () => {
  it('accepts a fully-formed statement of work', () => {
    expect(v.validate(validSpec()).valid).toBe(true);
  });

  it('rejects a bare prompt with no structure (prompts are not tasks)', () => {
    const res = v.validate({ objective: 'make it better' });
    expect(res.valid).toBe(false);
    const fields = res.issues.map((i) => i.field);
    expect(fields).toContain('requiredCapability');
    expect(fields).toContain('definitionOfDone');
    expect(fields).toContain('acceptanceTests');
  });

  it('requires a non-empty objective', () => {
    const res = v.validate(validSpec({ objective: '   ' }));
    expect(res.valid).toBe(false);
    expect(res.issues.some((i) => i.field === 'objective')).toBe(true);
  });

  it('requires a Definition of Done', () => {
    const res = v.validate(validSpec({ definitionOfDone: [] }));
    expect(res.valid).toBe(false);
    expect(res.issues.some((i) => i.field === 'definitionOfDone')).toBe(true);
  });

  it('normalizes a partial spec into a full one', () => {
    const norm = v.normalize({ objective: 'x' });
    expect(norm.constraints).toEqual([]);
    expect(norm.definitionOfDone).toEqual([]);
  });
});
