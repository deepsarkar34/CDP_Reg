import { beforeEach, describe, expect, it } from 'vitest';
import { BEATS, STEPS, firstBeatOf } from './beats';
import { channelCounts, useDemo } from './store';
import scenario from './scenario/scenario.json';
import { allowedOptions, blockedReasons, chooseAction, playOrder, OPTIONS } from './decision';

beforeEach(() => useDemo.getState().reset());

describe('beat engine', () => {
  it('has nine steps in the order of the identity-in-Snowflake story', () => {
    expect(STEPS.map(s => s.id)).toEqual(['hook', 'capture', 'clean', 'golden', 'profile', 'audiences', 'decide', 'activate', 'learn']);
    expect(BEATS).toHaveLength(STEPS.reduce((a, s) => a + s.notes.length, 0));
  });

  it('never moves past the first or last beat', () => {
    useDemo.getState().prev();
    expect(useDemo.getState().beat).toBe(0);
    for (let i = 0; i < BEATS.length + 5; i++) useDemo.getState().next();
    expect(useDemo.getState().beat).toBe(BEATS.length - 1);
  });

  it('jumps to the first beat of a step', () => {
    useDemo.getState().jumpStep(6);
    expect(BEATS[useDemo.getState().beat]).toMatchObject({ step: 6, local: 0 });
    expect(firstBeatOf(8)).toBeGreaterThan(0);
  });
});

describe('scenario numbers (illustrative, from the brief)', () => {
  it('opens with six fragments, one per system, and eight records in six systems', () => {
    expect(scenario.hookFragments).toHaveLength(6);
    expect(new Set(scenario.hookFragments.map(f => f[0])).size).toBe(6);
    expect(scenario.sources).toHaveLength(6);
    expect(scenario.sources.reduce((a, s) => a + s.records, 0)).toBe(8);
  });

  it('micro segment counts fall 4,120 to 23 in build order', () => {
    const A = scenario.audience;
    const counts = [...A.include.map(r => r[3]), A.orGroup.count, ...A.exclude.map(r => r[3])];
    expect(counts).toEqual([4120, 412, 118, 61, 38, 29, 23]);
  });

  it('identity is decided in Snowflake: four rules and six crosswalk identifiers for HCP-00731', () => {
    expect(scenario.identity.rules.map(r => r.id)).toEqual(['R1', 'R2', 'R3', 'R4']);
    expect(scenario.identity.crosswalk).toHaveLength(6);
    scenario.identity.crosswalk.forEach(r => expect(r[0]).toBe('HCP-00731'));
  });

  it('activation reaches SFMC 21 (20 without her consent) and rep 23, never more than the audience', () => {
    expect(channelCounts(true)).toMatchObject({ email: 21, crm: 23, media: 0 });
    expect(channelCounts(false).email).toBe(20);
    Object.values(channelCounts(true)).forEach(n => expect(n).toBeLessThanOrEqual(23));
  });

  it('holds back 34 of the 342-oncologist programme and shows a 19-point lift', () => {
    expect(Math.round(scenario.learn.programmeSize * scenario.learn.holdoutShare)).toBe(34);
    expect(scenario.learn.engagedContacted - scenario.learn.engagedHoldout).toBe(19);
  });
});

describe('decision layer: two passes', () => {
  it('pass 1 blocks the efficacy email and MSL outreach', () => {
    expect(allowedOptions(true).map(o => o.id)).toEqual(['guide', 'visit', 'webinar']);
  });

  it('rules plus ML picks the side effect guide email (34%), rules only picks the webinar (priority 1)', () => {
    expect(chooseAction('ml', true).id).toBe('guide');
    expect(chooseAction('rules', true).id).toBe('webinar');
  });

  it('with email consent off, both modes fall back to the rep visit', () => {
    expect(blockedReasons(OPTIONS.find(o => o.id === 'guide')!, false)).toContain('No email consent');
    expect(chooseAction('ml', false).id).toBe('visit');
    expect(chooseAction('rules', false).id).toBe('visit');
  });

  it('rules only skips pass 2', () => {
    expect(playOrder('rules')).toEqual([1]);
    expect(playOrder('ml')).toEqual([1, 2]);
  });
});
