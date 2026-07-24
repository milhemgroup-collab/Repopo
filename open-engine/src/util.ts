import { randomUUID } from 'node:crypto';

/** Injectable clock so time-dependent behaviour (claim expiry) is testable. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** A clock the tests can advance manually. */
export function fixedClock(start: Date | string): Clock & { advance(ms: number): void } {
  let t = new Date(start).getTime();
  return {
    now: () => new Date(t),
    advance: (ms: number) => {
      t += ms;
    },
  };
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export function toIso(d: Date): string {
  return d.toISOString();
}
