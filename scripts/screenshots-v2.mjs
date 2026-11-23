// Captures every changed screen and sub-view of the identity-in-Snowflake version into screenshots/v2/.
// Usage: npm run build && npm run preview &  then  node scripts/screenshots-v2.mjs [url]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = 'screenshots/v2';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url); await page.waitForTimeout(800);
const key = async (k, wait = 900) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };
const shot = (name, fullPage = false) => page.screenshot({ path: `${out}/${name}.png`, fullPage });
const click = async (text, wait = 900) => { await page.locator('button', { hasText: text }).first().click(); await page.waitForTimeout(wait); };
const scrollEnd = async () => { await page.evaluate(() => { const s = document.querySelector('.stage'); s.scrollTo({ top: s.scrollHeight }); }); await page.waitForTimeout(500); };

// Map with nine steps
await shot('00-map-nine-steps');
// 04 Golden record creation
await key('4', 5600); await shot('04a-match-rules');
await key('d', 900); await scrollEnd(); await shot('04a-match-technical-r3-sql'); await key('d', 400);
await key('ArrowRight', 1300); await shot('04b-golden-record-and-crosswalk');
await key('ArrowRight', 1500); await shot('04c-ai-ml-score');
await key('ArrowRight', 1200); await shot('04c-ai-cortex-call-note');
await key('ArrowRight', 1200); await shot('04c-ai-plain-english');
// 05 Profile
await key('5', 1000); await shot('05a-profile-arrives-one-rule');
await key('d', 600); await shot('05a-profile-technical-ruleset'); await key('d', 300);
await key('ArrowRight', 1400); await shot('05b-profile-before-day-4');
await click("Day 4: Snowflake's nightly identity run adds the device", 1700); await shot('05c-profile-day-4-device-linked');
// 06 Audiences
await key('6', 5800); await shot('06a-micro-segment-logic-tree');
await key('d', 900); await scrollEnd(); await shot('06a-micro-segment-technical'); await key('d', 300);
await key('ArrowRight', 1400); await shot('06b-follow-up-2-min');
// 07 Decide (only the "where this runs" note changed)
await key('7', 4400); await key('ArrowRight', 1200); await scrollEnd(); await shot('07-decide-where-this-runs');
// 08 Activate
await key('8', 1100); await shot('08a-setup-in-data-360');
await key('c', 700); await shot('08a-setup-consent-off-sfmc-20'); await key('c', 300);
await key('ArrowRight', 1500); await shot('08b-channels-push-and-pull');
await key('ArrowRight', 1100); await shot('08c-what-dr-ortiz-sees');
await key('ArrowRight', 4800); await shot('08d-real-time-path');
await key('ArrowRight', 1000); await shot('08e-one-story');
// 09 Learn: holdout now measured on the programme
await key('9', 800); await key('ArrowRight', 300); await key('ArrowRight', 1300); await shot('09-learn-holdout-programme');
// Narrow screen
const narrow = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await narrow.goto(url); await narrow.bringToFront(); await narrow.waitForTimeout(700);
await narrow.keyboard.press('6'); await narrow.waitForTimeout(900);
await narrow.screenshot({ path: `${out}/06a-micro-segment-phone.png`, fullPage: true });
await browser.close();
console.log('saved to', out);
