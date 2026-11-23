// The demo script. Each beat is one press of →. Stages render from their local beat index.

export type StepId = 'hook' | 'capture' | 'clean' | 'golden' | 'profile' | 'audiences' | 'decide' | 'activate' | 'learn';

export interface StepDef {
  id: StepId;
  title: string;
  sub: string;
  zone: 'sources' | 'engineering' | 'cdp' | 'decision' | 'channels';
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
      'Who she is gets decided once, here in Snowflake. Four exact matching rules run over the clean records: same NPI, OneKey ID or name plus address, same normalized email, and a tracked email click that ties her web device to her SFMC subscriber. Exact rules would rather miss a link than make a wrong one, so the other email address goes to data stewards.',
      'The result is one golden record and a crosswalk: every identifier she has, from NPI to web device, mapped to golden ID HCP-00731 with the rule that linked it. This crosswalk is the single source of identity truth. Data 360 reads it and never re-decides who she is.',
      'Because the AI runs on the golden record, every score belongs to one confirmed doctor. Snowflake ML scores every oncologist weekly: she scores 0.81, top 12 percent. These are the reasons the model gives.',
      'Cortex AI reads rep call notes every night. Her rep wrote that she asked about rash and colitis with immunotherapy and wants something for her infusion nurses. Cortex turns that into data: topic side effect management.',
      'Snowflake Intelligence lets analysts ask in plain English, answered with governed SQL. It finds 38 oncologists, but it does not send anything or check consent. The golden record, crosswalk, scores and topics all reach Data 360 through Zero Copy, with no pipeline and no copy.',
    ],
  },
  {
    id: 'profile', title: 'Profile', sub: 'Recognize and act', zone: 'cdp',
    notes: [
      'Snowflake decided who she is; Data 360 acts on it. The golden record, crosswalk, scores and call note topics arrive through Zero Copy and are mapped to the Data 360 data model. The identity ruleset has one pass-through rule: same golden ID, same profile. There is no matching in Data 360.',
      'Her unified profile shows every identifier from the Snowflake crosswalk at once: email, Veeva CRM ID and SFMC subscriber. Her web device is not on it yet; her Day 1 efficacy download still sits on an anonymous device.',
      'On Day 3 she clicked a tracked email link. Snowflake\'s nightly identity run on Day 4 adds the device to the crosswalk, and Data 360 picks it up: the Day 1 activity moves onto her profile and her interests show efficacy. Be honest about timing: known devices attach within seconds, a brand-new device waits for the next identity run.',
    ],
  },
  {
    id: 'audiences', title: 'Audiences', sub: 'Two use cases', zone: 'cdp',
    notes: [
      'Priya, a brand manager, builds a micro segment herself in about five minutes: TX oncology, side effect, high intent. Blue conditions are fields Snowflake computed, like specialty, state and the ML score; brand-colour conditions are live in Data 360, like this week\'s downloads and active journeys. An OR group catches either the call note topic or a medical information request, and two exclusions remove anyone just visited or already in a journey. 23 oncologists, with a size check per channel: email and rep yes, paid media too small.',
      'Use case two: on Day 17 at 10:14 she downloads the side effect guide, and two minutes later she is in the real-time audience. Snowflake alone would know tomorrow around six, after the nightly batch. It is fast because her device is already in the Snowflake crosswalk. The event asks the decision layer what to do next.',
    ],
  },
  {
    id: 'decide', title: 'Decide', sub: 'Next best action', zone: 'decision',
    notes: [
      'Two passes, in this order. Rules remove what the brand is not allowed to do: here the efficacy email she already has, and MSL outreach without a medical information request. Then machine learning ranks what is left by how likely she is to engage. Press M to compare Rules only.',
      'With the model: the side effect guide email today, then the rep alert, the visit and the webinar, and a pause if she does not engage. An Agentforce agent writes the rep\'s reason; the language model explains, it never decides. Rules only sends the webinar invite: allowed, but not what she just asked for. There is no decision engine today: rules run in Flow, the model runs in Snowflake.',
    ],
  },
  {
    id: 'activate', title: 'Activate', sub: 'Set up and send', zone: 'channels',
    notes: [
      'Activation is configured inside Data 360. The micro segment and the real-time audience are the sources. SFMC is configured with an email consent filter and reaches 21 of the 23; the rep alert goes to Veeva through a Snowflake write-back or API, because Veeva is not a native Data 360 destination; paid media is blocked because the audience is below the publisher minimum; website personalization is a live lookup, still to be confirmed on licence. Press C to show Dr. Ortiz dropping out of SFMC.',
      'What each channel receives: email 21, rep alert 23, media blocked, the website pulls her profile when she arrives. Click a band to show the route and steps.',
      'What she actually sees: the email from the oncology brand team, her rep Marcus Lee\'s alert, and a personalized website.',
      'The real-time path: download at 10:14, the event streams in within seconds, the rule checks score and consent, the decision runs and the email goes at 10:42. The rep alert appears the same day.',
      'One story across channels: side effect support first, the nurse webinar next. Nothing sends efficacy content she already has.',
    ],
  },
  {
    id: 'learn', title: 'Learn', sub: 'Feedback and proof', zone: 'channels',
    notes: [
      'Click each outcome. What she does next changes what the brand does for her next week. The model learns at its next retrain; the rules learn the same day.',
      'Results flow back from every channel and are shared back to Snowflake through Zero Copy, where the models retrain.',
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
