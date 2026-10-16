import { describe, expect, it } from 'vitest';
import '../../src/spec/i18n/all';
import { getMessages, LOCALES } from '../../src/spec/i18n';
import { SCENARIO_IDS } from '../../src/spec/scenarios';
import {
  SPEECH_SCRIPTS,
  speechScript,
  type StepTranscript,
} from '../../src/spec/speech-script';

const en = getMessages('en').dashboard;
const shape = (script: readonly StepTranscript[]) =>
  script.map((step) => ({
    action: step.action,
    heard: step.heard.map((item) =>
      item.kind === 'speech'
        ? { kind: item.kind, atMs: item.atMs, politeness: item.politeness }
        : item,
    ),
  }));

describe('speech script', () => {
  it('has one transcript per scripted step, for every scenario', () => {
    for (const id of SCENARIO_IDS) {
      expect(speechScript(id, en).map((step) => step.action)).toEqual(
        SPEECH_SCRIPTS[id].map((step) => step.action),
      );
    }
  });

  it('keeps first loads quiet unless the result needs explaining', () => {
    expect(speechScript('loaded', en)[0]?.heard).toEqual([]);
    expect(speechScript('restricted', en)[0]?.heard).toEqual([]);
    expect(speechScript('empty', en)[0]?.heard).toEqual([
      {
        kind: 'speech',
        atMs: 850,
        message: en.empty.announce(en.plans.legacy),
        politeness: 'polite',
      },
    ]);
  });

  it('escalates a slow request at 3 s and 8 s, and Cancel lands focus on Load again', () => {
    const [, replay, cancel] = speechScript('slow', en);
    expect(replay?.heard.map((item) => item.kind === 'speech' && item.message)).toEqual([
      en.loading.announce,
      en.loading.slowTitle,
      `${en.loading.stalledTitle} ${en.loading.stalledBody}`,
    ]);
    expect(cancel?.heard).toEqual([
      { kind: 'focus', atMs: 0, target: 'reload' },
      { kind: 'speech', atMs: 150, message: en.cancelled.announce, politeness: 'polite' },
    ]);
  });

  it('a successful retry moves focus to the heading before announcing', () => {
    const [, retry] = speechScript('error', en);
    expect(retry?.heard.map((item) => item.kind)).toEqual(['focus', 'speech']);
  });

  it('lists everything in the order it happens', () => {
    for (const id of SCENARIO_IDS) {
      for (const step of speechScript(id, en)) {
        const times = step.heard.map((item) => item.atMs);
        expect(times).toEqual([...times].sort((a, b) => a - b));
      }
    }
  });

  it('behaves identically in every language; only the words change', () => {
    for (const locale of LOCALES) {
      for (const id of SCENARIO_IDS) {
        expect(shape(speechScript(id, getMessages(locale).dashboard))).toEqual(
          shape(speechScript(id, en)),
        );
      }
    }
  });
});
