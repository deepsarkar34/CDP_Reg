// Captures every screen and tab changed in v3 (Decide moved into Snowflake) into screenshots/v3/.
// Usage: npm run build && npm run preview &  then  node scripts/screenshots-v2.mjs [url]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = 'screenshots/v3';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url); await page.waitForTimeout(800);
const key = async (k, wait = 900) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };
const shot = (name, fullPage = false) => page.screenshot({ path: `${out}/${name}.png`, fullPage });
const click = async (text, wait = 900) => { await page.locator('button', { hasText: text }).first().click(); await page.waitForTimeout(wait); };
const scrollEnd = async () => { await page.evaluate(() => { const s = document.querySelector('.stage'); s.scrollTo({ top: s.scrollHeight }); }); await page.waitForTimeout(500); };

// Map: Decide is step 05 in the Snowflake zone
await shot('00-map-decide-in-snowflake');
// 04 Golden record creation
await key('4', 5600); await shot('04a-match-matched-on-values');
await page.locator('.dt tr', { hasText: 'Veeva CRM' }).hover(); await page.waitForTimeout(500); await shot('04a-match-hover-highlight-r2'); await page.mouse.move(5, 5);
await key('ArrowRight', 1300); await shot('04b-golden-record-identity-only');
await key('ArrowRight', 1500); await shot('04c-priority-score');
await key('ArrowRight', 1200); await shot('04c-cortex-input-to-decide');
// 05 Decide
await key('5', 2100); await shot('05a-decide-strip-playing');
await page.waitForTimeout(3400); await shot('05a-decide-strip-complete');
await page.evaluate(() => document.querySelector('.stage').scrollTo({ top: 420 })); await page.waitForTimeout(400); await shot('05b-decide-models-and-options');
await key('m', 2400); await page.evaluate(() => document.querySelector('.stage').scrollTo({ top: 0 })); await page.waitForTimeout(300); await shot('05c-decide-rules-only'); await key('m', 5200);
await key('d', 900); await scrollEnd(); await shot('05d-decide-technical'); await key('d', 300);
await key('ArrowRight', 1400); await shot('05e-nba-recommendations');
await key('c', 900); await shot('05f-nba-consent-off'); await key('c', 300);
// 06 Profile
await key('6', 1000); await shot('06a-profile-five-zero-copy-tables');
await key('ArrowRight', 1500); await scrollEnd(); await shot('06b-profile-hcp-360-tiles');
// 07 Audiences
await key('7', 6800); await shot('07a-micro-segment-with-nba');
await key('d', 900); await scrollEnd(); await shot('07a-micro-segment-technical'); await key('d', 300);
await key('ArrowRight', 1400); await shot('07b-why-the-side-effect-guide');
// 08 Activate
await key('8', 1100); await shot('08a-setup-follows-nba');
await key('ArrowRight', 1300); await key('ArrowRight', 1300); await shot('08c-rep-alert-cortex-reason');
await key('ArrowRight', 4800); await shot('08d-real-time-path');
// 09 Learn
await key('9', 800); await key('ArrowRight', 1300); await shot('09b-what-flows-back');
// Narrow screen
const narrow = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await narrow.goto(url); await narrow.bringToFront(); await narrow.waitForTimeout(700);
await narrow.keyboard.press('5'); await narrow.waitForTimeout(900);
await narrow.screenshot({ path: `${out}/05-decide-phone.png`, fullPage: true });
await browser.close();
console.log('saved to', out);
