import { beforeEach, describe, expect, it } from 'vitest';
import { BEATS, STEPS, firstBeatOf } from './beats';
import { channelCounts, useDemo } from './store';
import scenario from './scenario/scenario.json';
import { allowedOptions, blockedReasons, chooseAction, playOrder, OPTIONS } from './decision';

beforeEach(() => useDemo.getState().reset());

describe('beat engine', () => {
  it('has nine steps, with Decide as step 05 in the Snowflake zone', () => {
    expect(STEPS.map(s => s.id)).toEqual(['hook', 'capture', 'clean', 'golden', 'decide', 'profile', 'audiences', 'activate', 'learn']);
    expect(STEPS[4].zone).toBe('engineering');
    expect(STEPS.filter(s => s.zone === 'engineering').map(s => s.id)).toEqual(['clean', 'golden', 'decide']);
    expect(BEATS).toHaveLength(STEPS.reduce((a, s) => a + s.notes.length, 0));
  });

  it('never moves past the first or last beat', () => {
    useDemo.getState().prev();
    expect(useDemo.getState().beat).toBe(0);
    for (let i = 0; i < BEATS.length + 5; i++) useDemo.getState().next();
    expect(useDemo.getState().beat).toBe(BEATS.length - 1);
  });

  it('jumps to the first beat of a step', () => {
    useDemo.getState().jumpStep(4);
    expect(BEATS[useDemo.getState().beat]).toMatchObject({ step: 4, local: 0 });
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

  it('micro segment includes the next best action and falls 4,120 to 23', () => {
    const A = scenario.audience;
    const counts = [...A.include.map(r => r[3]), A.orGroup.count, ...A.exclude.map(r => r[3])];
    expect(counts).toEqual([4120, 412, 118, 74, 47, 34, 27, 23]);
    expect(A.include.find(r => r[1] === 'decision')?.[0]).toBe('Next best action is "Side effect guide email"');
  });

  it('golden record card holds identity facts only; Rx decile, last rep visit and NBA are on the profile', () => {
    expect(scenario.golden.map(g => g[0])).toEqual(['Golden ID', 'NPI', 'Name', 'Specialty', 'Practice', 'Email on file']);
    const tiles = scenario.insights.map(i => i[0]);
    expect(tiles).toEqual(expect.arrayContaining(['Priority score', 'Last rep visit', 'Rx decile', 'Next best action']));
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

describe('Decide in Snowflake: rules, ML, Cortex', () => {
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

  it('the strip plays inputs, rules, ML, Cortex; rules only stops after rules', () => {
    expect(playOrder('ml')).toEqual([1, 2, 3, 4]);
    expect(playOrder('rules')).toEqual([1, 2]);
  });

  it('Cortex explains the chosen action and never changes it', () => {
    expect(scenario.decide.cortex).toContain('Send the side effect guide');
    expect(chooseAction('ml', true).name).toBe(scenario.decide.nba.action);
  });
});
