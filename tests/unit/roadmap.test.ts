import { describe, expect, it } from 'vitest';
import { currentPhaseIndex } from '../../src/spec/roadmap';

describe('roadmap position', () => {
  it('is the phase in progress', () => {
    expect(currentPhaseIndex(['done', 'now', 'next'])).toBe(1);
  });
  it('is the latest finished phase between phases', () => {
    expect(currentPhaseIndex(['done', 'done', 'next', 'later'])).toBe(1);
  });
  it('is nowhere on a roadmap that has not started', () => {
    expect(currentPhaseIndex(['next', 'later'])).toBe(-1);
  });
});
