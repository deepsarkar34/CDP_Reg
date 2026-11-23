// Click through every beat; check the Dr. Ortiz outcomes; fail on console errors; save screenshots.
// Usage: npm run build && npm run preview &  then  npm run walkthrough
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const url = process.argv[2] || 'http://localhost:4173/';
const out = 'artifacts';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const expect = (cond, msg) => { if (!cond) errors.push(msg); };
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const stage = () => page.locator('.stage').innerText();

await page.goto(url); await page.waitForTimeout(700);
expect((await page.locator('.step').count()) === 9, 'expected 9 steps on the map');

// Every beat, start to end
let beat = 0;
while (true) {
  await page.waitForTimeout(1300);
  if (await page.locator('.pipe').count() && !(await page.locator('.decide-table tr.chosen').count())) await page.waitForTimeout(3600);
  await page.screenshot({ path: `${out}/beat-${String(beat).padStart(2, '0')}.png` });
  if (await page.locator('.foot .btn.primary').isDisabled()) break;
  await page.keyboard.press('ArrowRight'); beat++;
}
console.log(`${beat + 1} beats`);

// Story checks (acceptance checklist)
const mapText = await page.locator('.map').innerText();
expect(mapText.includes('Snowflake: identity, engineering and AI') && mapText.includes('Activation and learning'), 'Zone labels');
expect(['Question', 'Capture', 'Clean', 'Golden record creation', 'Profile', 'Audiences', 'Decide', 'Activate', 'Learn'].every(t => mapText.includes(t)), 'Nine step names on the map');
expect(!/Resolve|Master|AI and ML\n/.test(mapText), 'No old step names on the map');

await page.keyboard.press('r'); await page.waitForTimeout(1200);
expect((await stage()).includes('ORTIZ, LENA MD'), 'Hook shows Veeva fragment');

await page.keyboard.press('4'); await page.waitForTimeout(5600);
let s4 = await stage();
expect(s4.includes('One doctor, decided once, in Snowflake') && ['R1', 'R2', 'R3', 'R4'].every(r => s4.includes(r)), '04 Match: four rules');
expect(s4.includes('data stewards'), '04 Match: steward note');
expect((await page.locator('.dt tr .tag.ok').count()) >= 6, '04 Match: every clean record linked');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
expect((await stage()).includes('IDENTITY.CROSSWALK') && (await stage()).includes('WUS-0058213'), '04 Crosswalk');
expect((await stage()).includes('Snowflake is the single source of identity truth'), '04 Crosswalk callout');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1000);
expect((await stage()).includes('Built on the golden record'), '04 AI and ML line');

await page.keyboard.press('5'); await page.waitForTimeout(900);
let s5 = await stage();
expect(s5.includes('Same golden ID = same profile') && s5.includes('no matching in Data 360'), '05 one-rule pass-through');
expect(!/exact email|identifiers linked|identity resolution/i.test(s5), '05 no Data 360 matching wording');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
s5 = await stage();
expect(s5.includes('from Snowflake crosswalk') && s5.includes('None yet'), '05 before Day 4');
expect(s5.includes('Known devices attach to her profile within seconds'), '05 honest timing note');
await page.locator('button', { hasText: "Day 4: Snowflake's nightly identity run adds the device" }).click(); await page.waitForTimeout(1500);
expect((await stage()).includes('Efficacy') && (await stage()).includes('on her profile'), '05 Day 4 links the device');

await page.keyboard.press('6'); await page.waitForTimeout(5800);
let s6 = await stage();
expect((await page.locator('.logic.exclude').count()) === 1 && (await page.locator('.logic-or').count()) === 1, '06 logic tree: OR group and EXCLUDE block');
expect(s6.includes('TX oncology: side effect, high intent') && /\b23\b/.test(await page.locator('.big').first().innerText()), '06 micro segment ends at 23');
expect(s6.includes('Review date: 2027-02-01') && s6.includes('Below the publisher minimum'), '06 governance and size check');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
s6 = await stage();
expect(s6.includes('2 min') && s6.includes('10:42') && s6.includes('Tomorrow, around 6:00'), '06 use case 2 timeline');

await page.keyboard.press('7'); await page.waitForTimeout(4200);
expect((await page.locator('.decide-table tr.chosen').innerText()).includes('Side effect guide email'), 'ML picks the side effect guide email');
expect((await page.locator('.decide-table tr.blocked').count()) === 2, 'Two options blocked');
await page.keyboard.press('m'); await page.waitForTimeout(2200);
expect((await page.locator('.decide-table tr.chosen').innerText()).includes('Nurse education webinar invite'), 'Rules only picks the webinar');
expect((await page.locator('.sl.off').count()) === 1, 'Rules only: pass 2 crossed out on the map');
await page.keyboard.press('m'); await page.waitForTimeout(600);

await page.keyboard.press('8'); await page.waitForTimeout(1000);
let s8 = await stage();
expect(s8.includes('Set up in Data 360') && s8.includes('Destinations') && s8.includes('Every 4 hours'), '08 opens on the Data 360 set-up view');
const sfmcRow = () => page.locator('.dt tr', { hasText: 'SFMC (shared data extension' }).innerText();
expect((await sfmcRow()).includes('21'), '08 SFMC reaches 21');
await page.keyboard.press('c'); await page.waitForTimeout(500);
expect((await sfmcRow()).includes('20') && (await sfmcRow()).includes('filtered out'), '08 consent off: SFMC 20');
await page.keyboard.press('c');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1300);
s8 = await stage();
expect(s8.includes('21 oncologists') && s8.includes('23 oncologists') && s8.includes('Blocked, 0'), '08 channel view counts');

await page.keyboard.press('9'); await page.waitForTimeout(700);
await page.locator('[role=radio]', { hasText: 'No response' }).click(); await page.waitForTimeout(500);
expect((await stage()).includes('Nothing for 14 days'), 'Learn: no-response outcome');
await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900);
expect((await stage()).includes('19 pts'), 'Learn: holdout');

// Consent off: emails blocked, rep visit chosen
await page.keyboard.press('7'); await page.keyboard.press('c'); await page.waitForTimeout(4200);
expect((await page.locator('.decide-table tr.chosen').innerText()).includes('Rep visit'), 'Consent off: rep visit chosen');
await page.keyboard.press('c');

// Nothing on any screen names the original client
let all = '';
await page.keyboard.press('r'); await page.waitForTimeout(600);
while (true) { await page.waitForTimeout(250); all += await page.locator('body').innerText(); if (await page.locator('.foot .btn.primary').isDisabled()) break; await page.keyboard.press('ArrowRight'); }
// The original client's name, base64-encoded so it does not appear in the repo.
const banned = new RegExp(Buffer.from('cmVnZW5lcm9u', 'base64').toString(), 'i');
expect(!banned.test(all), 'No client name on any screen');

// Narrow screen and reduced motion
const narrow = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
narrow.on('pageerror', e => errors.push(`pageerror (narrow): ${e.message}`));
await narrow.goto(url); await narrow.bringToFront(); await narrow.waitForTimeout(700); await narrow.keyboard.press('7'); await narrow.waitForTimeout(700);
expect(await narrow.locator('.decide-table tr.chosen').count() === 1, 'Reduced motion: finished state at once');
const overflow = await narrow.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
expect(overflow <= 1, `Narrow: page scrolls sideways by ${overflow}px`);
await narrow.screenshot({ path: `${out}/decide-narrow.png`, fullPage: true });
await narrow.close();

await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Walkthrough OK, no console errors.');
