import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import scenario from '../scenario/scenario.json';
import type { StageProps } from './types';
import { Counter, DeepDive, Head, Win } from '../components/ui';

const AU = scenario.audience;
const TABS = ['Use case 1: brand team builds a micro segment', 'Use case 2: follow up while interest is fresh'];
const STEP_MS = 700;
// Build order: four includes, the OR group as one step, then the two exclusions.
const COUNTS = [...AU.include.map(r => r[3] as number), AU.orGroup.count, ...AU.exclude.map(r => r[3] as number)];
export const MICRO_FINAL = COUNTS[COUNTS.length - 1];

const SourceTag = ({ kind, label }: { kind: string; label: string }) => (
  <span className={`tag ${kind === 'snowflake' ? 'blue' : 'd360'}`} style={{ fontSize: 11.5 }}>{label}</span>
);

export function Audiences({ local, deep, consent }: StageProps) {
  const [tab, setTab] = useState(local);
  useEffect(() => setTab(local), [local]);
  return (
    <>
      <Head
        title={tab === 0 ? 'A micro segment in *five minutes*' : 'In the audience *two minutes* later'}
        sub="A segment is a saved rule set run against every unified profile. Two ways a brand team uses them."
      />
      <div className="seg light" role="group" aria-label="Use case" style={{ justifySelf: 'start' }}>
        {TABS.map((t, i) => <button key={t} aria-pressed={tab === i} onClick={() => setTab(i)}>{t}</button>)}
      </div>
      {tab === 0 ? <MicroSegment deep={deep} /> : <RealTime consent={consent} />}
      {tab === 1 && (
        <DeepDive show={deep} title="how the real-time audience runs">
          <p>A real-time segment on streamed web events, evaluated within seconds. It feeds an email follow-up, so it also requires email consent.</p>
        </DeepDive>
      )}
    </>
  );
}

/* Use case 1: conditions appear one at a time as a logic tree; the count falls after each. */
function MicroSegment({ deep }: { deep: boolean }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? COUNTS.length : 0);
  useEffect(() => {
    if (n >= COUNTS.length) return;
    const t = setTimeout(() => setN(x => x + 1), n === 0 ? 300 : STEP_MS);
    return () => clearTimeout(t);
  }, [n]);
  const count = n === 0 ? AU.start : COUNTS[n - 1];
  const shown = (i: number) => n > i;
  const Row = ({ i, label, kind, src, children }: { i: number; label: string; kind: string; src: string; children?: ReactNode }) => (
    <motion.div className="cond" initial={false} animate={{ opacity: shown(i) ? 1 : 0.25, x: shown(i) ? 0 : -6 }} transition={{ duration: 0.3 }}>
      <span>{label}{children}</span>
      <SourceTag kind={kind} label={src} />
      <span className="mono cond-count">{shown(i) ? COUNTS[i].toLocaleString('en-US') : ''}</span>
    </motion.div>
  );
  const inc = AU.include.length, orI = inc, exI = inc + 1;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="split" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.65fr) minmax(280px, 1fr)', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <Win name={`Segment: ${AU.name}`} right={`Built by ${AU.owner}`}>
            <div className="logic">
              <span className="logic-label">INCLUDE all of</span>
              {AU.include.map(([label, kind, src], i) => <Row key={label as string} i={i} label={label as string} kind={kind as string} src={src as string} />)}
              <motion.div className="logic-or" initial={false} animate={{ opacity: shown(orI) ? 1 : 0.25 }} transition={{ duration: 0.3 }}>
                <span className="logic-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ANY of <span className="tag" style={{ fontSize: 11 }}>OR</span></span>
                  <span className="mono cond-count">{shown(orI) ? AU.orGroup.count : ''}</span>
                </span>
                {AU.orGroup.items.map(([label, kind, src]) => (
                  <div key={label} className="cond"><span>{label}</span><SourceTag kind={kind} label={src} /><span /></div>
                ))}
              </motion.div>
            </div>
            <div className="logic exclude">
              <span className="logic-label">EXCLUDE any of</span>
              {AU.exclude.map(([label, kind, src], i) => <Row key={label as string} i={exI + i} label={label as string} kind={kind as string} src={src as string} />)}
            </div>
            {deep && <code className="mono" style={{ fontSize: 12, color: 'var(--purple)', overflowWrap: 'anywhere' }}>{AU.expression}</code>}
          </Win>
          <div className="legend">
            <button className="btn" onClick={() => setN(0)}>Rebuild step by step</button>
            <span><SourceTag kind="snowflake" label="Snowflake" /> computed in Snowflake</span>
            <span><SourceTag kind="d360" label="Data 360" /> live in Data 360</span>
          </div>
        </div>
        <Win name="Result" right="Ready to activate">
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><Counter value={count} className="big" /><span className="muted">oncologists</span></span>
          <span className="muted" style={{ fontSize: 13.5 }}>Size check by channel</span>
          <table className="dt" style={{ marginTop: -4 }}>
            <tbody>
              {AU.sizeCheck.map(([ch, ok, why]) => (
                <tr key={ch as string}>
                  <td style={{ width: 90 }}>{ch}</td>
                  <td style={{ width: 24, color: ok ? 'var(--ok)' : 'var(--magenta)', fontWeight: 700 }}>{ok ? '✓' : '✗'}</td>
                  <td className="muted" style={{ fontSize: 13.5 }}>{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AU.governance.map(([k, v]) => <span key={k} className="tag">{k}: {v}</span>)}
          </div>
          <span style={{ fontSize: 14 }}>{AU.builtLine}</span>
          {deep && <span className="muted" style={{ fontSize: 13.5 }}>{AU.techNote}</span>}
        </Win>
      </div>
    </div>
  );
}

/* Use case 2: a streamed download puts her in a real-time audience within minutes. */
function RealTime({ consent }: { consent: boolean }) {
  const rt = AU.rt;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="legend"><span className="tag alert">{rt.event}</span><span style={{ color: 'var(--ink)' }}>{rt.eventText}</span></div>
      <div className="split" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)', alignItems: 'start' }}>
        <Win name="Real-time segment" right={rt.name} flush>
          <table className="dt">
            <thead><tr><th>Rule</th><th>{scenario.hcp.short}</th><th style={{ width: 50 }}></th></tr></thead>
            <tbody>
              {rt.rules.map(([label, val], i) => {
                const fails = label === 'Email consent is yes' && !consent;
                return (
                  <motion.tr key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }}>
                    <td>{label}</td><td className="v">{fails ? 'No' : val}</td>
                    <td style={{ color: fails ? 'var(--magenta)' : 'var(--ok)', fontWeight: 600 }}>{fails ? '✕' : '✓'}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </Win>
        <Win name={consent ? 'Entered the audience' : 'Not entered'} right="Data 360">
          <span className="big" style={{ color: consent ? 'var(--blue)' : 'var(--faint)' }}>{consent ? '2 min' : 'No'}</span>
          <span className="muted" style={{ fontSize: 14 }}>{consent ? 'from download to audience' : 'no email consent, so no email follow-up'}</span>
          {consent && (
            <div className="mini-timeline">
              {rt.timeline.map(([t, what], i) => (
                <span key={t} style={{ display: 'contents' }}>
                  <span className="mt-step"><b className="mono">{t}</b><span>{what}</span></span>
                  {i < rt.timeline.length - 1 && <span className="flow-arrow" aria-hidden>→</span>}
                </span>
              ))}
            </div>
          )}
          <dl className="fields" style={{ gridTemplateColumns: '150px 1fr', marginTop: 6 }}>
            <dt>Interests</dt><dd style={{ fontFamily: 'var(--font)', fontSize: 14 }}>Efficacy, Side effects (new)</dd>
            <dt>Matches call note</dt><dd style={{ fontFamily: 'var(--font)', fontSize: 14 }}>Yes: side effect management</dd>
            <dt>Snowflake alone</dt><dd style={{ fontFamily: 'var(--font)', fontSize: 14 }}>Tomorrow, around 6:00, after the nightly batch</dd>
            <dt>Why it is fast</dt><dd style={{ fontFamily: 'var(--font)', fontSize: 14 }}>Her device is already in the Snowflake crosswalk.</dd>
          </dl>
        </Win>
      </div>
    </div>
  );
}
