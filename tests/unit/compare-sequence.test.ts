import { describe, expect, it } from 'vitest';
import { compareRuns, stepOf } from '../../src/lab/compare/sequence';

describe('stepOf', () => {
  it('drops timestamps, so the same behaviour at different times is the same step', () => {
    const early = stepOf({ type: 'state', from: 'idle', to: 'loading', at: 4 });
    const late = stepOf({ type: 'state', from: 'idle', to: 'loading', at: 900 });
    expect(early).toBe(late);
  });

  it('ignores the build name and in-dashboard settings changes', () => {
    expect(stepOf({ type: 'ready', implementation: 'react', at: 1 })).toBeNull();
    expect(
      stepOf({
        type: 'settings',
        settings: { latencyMs: 700, failure: 'never', role: 'analyst', plan: 'all' },
        at: 1,
      }),
    ).toBeNull();
  });

  it('keeps what a person perceives: the exact announcement and its politeness', () => {
    expect(
      stepOf({ type: 'announce', message: 'Loaded', politeness: 'polite', at: 1 }),
    ).not.toBe(
      stepOf({ type: 'announce', message: 'Loaded', politeness: 'assertive', at: 1 }),
    );
  });
});

describe('compareRuns', () => {
  it('waits while neither build has done anything', () => {
    expect(compareRuns([], [])).toEqual({ kind: 'waiting' });
  });

  it('agrees on a shared prefix while one build is still catching up', () => {
    expect(compareRuns(['a', 'b', 'c'], ['a', 'b'])).toEqual({
      kind: 'agree',
      steps: 2,
      ahead: 1,
    });
  });

  it('reports the first step that differs, from either side', () => {
    expect(compareRuns(['a', 'x', 'c'], ['a', 'y', 'c'])).toEqual({
      kind: 'differ',
      index: 1,
      a: 'x',
      b: 'y',
    });
  });

  it('treats a missing step as a difference once both builds are quiet', () => {
    expect(compareRuns(['a', 'b'], ['a'], true)).toEqual({
      kind: 'differ',
      index: 1,
      a: 'b',
      b: undefined,
    });
    expect(compareRuns(['a', 'b'], ['a', 'b'], true)).toEqual({
      kind: 'agree',
      steps: 2,
      ahead: 0,
    });
  });
});
