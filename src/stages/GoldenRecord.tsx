import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import scenario from '../scenario/scenario.json';
import type { StageProps } from './types';
import { DeepDive, Head, Win } from '../components/ui';
import { AiDeepDive, AiTabs } from './AiMl';

const ID = scenario.identity;
const VIEWS = ['1 Match', '2 Golden record and crosswalk', '3 AI and ML'];
const RULE_MS = 1100;
const SHORT: Record<string, string> = { crm: 'Veeva', rx: 'IQVIA', claims: 'Claims', sfmc: 'SFMC', ref: 'OneKey', match: 'Snowflake', web: 'Web' };

/** Beats: 0 match, 1 golden record and crosswalk, 2 to 4 the AI and ML tabs. */
export function GoldenRecord({ local, deep }: StageProps) {
  const beatView = local === 0 ? 0 : local === 1 ? 1 : 2;
  const [view, setView] = useState(beatView);
  useEffect(() => setView(beatView), [beatView]);
  return (
    <>
      <Head
        title="One doctor, decided once, in *Snowflake*"
        sub="Matching rules, a golden record and a crosswalk of every identifier, with AI and ML built on top."
        meta={<span className="tag">{scenario.hcp.goldenId}</span>}
      />
      <div className="seg light" role="group" aria-label="Golden record creation" style={{ justifySelf: 'start' }}>
        {VIEWS.map((t, i) => <button key={t} aria-pressed={view === i} onClick={() => setView(i)}>{t}</button>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gap: 16 }}>
          {view === 0 && <Match deep={deep} />}
          {view === 1 && <Crosswalk />}
          {view === 2 && <AiTabs index={Math.max(0, local - 2)} />}
        </motion.div>
      </AnimatePresence>
      <div className="legend" style={{ gap: 8 }}>
        <span className="tag">Golden record</span><span>+</span><span className="tag">Crosswalk</span><span>+</span><span className="tag">Priority score</span><span>+</span><span className="tag">Call note topics</span><span>→</span>
        <span className="tag amber">Step 05 Decide</span>
      </div>
      {view === 2 && <AiDeepDive show={deep} />}
      {view === 1 && (
        <DeepDive show={deep} title="survivorship">
          <p>Name, specialty and practice from OneKey; email by recency; Rx fields from IQVIA only. The crosswalk keeps every identifier with the rule that linked it, so any link can be audited or reversed.</p>
        </DeepDive>
      )}
    </>
  );
}

/* 4a: four exact rules run in turn and link each clean record to the golden ID. */
function Match({ deep }: { deep: boolean }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? ID.rules.length : 0);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (n >= ID.rules.length) return;
    const t = setTimeout(() => setN(x => x + 1), n === 0 ? 500 : RULE_MS);
    return () => clearTimeout(t);
  }, [n]);
  const linkedBy = (src: string) => ID.rules.findIndex(r => r.sources.includes(src));
  // The rule in focus: the one hovered, otherwise the one that just lit up during the animation.
  const focus = n > 0 ? n - 1 : null;
  const animating = n < ID.rules.length;
  const active = hover ?? (animating ? focus : null);
  return (
    <>
      <div className="split" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(300px, 1fr) minmax(0, 1.6fr)', alignItems: 'start' }}>
        <Win name="Her records after cleaning" right="Linked by" flush>
          <table className="dt">
            <tbody>
              {scenario.matchSources.map(([id, name, matched]) => {
                const r = linkedBy(id);
                const on = r >= 0 && r < n;
                const hl = active === r;
                return (
                  <motion.tr key={id} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} initial={false}
                    animate={{ backgroundColor: hl ? 'var(--blue-soft)' : on ? 'var(--ok-soft)' : 'rgba(0,0,0,0)' }} transition={{ duration: 0.3 }}>
                    <td><span style={{ fontWeight: 500 }}>{name}</span>
                      <span className={`mono matched ${hl ? 'hl' : ''}`} style={{ display: 'block', fontSize: 12 }}>{matched}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {on && <motion.span initial={reduced ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="tag ok" style={{ fontSize: 11.5 }}>{ID.rules[r].id} → {scenario.hcp.goldenId}</motion.span>}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </Win>
        <div style={{ display: 'grid', gap: 8 }}>
          {ID.rules.map((r, i) => {
            const done = i < n, live = i === n - 1 && animating, hl = active === i;
            return (
              <motion.div key={r.id} className={`pipe-step ${done ? 'done' : ''} ${live ? 'live' : ''}`} initial={false} animate={{ opacity: done ? 1 : 0.45 }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                style={{ cursor: 'default', gridTemplateColumns: '44px 1fr auto' }}>
                <span className="num" style={{ fontSize: 20, gridRow: 'span 2' }}>{r.id}</span>
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <span className={`tag mono matched ${hl ? 'hl' : ''}`} style={{ gridRow: 'span 2', alignSelf: 'center', fontSize: 11.5 }}>{r.example}</span>
                <span className="muted" style={{ fontSize: 13 }}>Links: {r.links}</span>
              </motion.div>
            );
          })}
          <div className="legend" style={{ marginTop: 2 }}>
            <button className="btn" onClick={() => setN(0)} disabled={animating}>Replay rules</button>
            <span className="muted" style={{ fontSize: 13.5 }}>Runs in Snowflake. Data 360 does no matching. Hover a record or rule to see what matched.</span>
          </div>
        </div>
      </div>
      <div className="note-line" style={{ fontSize: 14 }}>{ID.stewardNote}</div>
      <DeepDive show={deep} title="rule R3 in Snowflake SQL">
        <pre className="mono" style={{ margin: 0, fontSize: 12.5, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', overflowX: 'auto' }}>{ID.r3Sql}</pre>
      </DeepDive>
    </>
  );
}

/* 4b: the golden record and the crosswalk of every identifier. */
function Crosswalk() {
  return (
    <>
      <div className="split" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 8 }}>
        <Win name="Golden record" right="gold.hcp" flush>
          <table className="dt">
            <tbody>
              {scenario.golden.map(([k, val, srcs]) => {
                const isId = k === 'Golden ID';
                return (
                  <tr key={k as string}>
                    <td className="muted" style={{ width: 150 }}>{k}</td>
                    <td className="v" style={isId ? { fontSize: 17, fontWeight: 500, color: 'var(--blue)' } : undefined}>{val}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
                        {(srcs as string[]).map(s => <span key={s} className={`tag ${isId ? 'solid' : ''}`} style={{ fontSize: 11 }}>{SHORT[s]}</span>)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Win>
        <span className="muted" style={{ fontSize: 14 }}>Who she is: one trusted version, decided once. Her HCP 360 is built on this in step 06.</span>
        </div>
        <Win name="IDENTITY.CROSSWALK" right={`${ID.crosswalk.length} identifiers`} flush>
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead><tr><th>Golden ID</th><th>Identifier type</th><th>Identifier</th><th>Source</th><th>Linked by</th></tr></thead>
              <tbody>
                {ID.crosswalk.map(([g, type, value, src, rule], i) => (
                  <motion.tr key={type} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
                    <td className="v">{g}</td><td>{type}</td><td className="v">{value}</td><td className="muted">{src}</td><td><span className="tag">{rule}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Win>
      </div>
      <Win name="Single source of identity truth" style={{ borderColor: 'var(--blue-bright)' }}>
        <span style={{ fontWeight: 600 }}>Snowflake is the single source of identity truth. Data 360 never re-decides who she is.</span>
      </Win>
    </>
  );
}
