# CDP Journey: Dr. Ortiz, identity in Snowflake (Snowflake + Salesforce Data 360)

A live, presenter-driven demo that follows one medical oncologist, Dr. Lena Ortiz, from six source systems through Snowflake engineering and AI, Salesforce Data 360, a decided next action, live channels and a learning loop.

**Question → Capture → Clean → Golden record creation → Profile → Audiences → Decide → Activate → Learn**

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
4. **Golden record creation** (Snowflake): (a) four exact matching rules R1 to R4 link every clean record to HCP-00731; (b) the golden record and the IDENTITY.CROSSWALK of six identifiers; (c) AI and ML on top: score 0.81, Cortex call note topic, Snowflake Intelligence.
5. **Profile** (Data 360): golden record, crosswalk, scores and topics arrive through Zero Copy; one pass-through rule (same golden ID = same profile), no matching in Data 360; Snowflake's Day 4 identity run adds her web device.
6. **Audiences**: Priya's micro segment "TX oncology: side effect, high intent" as a logic tree (4,120 to 23) with Snowflake and Data 360 source tags; the real-time audience she enters 2 minutes after her download.
7. **Decide**: two passes, rules then ML. ML picks the side effect guide email (34%); Rules only picks the webinar invite.
8. **Activate**: set up in Data 360 (audiences, destinations with consent filters, field mapping; SFMC 21, 20 without her consent), then what each channel receives.
9. **Learn**: three outcomes; what flows back to Snowflake; a 34-of-342 programme holdout (31% vs 12%).

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
node scripts/screenshots-v2.mjs        # changed screens and sub-views into screenshots/v2/
```
