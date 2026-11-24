# CDP Journey: Dr. Ortiz, identity in Snowflake (Snowflake + Salesforce Data 360)

A live, presenter-driven demo that follows one medical oncologist, Dr. Lena Ortiz, from six source systems through Snowflake engineering and AI, Salesforce Data 360, a decided next action, live channels and a learning loop.

**Question → Capture → Clean → Golden record creation → Decide → Profile → Audiences → Activate → Learn**

All people, IDs, scores, counts and company names are illustrative. Content names are placeholders for MLR-approved assets. Built from the "Dr. Ortiz's Data Journey" HTML brief; it started as a copy of the Dr. Brown demo in `deepsarkar34/CDP`, which is unchanged.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build into dist/
npm run preview      # serve the build, http://localhost:4173
```

## Presenting

| Key | Action |
|---|---|
| → / Space / PageDown | next beat (most clickers work) |
| ← / PageUp | previous beat |
| 1–9 | jump to a step |
| D | technical detail on/off |
| C | toggle Dr. Ortiz's email consent (what-if) |
| M | Decide step: Rules only vs Rules plus machine learning |
| P | presenter notes (notes, next beat, 18:00 timer) |
| F | fullscreen |
| T | light/dark theme |
| R | reset |

## What each step shows

1. **Question**: six fragments, one per system, merge into Lena Ortiz, MD.
2. **Capture**: 8 records across 6 systems; batch through Openflow to Snowflake, web streamed to Data 360.
3. **Clean**: bronze to silver in Snowflake; duplicates removed within each source; patient tokens re-tokenized.
4. **Golden record creation** (Snowflake): rules R1 to R4 with the value each record matched on; an identity-only golden record and the IDENTITY.CROSSWALK; priority score 0.81, Cortex call note topic, Snowflake Intelligence.
5. **Decide** (Snowflake, being built): nightly run. Rules decide what's allowed, Snowflake ML decides what's best, Cortex AI explains it. Output: NBA.RECOMMENDATIONS (side effect guide email, 34%).
6. **Profile** (Data 360): five tables arrive through Zero Copy; one pass-through rule; her HCP 360 with Rx decile, last rep visit and next best action.
7. **Audiences**: micro segment with the next best action condition (4,120 to 23); real-time audience 2 minutes after her download.
8. **Activate**: set up in Data 360, following Snowflake's next best action; rep alert carries the Cortex reason.
9. **Learn**: results back to Snowflake; the response model retrains and the rules are reviewed; 34-of-342 holdout.

## Customize

- `src/scenario/scenario.json`: every name, number and piece of copy for Dr. Ortiz.
- `src/beats.ts`: the script, one presenter note per beat.
- `src/decision.ts`: the two-pass decision logic.
- Logo: put a white version at `src/assets/logo.svg` (or `.png`).

## Quality checks

```bash
npm test                               # unit tests for the story numbers and the decision
npm run build && npm run preview &
npm run walkthrough                    # every beat, both decision modes, narrow screen; screenshots in artifacts/
node scripts/screenshots-v2.mjs        # v2 screens into screenshots/v2/
node scripts/screenshots-v3.mjs        # v3 screens (Decide in Snowflake) into screenshots/v3/
```
