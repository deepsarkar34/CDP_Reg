import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import scenario from '../scenario/scenario.json';
import type { StageProps } from './types';
import { Head, Reveal, Win } from '../components/ui';

const CX = 340, CY = 170;
const FROM = 'from Snowflake crosswalk';
interface Node { x: number; y: number; k: string; val: string; device?: boolean }
const NODES: Node[] = [
  { x: 140, y: 60, k: 'Golden ID', val: scenario.hcp.goldenId },
  { x: 540, y: 60, k: 'Email', val: 'lena.ortiz@houstononc.org' },
  { x: 540, y: 280, k: 'SFMC subscriber', val: 'SUB-77310' },
  { x: 140, y: 280, k: 'Veeva CRM ID', val: '0013A00001xYz' },
  { x: 340, y: 335, k: 'Web device', val: '7f3a…', device: true },
];
const ACTIVITY = ['Day 1: downloaded efficacy summary', 'Day 1: dosing page', 'Day 1: efficacy page'];
const ARRIVES = ['Golden record', 'Crosswalk', 'Scores', 'Call note topics'];

/** Beats: 0 what arrives and the one-rule ruleset, 1 her unified profile, 2 Day 4 device link. */
export function Profile({ local, deep }: StageProps) {
  const reduced = useReducedMotion();
  const [linked, setLinked] = useState(local >= 2);
  useEffect(() => setLinked(local >= 2), [local]);
  const showProfile = local >= 1;
  return (
    <>
      <Head
        title="Snowflake decided who she is. Data 360 *acts on it*."
        sub="The resolved identity arrives through Zero Copy. Data 360 adds live behaviour and keeps her profile current."
      />
      <div className="flow4">
        <Win name="Arrives from Snowflake" right="Zero Copy">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{ARRIVES.map(a => <span key={a} className="tag blue">{a}</span>)}</div>
        </Win>
        <span className="flow-arrow" aria-hidden>→</span>
        <Win name="Mapped to the Data 360 data model">
          <span style={{ fontSize: 14 }}>Golden ID, identifiers, scores and topics land in the standard individual and party identifier objects.</span>
        </Win>
        <span className="flow-arrow" aria-hidden>→</span>
        <Win name="Identity ruleset: one rule" style={{ borderColor: 'var(--blue-bright)' }}>
          <span style={{ fontWeight: 600 }}>Same golden ID = same profile.</span>
          <span className="muted" style={{ fontSize: 13.5 }}>Pass-through: no matching in Data 360.</span>
          {deep && <span className="mono" style={{ fontSize: 12, color: 'var(--purple)' }}>Ruleset: HCP_Golden_ID. Rule 1: Party Identifier (Golden ID), exact.</span>}
        </Win>
        <span className="flow-arrow" aria-hidden>→</span>
        <Win name="Unified profile" right={linked ? '5 identifiers' : '4 identifiers'}>
          <span style={{ fontSize: 14 }}>One profile per golden ID, kept current with live behaviour.</span>
        </Win>
      </div>

      <Reveal when={showProfile}>
        <div className="split" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', alignItems: 'start' }}>
          <svg viewBox="0 0 680 370" role="img" aria-label="Unified profile with identifiers from the Snowflake crosswalk" style={{ width: '100%', height: 'auto', maxHeight: 340, display: 'block' }}>
            <defs>
              <linearGradient id="hub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3783C2" /><stop offset=".55" stopColor="#7167B8" /><stop offset="1" stopColor="#DC1380" /></linearGradient>
            </defs>
            {NODES.map(n => {
              const pending = n.device && !linked;
              const mx = (CX + n.x) / 2, my = (CY + n.y) / 2;
              return (
                <motion.g key={n.k} initial={false} animate={{ opacity: 1 }}>
                  <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={pending ? 'var(--line-2)' : 'var(--blue-bright)'} strokeWidth={pending ? 1.5 : 2} strokeDasharray={pending ? '6 6' : '0'} />
                  <rect x={mx - 74} y={my - 11} width={148} height={22} rx={11} fill="var(--surface)" stroke="var(--line)" />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fill="var(--muted)">{pending ? 'not in crosswalk yet' : FROM}</text>
                  <motion.rect x={n.x - 132} y={n.y - 26} width={264} height={52} rx={10} fill="var(--surface)"
                    stroke={pending ? 'var(--line-2)' : 'var(--blue-bright)'} strokeWidth={1.3} strokeDasharray={pending ? '4 4' : '0'}
                    animate={n.device && linked && !reduced ? { scale: [1, 1.07, 1] } : {}} transition={{ duration: 0.5 }} style={{ transformOrigin: `${n.x}px ${n.y}px` }} />
                  <text x={n.x} y={n.y - 6} textAnchor="middle" fontSize={12} fill="var(--muted)">{n.k}</text>
                  <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize={12.5} fill="var(--ink)" style={{ fontFamily: 'var(--mono)' }}>{n.val}</text>
                </motion.g>
              );
            })}
            {ACTIVITY.map((_, i) => {
              const ox = 310 + i * 30, oy = 369;
              return (
                <motion.circle key={i} r={6} fill="#DC1380" initial={false}
                  animate={linked ? { cx: CX, cy: CY, opacity: [1, 1, 0] } : { cx: ox, cy: oy - 0, opacity: 1 }}
                  transition={{ duration: linked && !reduced ? 0.9 : 0, delay: linked && !reduced ? 0.3 + i * 0.08 : 0 }} />
              );
            })}
            <circle cx={CX} cy={CY} r={56} fill="url(#hub)" />
            <text x={CX} y={CY - 4} textAnchor="middle" fontSize={15} fontWeight={600} fill="#fff">{scenario.hcp.short}</text>
            <text x={CX} y={CY + 15} textAnchor="middle" fontSize={11.5} fill="#fff" opacity={0.85}>{scenario.hcp.goldenId}</text>
          </svg>
          <div style={{ display: 'grid', gap: 12 }}>
            <Win name="HCP website activity" right={linked ? 'on her profile' : 'anonymous'} flush>
              <table className="dt">
                <tbody>
                  {ACTIVITY.map(p => (
                    <tr key={p}><td>{p}</td><td style={{ textAlign: 'right' }}><span className={`tag ${linked ? 'blue' : ''}`} style={{ fontSize: 11.5 }}>{linked ? scenario.hcp.short : 'Device 7f3a…'}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </Win>
            <button className={`btn ${linked ? '' : 'primary'}`} style={{ justifySelf: 'start' }} onClick={() => setLinked(x => !x)}>
              {linked ? 'Reset: before Day 4' : "Day 4: Snowflake's nightly identity run adds the device"}
            </button>
            <span className="muted" style={{ fontSize: 13.5 }}>Known devices attach to her profile within seconds. A brand-new device waits for Snowflake's next identity run.</span>
          </div>
        </div>
      </Reveal>

      <Reveal when={showProfile} delay={0.2}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {scenario.insights.map(([k, val, src]) => {
            const interests = k === 'Interests';
            return (
              <div key={k} className="win" style={{ padding: '12px 14px', gap: 4 }}>
                <span className="muted" style={{ fontSize: 13 }}>{k}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: interests && !linked ? 'var(--faint)' : undefined }}>{interests ? (linked ? 'Efficacy' : 'None yet') : val}</span>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>{interests ? (linked ? 'Streaming insight' : 'Waiting for the device') : src}</span>
              </div>
            );
          })}
        </div>
      </Reveal>
    </>
  );
}
