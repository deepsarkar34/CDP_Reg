// Decide, in Snowflake: rules decide what is allowed, machine learning decides what is best,
// and Cortex AI explains it. Cortex never decides. In Rules only, ML and Cortex are off and a fixed
// brand priority list picks. All numbers illustrative.
import scenario from './scenario/scenario.json';

export type Mode = 'ml' | 'rules';
export interface DecideOption { id: string; name: string; email: boolean; response?: number; rank?: number; blocked?: string }

export const OPTIONS = scenario.decide.options as DecideOption[];

export const PASSES = [
  { n: 1, name: 'Rules: what is allowed', short: 'Rules', kind: 'SQL rules' },
  { n: 2, name: 'ML: what works best', short: 'ML', kind: 'Snowflake ML response model' },
  { n: 3, name: 'Cortex AI: explains it', short: 'Cortex', kind: 'Generative AI' },
] as const;

/** The four boxes of the strip: 1 inputs, 2 rules, 3 ML, 4 Cortex. Pass n is box n + 1. */
export const BOXES = 4;
/** Rules only: ML and Cortex are not used. */
export const isActive = (pass: number, mode: Mode) => mode === 'ml' || pass === 1;
export const boxActive = (box: number, mode: Mode) => box === 1 || isActive(box - 1, mode);
export const playOrder = (mode: Mode) => [1, 2, 3, 4].filter(b => boxActive(b, mode));

/** Guardrail reasons that remove an option (empty = allowed). */
export function blockedReasons(o: DecideOption, consent: boolean): string[] {
  const r: string[] = [];
  if (o.blocked) r.push(o.blocked);
  if (o.email && !consent && !o.blocked) r.push('No email consent');
  return r;
}
export const allowedOptions = (consent: boolean) => OPTIONS.filter(o => blockedReasons(o, consent).length === 0);

/** Rules plus ML: highest predicted engagement. Rules only: top of the brand priority list. */
export function chooseAction(mode: Mode, consent: boolean): DecideOption {
  const a = allowedOptions(consent);
  return mode === 'ml'
    ? a.reduce((best, o) => ((o.response ?? 0) > (best.response ?? 0) ? o : best))
    : a.reduce((best, o) => ((o.rank ?? 99) < (best.rank ?? 99) ? o : best));
}

/** Short label used by the footer and Activate. */
export const decisionLabel = (mode: Mode, consent: boolean) => chooseAction(mode, consent).name;
