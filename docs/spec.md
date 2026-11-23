# CDP Journey: Dr. Ortiz — Design Spec

_Last updated: 2026-11-22_

## Purpose
A 15–18 minute live demo for a pharma client. Mixed room (brand and technical). Shows how a client's Snowflake and Salesforce Data 360 work together for one oncologist, end to end. Source brief: "Dr. Ortiz's Data Journey" HTML.

## Decisions
| Topic | Decision |
|---|---|
| Starting point | Copy of the Dr. Brown demo (stack, Indegene look, presenter flow, tests) |
| HCP | Dr. Lena Ortiz, medical oncologist, Houston; golden ID HCP-00731 |
| Client | No real company named. On-screen copy is generic; only the header uses the fictional client name, Acme Pharma (configurable in `scenario.json`) |
| Platform switch | Removed: the story is Snowflake + Salesforce Data 360 throughout |
| Opening screen | Six fragments, one per system (Veeva, IQVIA, Claims and EHR, SFMC, HCP website, OneKey) |
| Record count | Eight records across six systems (the brief said seven; the cards add to eight) |
| Decide | Two passes from the brief: rules, then ML; Rules only uses the brand priority list |
| Timer | 18 minutes |

## Steps and beats (29 beats)
Question (2), Capture (3), Clean (4), Golden record creation (5), Profile (3), Audiences (2), Decide (2), Activate (5), Learn (3).

## What-if levers
- `M`: Rules only vs Rules plus machine learning. Pass 2 is crossed out on the map in Rules only.
- `C`: email consent off blocks every email option at pass 1 (both modes fall back to the rep visit), skips email touches, keeps her out of the email real-time audience and removes her from the email count.

## Copy and visual rules
Indegene look: navy chrome, white stage, Outfit, one gradient word per heading, magenta only for conflicts and alerts. Screens look like the systems they represent. Short labels on screen; explanations live in presenter notes. No bold lead-ins, slogans or middle-dot separators. The language model never decides: an Agentforce agent only writes the rep's explanation.

## Identity in Snowflake (v2, branch feat/regeneron-identity-in-snowflake)
- Nine steps. Old Master and AI and ML become **04 Golden record creation**; Resolve becomes **05 Profile**. Zones: "Snowflake: identity, engineering and AI", "Activation and learning".
- Identity is decided once in Snowflake: rules R1 to R4, golden record, IDENTITY.CROSSWALK (six identifiers). Duplicates are removed in Clean only; the rules link records and never merge again.
- Data 360 does no matching: one pass-through rule (same golden ID = same profile). The web device arrives with Snowflake's Day 4 identity run.
- Micro segment built in Data 360 (logic tree, 4,120 to 23, Snowflake and Data 360 source tags, size check, governance).
- Activation configured in Data 360: SFMC 21 (20 without her consent), rep 23, media blocked, website live lookup.
- Learn's holdout is measured on the whole programme (34 of 342): 10% of a 23-doctor segment would be 2 doctors.
- No real client named anywhere; the header keeps the fictional Acme Pharma.

## Removed from the Dr. Brown version
Platform switch, five-sublayer decision (lift, value, capacity), clean room beat, recap beat.
