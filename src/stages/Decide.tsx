import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import scenario from '../scenario/scenario.json';
import type { StageProps } from './types';
import { DeepDive, Head, Win } from '../components/ui';
import { useDemo } from '../store';
import { OPTIONS, allowedOptions, blockedReasons, boxActive, chooseAction, playOrder } from '../decision';

const STEP_MS = 1200;
const D = scenario.decide;
const SHORT: Record<string, string> = { guide: 'guide email', visit: 'rep visit', webinar: 'nurse webinar', efficacy: 'efficacy email', msl: 'MSL outreach' };
const WHY: Record<string, string> = { efficacy: 'she already has it', msl: 'no medical request' };

/** Step 05: four boxes play in turn (inputs, rules, ML, Cortex); the decision table and output follow. */
export function Decide({ local, consent, deep }: StageProps) {
  const { mode, setMode, sub, subPlaying, setSub } = useDemo();
  const reduced = useReducedMotion();
  const order = playOrder(mode);
  const last = order[order.length - 1];
  const ml = mode === 'ml';

  // Play the strip on entering the step or switching mode; a chip clicked on the map is honoured once.
  useEffect(() => {
    if (local >= 1 || reduced) { setSub(4, false); return; }
    const req = useDemo.getState().subRequest;
    if (req && boxActive(req, mode)) {
      setSub(req, true);
      const t = setTimeout(() => useDemo.getState().requestSub(null), 0);
      return () => clearTimeout(t);
    }
    setSub(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, mode, reduced]);

  useEffect(() => {
    if (!subPlaying) return;
    const nextBox = order.find(b => b > sub);
    const t = setTimeout(() => (nextBox ? setSub(nextBox, true) : setSub(sub, false)), sub === 0 ? 400 : STEP_MS);
    return () => clearTimeout(t);
  }, [sub, subPlaying, order, setSub]);

  const outRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (local >= 1) setTimeout(() => outRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 350); }, [local, mode, reduced]);

  const finished = sub >= last;
  const pick = chooseAction(mode, consent);
  const allowed = allowedOptions(consent);
  const blocked = OPTIONS.filter(o => blockedReasons(o, consent).length > 0);
  const ranked = [...allowed].sort((a, b) => (b.response ?? 0) - (a.response ?? 0));
  const cortex = consent ? D.cortex : D.cortexNoConsent;
  const shown = (box: number) => boxActive(box, mode) && sub >= box;

  const boxes = [
    { n: 1, title: '① Inputs', foot: 'from step 04', body: (
      <ul className="box-list">
        <li>Priority score 0.81</li><li>Call note topic: side effects</li>
        <li>Email consent: {consent ? 'yes' : <b style={{ color: 'var(--magenta)' }}>no</b>}</li><li>Last rep visit 45 days ago</li>
      </ul>) },
    { n: 2, title: '② Rules', foot: 'SQL rules: what is allowed', body: (
      <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
        <span><b>Blocks:</b> {blocked.map(o => `${SHORT[o.id]} (${WHY[o.id] ?? 'no email consent'})`).join(', ')}</span>
        <span><b>Allows:</b> {allowed.map(o => SHORT[o.id]).join(', ')}</span>
      </div>) },
    { n: 3, title: '③ Machine learning', foot: 'Snowflake ML response model: what works best', body: ml ? (
      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Ranks what is allowed</span>
        {ranked.map((o, i) => <span key={o.id} style={{ fontWeight: i === 0 ? 700 : 400 }}>{o.name} {o.response}%</span>)}
      </div>) : <NotUsed text="Not used. The fixed brand priority list picks the nurse webinar invite." /> },
    { n: 4, title: '④ Cortex AI', foot: 'generative AI: explains it', body: ml ? (
      <span style={{ fontSize: 14, fontStyle: 'italic' }}>"{cortex}"</span>) : <NotUsed text="Not used." /> },
  ];

  return (
    <>
      <Head
        title="Snowflake picks the best next step for every doctor, *every night*"
        sub="Rules decide what's allowed. Machine learning decides what's best. Cortex AI explains it."
        meta={<><span className="tag amber">Being built</span><span className="tag">Illustrative numbers</span></>}
      />
      <div className="legend"><span className="tag amber">Trigger</span><span style={{ color: 'var(--ink)' }}>{D.trigger}</span></div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="seg light" role="group" aria-label="Decision method">
          <button aria-pressed={!ml} onClick={() => setMode('rules')}>Rules only</button>
          <button aria-pressed={ml} onClick={() => setMode('ml')}>Rules plus machine learning</button>
        </div>
        <span className="muted" style={{ fontSize: 13.5 }}>Press M to switch</span>
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setSub(0, !reduced)} disabled={subPlaying}>{subPlaying ? 'Running…' : 'Replay decision'}</button>
      </div>

      <div className="strip" role="list" aria-label="How the decision is made">
        {boxes.map((bx, i) => {
          const active = boxActive(bx.n, mode);
          const live = active && sub === bx.n && subPlaying;
          return (
            <motion.div key={bx.n} role="listitem" className={`strip-box ${live ? 'live' : ''} ${shown(bx.n) ? 'done' : ''} ${active ? '' : 'off'} ${bx.n === 4 ? 'cortex' : ''}`}
              initial={false} animate={{ opacity: shown(bx.n) || !active ? 1 : 0.3 }} transition={{ duration: 0.3 }}
              onClick={() => active && setSub(bx.n, !reduced)}>
              <span className="strip-title">{bx.title}</span>
              <div style={{ minHeight: 92 }}>{shown(bx.n) || !active ? bx.body : <span className="faint">…</span>}</div>
              <span className="strip-foot">{bx.foot}</span>
              {i < boxes.length - 1 && <span className="strip-arrow" aria-hidden>→</span>}
            </motion.div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 14 }}>Cortex AI explains the decision. Rules and Snowflake ML make it.</p>

      <div className="split" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        {D.models.map(([name, what, value], i) => (
          <div key={name} className="win" style={{ padding: '10px 14px', gap: 2, borderLeft: `3px solid ${i === 0 ? 'var(--blue-bright)' : 'var(--amber)'}` }}>
            <span style={{ fontSize: 14 }}><b>{name}</b>: <b>{what.split(' ')[0]}</b> {what.split(' ').slice(1).join(' ')}</span>
            <span className="mono" style={{ fontSize: 13, color: i === 0 ? 'var(--blue)' : 'var(--amber)' }}>{value}</span>
          </div>
        ))}
      </div>

      <Win name="Options for Dr. Ortiz" right={ml ? 'Rules, then ML ranks what is allowed' : 'Rules, then the brand priority list'} flush>
        <div style={{ overflowX: 'auto' }}>
          <table className="dt decide-table">
            <thead>
              <tr><th>Option</th><th>Pass 1 · Rules</th><th className={ml ? '' : 'struck'}>Pass 2 · ML: chance she engages</th><th className={ml ? 'struck' : ''}>Rules only rank</th><th>Decision</th></tr>
            </thead>
            <tbody>
              {OPTIONS.map(o => {
                const reasons = blockedReasons(o, consent);
                const isBlocked = reasons.length > 0;
                const ruled = sub >= 2;
                const scored = ml ? sub >= 3 : ruled;
                const chosen = finished && pick.id === o.id;
                return (
                  <tr key={o.id} className={`${isBlocked && ruled ? 'blocked' : ''} ${chosen ? 'chosen' : ''}`}>
                    <td style={{ fontWeight: 500 }}>{o.name}</td>
                    <td>{!ruled ? <span className="faint">…</span> : isBlocked
                      ? <span className="tag alert" style={{ whiteSpace: 'normal' }}>Blocked: {reasons.join('; ')}</span>
                      : <span className="tag ok">Allowed</span>}</td>
                    <td className="v">
                      {!ml ? <span className="faint">Not used</span> : isBlocked && ruled ? <span className="faint">–</span> : !scored ? <span className="faint">…</span> : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 70, height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden', display: 'inline-block' }}>
                            <motion.span initial={reduced ? false : { width: 0 }} animate={{ width: `${((o.response ?? 0) / 40) * 100}%` }} transition={{ duration: 0.5 }}
                              style={{ display: 'block', height: '100%', background: 'var(--grad)' }} />
                          </span>{o.response}%
                        </span>
                      )}
                    </td>
                    <td className="v">{ml ? <span className="faint">Not used</span> : isBlocked && ruled ? <span className="faint">–</span> : !scored ? <span className="faint">…</span> : `Priority ${o.rank}`}</td>
                    <td>{chosen && <motion.span initial={reduced ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="tag solid">Chosen</motion.span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Win>

      {local >= 1 && finished && (
        <div ref={outRef} style={{ display: 'grid', gap: 8 }}>
          {ml ? <NbaCard consent={consent} pickName={pick.name} cortex={cortex} /> : <RulesOutput pickName={pick.name} />}
          <span className="muted" style={{ fontSize: 14 }}>{D.nba.note}</span>
        </div>
      )}

      <DeepDive show={deep} title="rules and response model">
        <pre className="mono" style={{ margin: 0, fontSize: 12.5, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', overflowX: 'auto' }}>{D.sql}</pre>
        <p>{D.modelLine}</p>
      </DeepDive>

      <div className="legend" style={{ gap: 8 }}>
        <span className="tag">Golden record</span><span>+</span><span className="tag">Crosswalk</span><span>+</span><span className="tag">Priority score</span><span>+</span>
        <span className="tag">Call note topics</span><span>+</span><span className="tag amber">NBA.RECOMMENDATIONS</span><span>→</span>
        <span className="tag blue">Zero Copy</span><span>→</span><span className="tag blue">Data 360, no pipeline, no copy</span>
      </div>
    </>
  );
}

function NotUsed({ text }: { text: string }) {
  return <span className="faint" style={{ fontSize: 14 }}>{text}</span>;
}

function NbaCard({ consent, pickName, cortex }: { consent: boolean; pickName: string; cortex: string }) {
  const n = D.nba;
  const rows: [string, string][] = consent
    ? [['Next best action', n.action], ['Channel', n.channel], ['When', n.when], ['Next best experience', n.nbe], ['Reason for the rep (written by Cortex AI)', cortex], ['Refreshed', n.refreshed]]
    : [['Next best action', pickName], ['Channel', 'rep alert in CRM'], ['When', 'within 7 days'], ['Next best experience', 'rep visit with nurse resources; email touches skipped without consent'], ['Reason for the rep (written by Cortex AI)', cortex], ['Refreshed', n.refreshed]];
  return (
    <Win name={`${n.table} for ${scenario.hcp.goldenId}`} right="Snowflake" style={{ borderColor: 'var(--amber)' }} flush>
      <table className="dt">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ background: k === 'Next best action' ? 'var(--amber-soft)' : undefined }}>
              <td className="muted" style={{ width: 260 }}>{k}</td>
              <td style={{ fontWeight: k === 'Next best action' ? 600 : 400, fontStyle: k.startsWith('Reason') ? 'italic' : undefined }}>{k.startsWith('Reason') ? `"${v}"` : v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Win>
  );
}

function RulesOutput({ pickName }: { pickName: string }) {
  return (
    <Win name="What gets sent" right="Rules only">
      <span style={{ fontWeight: 600, fontSize: 18 }}>{pickName}</span>
      <dl className="fields" style={{ gridTemplateColumns: '60px 1fr' }}>
        <dt>Why</dt><dd style={{ fontFamily: 'var(--font)', fontSize: 14 }}>Fixed brand priority list{pickName.includes('webinar') ? ': webinars first' : ', top allowed option'}</dd>
      </dl>
      <div className="note-line">No model and no Cortex explanation. Each rule fires on its own and nothing plans the next touch.</div>
    </Win>
  );
}

