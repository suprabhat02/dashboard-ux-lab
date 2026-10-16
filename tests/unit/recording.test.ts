import { describe, expect, it } from 'vitest';
import type { LabTelemetry } from '../../src/spec/protocol';
import {
  appendEvent,
  axisLengthFor,
  lanesFor,
  RECORDING_LIMIT,
  snapshotAt,
  type Recorded,
  type Recording,
} from '../../src/spec/recording';
import { getScenario } from '../../src/spec/scenarios';

type TelemetryInput = LabTelemetry extends infer T
  ? T extends unknown
    ? Omit<T, 'at'>
    : never
  : never;
const at = (atMs: number, event: TelemetryInput): Recorded => ({
  ...event,
  at: atMs,
  atMs,
});

/** A slow reload from a loaded dashboard, cancelled at 9 s. */
const slowCancelled: Recording = {
  settings: getScenario('slow').settings,
  events: [
    at(0, { type: 'request', phase: 'start', attempt: 1 }),
    at(0, { type: 'state', from: 'success', to: 'loading' }),
    at(0, { type: 'phase', phase: 'pending' }),
    at(300, { type: 'phase', phase: 'skeleton' }),
    at(450, {
      type: 'announce',
      message: 'Loading dashboard data.',
      politeness: 'polite',
    }),
    at(3_000, { type: 'phase', phase: 'slow' }),
    at(3_150, { type: 'announce', message: 'Taking longer.', politeness: 'polite' }),
    at(8_000, { type: 'phase', phase: 'stalled' }),
    at(9_000, { type: 'state', from: 'loading', to: 'cancelled' }),
    at(9_000, { type: 'request', phase: 'aborted', attempt: 1 }),
    at(9_000, { type: 'focus', target: 'button “Load again”', reason: 'removed' }),
    at(9_150, { type: 'announce', message: 'Request cancelled.', politeness: 'polite' }),
  ],
};

describe('snapshot at a moment', () => {
  it('keeps the previous data dimmed during the first 300 ms of a reload', () => {
    expect(snapshotAt(slowCancelled, 100).screen).toBe('previous');
  });

  it('follows the escalation of a slow request', () => {
    expect(snapshotAt(slowCancelled, 1_000).screen).toBe('placeholders');
    expect(snapshotAt(slowCancelled, 5_000).screen).toBe('slowNotice');
    expect(snapshotAt(slowCancelled, 8_500)).toMatchObject({
      screen: 'cancelOffered',
      inFlight: 1,
      heard: { message: 'Taking longer.', atMs: 3_150 },
    });
  });

  it('includes what happens exactly at the moment, and nothing after it', () => {
    const atCancel = snapshotAt(slowCancelled, 9_000);
    expect(atCancel).toMatchObject({ screen: 'cancelled', inFlight: null });
    expect(atCancel.focus?.target).toBe('button “Load again”');
    expect(atCancel.heard?.message).toBe('Taking longer.');
  });

  it('knows an empty result from its settings, and a retry from its error', () => {
    const empty: Recording = {
      settings: getScenario('empty').settings,
      events: [at(700, { type: 'state', from: 'loading', to: 'success' })],
    };
    expect(snapshotAt(empty, 800).screen).toBe('empty');
    const retry: Recording = {
      settings: getScenario('error').settings,
      events: [at(0, { type: 'state', from: 'error', to: 'loading' })],
    };
    expect(snapshotAt(retry, 10).screen).toBe('retrying');
  });
});

describe('lanes', () => {
  const lanes = lanesFor(slowCancelled, 10_000);

  it('covers the whole run with consecutive screen spans', () => {
    expect(lanes.screen.map((span) => span.screen)).toEqual([
      'previous',
      'placeholders',
      'slowNotice',
      'cancelOffered',
      'cancelled',
    ]);
    lanes.screen.slice(1).forEach((span, index) => {
      expect(span.fromMs).toBe(lanes.screen[index]?.toMs);
    });
    expect(lanes.screen.at(-1)?.toMs).toBe(10_000);
  });

  it('lists what was heard and every focus move', () => {
    expect(lanes.heard.map((mark) => mark.atMs)).toEqual([450, 3_150, 9_150]);
    expect(lanes.focus).toHaveLength(1);
  });

  it('offers each change once, in order, for keyboard stepping', () => {
    expect(lanes.changes).toEqual([0, 300, 450, 3_000, 3_150, 8_000, 9_000, 9_150]);
  });

  it('picks an axis that fits the run with a little room', () => {
    expect(axisLengthFor(700)).toBe(1_000);
    expect(axisLengthFor(10_000)).toBe(12_000);
    expect(axisLengthFor(59_000)).toBe(70_000);
    expect(lanes.scale.maxMs).toBe(12_000);
  });
});

describe('limits', () => {
  it('stops recording at the limit instead of growing without bound', () => {
    let recording: Recording = { settings: slowCancelled.settings, events: [] };
    for (let index = 0; index < RECORDING_LIMIT + 50; index += 1) {
      recording = appendEvent(recording, at(index, { type: 'phase', phase: 'pending' }));
    }
    expect(recording.events).toHaveLength(RECORDING_LIMIT);
  });
});
