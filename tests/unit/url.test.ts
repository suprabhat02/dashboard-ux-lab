import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getScenario,
  matchScenario,
  SCENARIOS,
} from '../../src/spec/scenarios';
import { hrefFor, parseSettings, serializeSettings } from '../../src/spec/url';

const parse = (query: string) => parseSettings(new URLSearchParams(query));

describe('settings ⇄ URL', () => {
  it('defaults to the loaded scenario', () => {
    expect(parse('')).toEqual(DEFAULT_SETTINGS);
  });

  it.each(SCENARIOS.map((scenario) => scenario.id))('round-trips the %s preset', (id) => {
    const settings = getScenario(id).settings;
    expect(parse(serializeSettings(settings))).toEqual(settings);
    expect(matchScenario(settings)).toBe(id);
  });

  it('applies overrides on top of a preset', () => {
    expect(parse('scenario=slow&role=viewer')).toEqual({
      ...getScenario('slow').settings,
      role: 'viewer',
    });
  });

  it('ignores invalid values and clamps latency', () => {
    expect(parse('scenario=nope&role=root&plan=gold&latency=abc')).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(parse('latency=999999').latencyMs).toBe(15_000);
  });

  it('serializes custom settings minimally', () => {
    const custom = { ...DEFAULT_SETTINGS, latencyMs: 4_000, failure: 'always' } as const;
    expect(matchScenario(custom)).toBeNull();
    expect(serializeSettings(custom)).toBe('latency=4000&failure=always');
    expect(parse(serializeSettings(custom))).toEqual(custom);
  });

  it('builds hrefs without a dangling question mark', () => {
    expect(hrefFor('/lab/react/', DEFAULT_SETTINGS)).toBe('/lab/react/');
    expect(hrefFor('/lab/react/', getScenario('error').settings)).toBe(
      '/lab/react/?scenario=error',
    );
  });
});
