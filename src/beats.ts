// The demo script. Each beat is one press of →. Stages render from their local beat index.

export type StepId = 'hook' | 'capture' | 'clean' | 'golden' | 'decide' | 'profile' | 'audiences' | 'activate' | 'learn';

export interface StepDef {
  id: StepId;
  title: string;
  sub: string;
  zone: 'sources' | 'engineering' | 'cdp' | 'channels';
  /** Presenter notes, one per beat. Length defines the number of beats in the step. */
  notes: string[];
}

export const STEPS: StepDef[] = [
  {
    id: 'hook', title: 'Question', sub: 'One or six?', zone: 'sources',
    notes: [
      'Ask the room whether this is one oncologist or six. Each fragment comes from a different system: Veeva, IQVIA, claims, SFMC, the HCP website and OneKey.',
      'It is one person: Dr. Lena Ortiz, a medical oncologist in Houston. We will follow her through Snowflake, Data 360, a decided next action, activation and the learning loop.',
    ],
  },
  {
    id: 'capture', title: 'Capture', sub: 'Raw sources', zone: 'sources',
    notes: [
      'Six systems each know a piece of her. Each sends its own version, in its own format, on its own schedule.',
      'Eight records across six systems. Batch data lands in Snowflake through Openflow connectors. Web behaviour that needs action within minutes also streams straight into Data 360.',
      'Pink fields disagree with another source. The blue ones are patient tokens: claims and EHR data arrive already de-identified by the vendor and matter to her only because they carry her NPI. Note the call note in Veeva; it comes back when we build the golden record.',
    ],
  },
  {
    id: 'clean', title: 'Clean', sub: 'Bronze to silver', zone: 'engineering',
    notes: [
      'This is bronze, exactly as received. Nothing can be matched on it yet.',
      'Silver standardizes each field: name parts, one specialty list, postal address, one date format, lowercase email.',
      'Duplicates inside a source go: two Veeva records become one, two SFMC contacts become one.',
      'Patient tokens are swapped into the company\'s own token space and quality checks run. Snowpark and dynamic tables run these rules on every refresh, and Cortex Code can help engineers write them. This is classic data engineering, and it belongs here, before anything reaches Data 360.',
    ],
  },
  {
    id: 'golden', title: 'Golden record creation', sub: 'Identity, engineering and AI', zone: 'engineering',
    notes: [
      'Who she is gets decided once, here in Snowflake. Four exact rules link each cleaned record to her, and each row shows the value it was matched on: OneKey ID for Veeva, NPI for IQVIA, claims and OneKey, her email for SFMC, and the tracked email click for her web device. Exact rules would rather miss a link than make a wrong one, so the other email address goes to data stewards.',
      'The golden record now holds identity facts only: one trusted version of who she is. The crosswalk maps every identifier, from NPI to web device, to golden ID HCP-00731 with the rule that linked it. Her Rx decile and last rep visit live in her HCP 360 in step 06, not here.',
      'On top of the golden record, Snowflake ML gives her a priority score of 0.81: how likely she is to start a new patient in 90 days. It tells us who to focus on, not what to do.',
      'Cortex AI reads rep call notes every night and turns hers into a topic: side effect management. That topic is an input to the decision in step 05.',
      'Snowflake Intelligence lets analysts ask in plain English, answered with governed SQL. The golden record, crosswalk, priority score and call note topics now feed step 05, Decide.',
    ],
  },
  {
    id: 'decide', title: 'Decide', sub: 'Next best action', zone: 'engineering',
    notes: [
      'Every night Snowflake picks the best next step for every doctor. Rules decide what\'s allowed, machine learning decides what\'s best, and Cortex AI explains it. For Dr. Ortiz, the rules block the efficacy email she already has and MSL outreach without a medical request; the response model ranks what is left, and the side effect guide email wins at 34 percent. Note the two models: the priority score says who deserves attention, the response model says what to do for her. Press M to compare Rules only.',
      'The result is a row in NBA.RECOMMENDATIONS: the side effect guide email, then a rep visit within 7 days with the nurse webinar invite, with a reason for the rep written by Cortex AI. The decision is made nightly in Snowflake; Data 360 acts on it, including within minutes when she shows fresh interest. This is being built.',
    ],
  },
  {
    id: 'profile', title: 'Profile', sub: 'Recognize and act', zone: 'cdp',
    notes: [
      'Five tables cross from Snowflake through Zero Copy: the golden record, the crosswalk, the priority score, the call note topics and NBA.RECOMMENDATIONS. They are mapped to the Data 360 data model, and the identity ruleset has one pass-through rule: same golden ID, same profile. There is no matching in Data 360.',
      'This is her HCP 360: her golden record from Snowflake, plus what she does now and what to do next. Last rep visit and Rx decile sit here now, next to her next best action from Snowflake. Her web device is not linked yet; her Day 1 efficacy download still sits on an anonymous device.',
      'On Day 3 she clicked a tracked email link. Snowflake\'s nightly identity run on Day 4 adds the device to the crosswalk, and Data 360 picks it up: the Day 1 activity moves onto her profile. Known devices attach within seconds; a brand-new device waits for the next identity run.',
    ],
  },
  {
    id: 'audiences', title: 'Audiences', sub: 'Two use cases', zone: 'cdp',
    notes: [
      'Priya, a brand manager, builds a micro segment in about five minutes: TX oncology, side effect, high intent. Blue conditions come from Snowflake, the amber one is Snowflake\'s own decision, next best action is the side effect guide email, and purple conditions are live in Data 360. The count falls from 4,120 to 23 oncologists, 21 of them reachable by email.',
      'Use case two: on Day 17 at 10:14 she downloads the side effect guide, and two minutes later she is in the real-time audience. Why the side effect guide: it is her latest next best action from Snowflake, so Data 360 acts on it within minutes instead of waiting for tonight\'s run. It is fast because her device is already in the Snowflake crosswalk.',
    ],
  },
  {
    id: 'activate', title: 'Activate', sub: 'Set up and send', zone: 'channels',
    notes: [
      'Activation is configured inside Data 360, and what is sent follows Snowflake\'s next best action for each doctor. The micro segment and the real-time audience are the sources. SFMC is configured with an email consent filter and reaches 21 of the 23; the rep alert goes to Veeva through a Snowflake write-back or API, because Veeva is not a native Data 360 destination; paid media is blocked because the audience is below the publisher minimum; website personalization is a live lookup, still to be confirmed on licence. Press C to show Dr. Ortiz dropping out of SFMC.',
      'What each channel receives: email 21, rep alert 23, media blocked, the website pulls her profile when she arrives. Click a band to show the route and steps.',
      'What she actually sees: the email from the oncology brand team, and her rep Marcus Lee\'s alert carrying the reason Cortex AI wrote in step 05.',
      'The real-time path: download at 10:14, the event streams in within seconds, the rule checks score and consent, Data 360 uses her next best action from Snowflake and the email goes at 10:42. The rep alert appears the same day.',
      'One story across channels: side effect support first, the nurse webinar next. Nothing sends efficacy content she already has.',
    ],
  },
  {
    id: 'learn', title: 'Learn', sub: 'Feedback and proof', zone: 'channels',
    notes: [
      'Click each outcome. What she does next changes what the brand does for her next week. The model learns at its next retrain; the rules learn the same day.',
      'Results flow back from every channel and go back to Snowflake through Zero Copy; the response model retrains and the decision rules are reviewed.',
      'To prove it works, hold back 10 percent of all oncologists in the side effect programme this quarter, 34 of 342, from every action. After 90 days, 31 percent of contacted oncologists engaged versus 12 percent of the holdout: 19 points caused by the program. Snowflake thinks across all oncologists; Data 360 acts on one, at the right moment, with consent checked.',
    ],
  },
];

export interface Beat { step: number; local: number; note: string }

export const BEATS: Beat[] = STEPS.flatMap((s, step) => s.notes.map((note, local) => ({ step, local, note })));

export const firstBeatOf = (step: number) => BEATS.findIndex(b => b.step === step);

export const clampBeat = (i: number) => Math.max(0, Math.min(BEATS.length - 1, i));

/** Target talk time in seconds (used by the presenter timer). */
export const TARGET_SECONDS = 18 * 60;
