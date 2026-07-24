import type { TaskSpec } from '../src/types.js';

/** A fully-valid spec; override fields per-test. */
export function validSpec(over: Partial<TaskSpec> = {}): Partial<TaskSpec> {
  return {
    objective: 'Add a /health endpoint to the API',
    background: 'Ops needs a liveness probe for the load balancer.',
    inputSources: ['src/server.ts'],
    artifacts: [],
    requiredCapability: ['code'],
    constraints: ['no new dependencies'],
    risks: ['must not block the event loop'],
    definitionOfDone: ['GET /health returns 200 with {status:"ok"}'],
    acceptanceTests: ['curl localhost/health returns 200'],
    ...over,
  };
}
