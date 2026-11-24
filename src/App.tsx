import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type ComponentType } from 'react';
import { useDemo, currentBeat } from './store';
import { BEATS, STEPS } from './beats';
import { VENDORS } from './vendors';
import { useKeyboard, openPresenter } from './keyboard';
import scenario from './scenario/scenario.json';
import { Logo } from './components/Logo';
import { Hook } from './stages/Hook';
import { Capture } from './stages/Capture';
import { Clean } from './stages/Clean';
import { GoldenRecord } from './stages/GoldenRecord';
import { Profile } from './stages/Profile';
import { Audiences } from './stages/Audiences';
import { Decide } from './stages/Decide';
import { Activate } from './stages/Activate';
import { Learn } from './stages/Learn';
import { PASSES, isActive, decisionLabel, type Mode } from './decision';
import type { StageProps } from './stages/types';

const STAGES: ComponentType<StageProps>[] = [Hook, Capture, Clean, GoldenRecord, Decide, Profile, Audiences, Activate, Learn];
const DECIDE = 4;

// Short, factual status per step: what the systems know about her right now.
const status = (step: number, mode: Mode, consent: boolean) => {
  const pick = decisionLabel(mode, consent);
  return [
    '6 fragments, not linked yet',
    '8 records in 6 systems',
    'Records standardized, patient IDs re-tokenized',
    `Golden ID ${scenario.hcp.goldenId}, 6 identifiers in the crosswalk, priority score 0.81.`,
    mode === 'ml' && consent ? "Tonight's decision: side effect guide email (34%), then a rep visit within 7 days." : `Tonight's decision: ${pick.toLowerCase()}.`,
    'Her HCP 360: golden record, live behaviour, consent and her next best action.',
    `In ${scenario.audience.name} (23 oncologists), and in the real-time audience since 10:16.`,
    consent ? 'Guide email sent at 10:42 from the oncology brand team; rep alerted with the Cortex reason.' : 'No email without consent; rep alerted with the Cortex reason.',
    'Results back in Snowflake: +19 points versus holdout; the model retrains.',
  ][step];
};

type ZoneKey = 'sources' | 'engineering' | 'cdp' | 'channels';
const ZONES: { key: ZoneKey; steps: number[] }[] = [
  { key: 'sources', steps: [0, 1] },
  { key: 'engineering', steps: [2, 3, 4] },
  { key: 'cdp', steps: [5, 6] },
  { key: 'channels', steps: [7, 8] },
];

export default function App() {
  useKeyboard();
  const { beat, vendor, deepDive, consent, mode, sub, subPlaying, setSub, requestSub, next, prev, jumpStep, toggleDeepDive, toggleConsent } = useDemo();
  const b = currentBeat(beat);
  const v = VENDORS[vendor];
  const Stage = STAGES[b.step];
  const stepBeats = STEPS[b.step].notes.length;
  // Each step starts at the top, whatever the previous step scrolled to.
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => { stageRef.current?.scrollTo({ top: 0 }); }, [b.step]);

  return (
    <div className="app">
      <div className="chrome">
        <header className="topbar">
          <div className="brand">
            <Logo />
            <span className="divider" aria-hidden />
            <span className="title"><b>Customer data platform</b> walkthrough for {scenario.brand}</span>
          </div>
          <span className="stack-label">Snowflake + Salesforce Data 360</span>
          <button className={`tog ${deepDive ? 'on' : ''}`} onClick={toggleDeepDive} aria-pressed={deepDive}><span className="dot" />Technical <kbd>D</kbd></button>
          <button className={`tog ${consent ? '' : 'alert'}`} onClick={toggleConsent} aria-pressed={!consent}><span className="dot" />Email consent {consent ? 'on' : 'off'} <kbd>C</kbd></button>
          <button className="tog" onClick={openPresenter}>Notes <kbd>P</kbd></button>
        </header>

        <nav className="map" aria-label="Pipeline">
          {ZONES.map(z => (
            <div key={z.key} className="zone">
              <div className="zone-name" title={v.zones[z.key]}>{v.zones[z.key]}</div>
              <div className="zone-steps">
                {z.steps.map(i => {
                  const cur = i === b.step;
                  const button = (
                    <button key={i} className={`step ${i < b.step ? 'done' : ''} ${i === DECIDE ? 'decide' : ''}`} aria-current={cur ? 'step' : undefined} onClick={() => jumpStep(i)}>
                      <span className="n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="t">{STEPS[i].title}</span>
                      {i === DECIDE && <span className="building">Being built</span>}
                      {cur && <span className="prog" style={{ width: `${((b.local + 1) / stepBeats) * 100}%` }} />}
                    </button>
                  );
                  if (i !== DECIDE) return button;
                  return (
                    <div key={i} className="step-col">
                      {button}
                      <div className="subs" aria-label="Decide passes">
                        {PASSES.map(p => {
                          const active = isActive(p.n, mode);
                          const here = b.step === DECIDE;
                          const done = active && (b.step > DECIDE || (here && sub >= p.n + 1));
                          const live = active && here && sub === p.n + 1 && subPlaying;
                          return (
                            <button key={p.n} className={`sl ${done ? 'done' : ''} ${live ? 'live' : ''} ${active ? '' : 'off'}`}
                              title={`${p.n} ${p.name}${active ? '' : ' (not used in Rules only)'}`}
                              onClick={() => { if (!active) return; if (here) setSub(p.n + 1, true); else { requestSub(p.n + 1); jumpStep(DECIDE); } }}>
                              {p.n} {p.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <main ref={stageRef} className="stage" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div key={b.step} className="stage-inner"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <Stage local={b.local} v={v} deep={deepDive} consent={consent} />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="foot">
        <div className="who">
          <div className="avatar" aria-hidden>{scenario.hcp.initials}</div>
          <span><b style={{ fontWeight: 600 }}>{scenario.hcp.short}</b> <span className="muted">{status(b.step, mode, consent)}</span></span>
        </div>
        <span className="disclaimer" title={scenario.disclaimer}>Illustrative data</span>
        <div className="dots" aria-label={`Beat ${beat + 1} of ${BEATS.length}`}>
          {Array.from({ length: stepBeats }, (_, i) => <span key={i} className={i <= b.local ? 'on' : ''} />)}
        </div>
        <button className="btn" onClick={prev} disabled={beat === 0}>Back</button>
        <button className="btn primary" onClick={next} disabled={beat === BEATS.length - 1}>Next ↗</button>
      </footer>
    </div>
  );
}
