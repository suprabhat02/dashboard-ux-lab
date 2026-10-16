import { describe, expect, it } from 'vitest';
import {
  phaseZones,
  REQUEST_AXIS_MS,
  sqrtScale,
  zoneColumns,
} from '../../src/spec/time-axis';

describe('time axis', () => {
  const scale = sqrtScale(REQUEST_AXIS_MS);

  it('places the spec boundaries where the ruler always had them', () => {
    expect(scale.position(300)).toBeCloseTo(0.158, 3);
    expect(scale.position(3_000)).toBeCloseTo(0.5, 3);
    expect(scale.position(8_000)).toBeCloseTo(0.816, 3);
  });

  it('clamps to the axis and inverts exactly', () => {
    expect(scale.position(-5)).toBe(0);
    expect(scale.position(99_999)).toBe(1);
    for (const ms of [0, 1, 300, 2_999, 12_000]) {
      expect(scale.timeAt(scale.position(ms))).toBeCloseTo(ms, 6);
    }
  });

  it('refuses an axis with no length', () => {
    expect(() => sqrtScale(0)).toThrow(RangeError);
    expect(() => sqrtScale(Number.NaN)).toThrow(RangeError);
  });

  it('cuts the loading phases into zones that tile the axis exactly', () => {
    const zones = phaseZones(scale);
    expect(zones.map((zone) => zone.phase)).toEqual([
      'pending',
      'skeleton',
      'slow',
      'stalled',
    ]);
    expect(zones.reduce((sum, zone) => sum + zone.size, 0)).toBeCloseTo(1, 9);
    zones.slice(1).forEach((zone, index) => {
      const previous = zones[index];
      expect(zone.start).toBeCloseTo((previous?.start ?? 0) + (previous?.size ?? 0), 9);
    });
  });

  it('shows only the phases a short axis can reach', () => {
    const zones = phaseZones(sqrtScale(1_200));
    expect(zones.map((zone) => zone.phase)).toEqual(['pending', 'skeleton']);
    expect(zones.at(-1)?.endMs).toBe(1_200);
  });

  it('describes the zones as grid columns', () => {
    expect(zoneColumns(phaseZones(scale)).split(' ')).toHaveLength(4);
    expect(zoneColumns(phaseZones(scale))).toMatch(/^(\d\.\d{5}fr ?){4}$/);
  });
});
