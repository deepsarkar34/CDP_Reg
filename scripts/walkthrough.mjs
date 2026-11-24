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

// Story checks (acceptance checklist, v3)
const mapText = await page.locator('.map').innerText();
expect(!/Decision layer/.test(mapText), 'No separate decision zone');
expect((await page.locator('.zone').count()) === 4, 'Four zones on the map');
const snowZone = await page.locator('.zone', { hasText: 'Snowflake: identity, engineering and AI' }).innerText();
expect(['03', 'Clean', '04', 'Golden record creation', '05', 'Decide', 'Being built', '1 Rules', '2 ML', '3 Cortex'].every(t => snowZone.includes(t)), 'Snowflake zone holds 03-05 with chips and badge');
expect(['06', 'Profile', '07', 'Audiences', '08', 'Activate', '09', 'Learn'].every(t => mapText.includes(t)), 'Steps 06-09 on the map');

await page.keyboard.press('r'); await page.waitForTimeout(1200);
expect((await stage()).includes('ORTIZ, LENA MD'), 'Hook shows Veeva fragment');

// 04 Golden record creation
await page.keyboard.press('4'); await page.waitForTimeout(5600);
let s4 = await stage();
expect(s4.includes('Her records after cleaning') && s4.includes('Linked by'), '04 Match headings');
expect(['OneKey ID WUS-0058213', 'Treating NPI 14•••••213', 'Device 7f3a… (clicked email link)'].every(v => s4.includes(v)), '04 Match: matched-on values');
await page.locator('.dt tr', { hasText: 'Veeva CRM' }).hover(); await page.waitForTimeout(400);
expect((await page.locator('.matched.hl').count()) === 2, '04 Hover highlights the value on the row and the R2 card');
await page.mouse.move(5, 5);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
s4 = await stage();
expect(!/Rx decile|Patients treated|Last rep visit/.test(s4) && s4.includes('Who she is: one trusted version'), '04 Golden record identity facts only, with caption');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
expect((await stage()).includes('Priority score') && (await stage()).includes('Tells us who to focus on'), '04 Priority score label');
expect((await stage()).includes('Step 05 Decide'), '04 output strip points to Decide');

// 05 Decide
await page.keyboard.press('5'); await page.waitForTimeout(800);
expect((await page.locator('.strip-box').count()) === 4, '05 four-box strip');
expect((await page.locator('.strip-box.done').count()) < 4, '05 strip animates box by box');
await page.waitForTimeout(4600);
let s5 = await stage();
expect(s5.includes('Snowflake picks the best next step for every doctor, every night'), '05 headline');
expect(s5.includes('Nightly decision run, Day 16'), '05 trigger');
expect((await page.locator('.strip-box.done').count()) === 4, '05 all four boxes shown');
expect(s5.includes('Cortex AI explains the decision. Rules and Snowflake ML make it.'), '05 Cortex explains, never decides');
expect(s5.includes('Priority model (step 04)') && s5.includes('Response model (step 05)') && s5.includes('0.81') && s5.includes('34%'), '05 two models distinguished');
expect(s5.includes('Pass 2 · ML: chance she engages'), '05 ML column header');
expect((await page.locator('.decide-table tr.chosen').innerText()).includes('Side effect guide email'), '05 ML picks the guide email');
await page.keyboard.press('m'); await page.waitForTimeout(2200);
expect((await page.locator('.decide-table tr.chosen').innerText()).includes('Nurse education webinar invite'), '05 Rules only picks the webinar');
expect((await page.locator('.strip-box.off').count()) === 2 && (await stage()).includes('Not used'), '05 Rules only: ML and Cortex not used');
expect((await page.locator('.sl.off').count()) === 2, '05 Rules only: ML and Cortex chips crossed out on the map');
await page.keyboard.press('m'); await page.waitForTimeout(5200);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
s5 = await stage();
expect(s5.includes('NBA.RECOMMENDATIONS for HCP-00731') && s5.includes('Reason for the rep (written by Cortex AI)'), '05 output card');
expect(s5.includes('Data 360 reads this table through Zero Copy and acts on it.'), '05 being-built note');

// 06 Profile
await page.keyboard.press('6'); await page.waitForTimeout(900);
let s6 = await stage();
expect(['Golden record', 'Crosswalk', 'Priority score', 'Call note topics', 'NBA.RECOMMENDATIONS'].every(t => s6.includes(t)), '06 five Zero Copy tables');
expect(s6.includes('This is her HCP 360') && s6.includes('Same golden ID = same profile'), '06 sub-line and one-rule pass-through');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1400);
s6 = await stage();
expect(s6.includes('Last rep visit') && s6.includes('7 in immuno oncology') && s6.includes('Next best action'), '06 moved tiles and NBA tile');
await page.locator('button', { hasText: "Day 4: Snowflake's nightly identity run adds the device" }).click(); await page.waitForTimeout(1500);
expect((await stage()).includes('on her profile'), '06 Day 4 links the device');

// 07 Audiences
await page.keyboard.press('7'); await page.waitForTimeout(6600);
let s7 = await stage();
expect(s7.includes('Next best action is "Side effect guide email"') && s7.includes('Snowflake decision'), '07 NBA condition with amber tag');
expect(/\b23\b/.test(await page.locator('.big').first().innerText()) && s7.includes('21 after email consent'), '07 ends at 23, 21 after consent');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
s7 = await stage();
expect(s7.includes('2 min') && s7.includes('Why the side effect guide'), '07 use case 2 row');

// 08 Activate
await page.keyboard.press('8'); await page.waitForTimeout(1000);
let s8 = await stage();
expect(s8.includes("What is sent follows Snowflake's next best action for each doctor."), '08 follows-NBA line');
const sfmcRow = () => page.locator('.dt tr', { hasText: 'SFMC (shared data extension' }).innerText();
await page.keyboard.press('c'); await page.waitForTimeout(500);
expect((await sfmcRow()).includes('20'), '08 consent off: SFMC 20');
await page.keyboard.press('c');
await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1300);
expect((await stage()).includes('She asked about side effects in her last call'), '08 rep alert carries the Cortex reason');

// 09 Learn
await page.keyboard.press('9'); await page.waitForTimeout(700);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900);
expect((await stage()).includes('the response model retrains and the rules are reviewed'), '09 what improves');

// No screen says decisions are made in Flow, Data 360 or a decision engine
let words = '';
await page.keyboard.press('r'); await page.waitForTimeout(600);
while (true) { await page.waitForTimeout(200); words += await page.locator('body').innerText(); if (await page.locator('.foot .btn.primary').isDisabled()) break; await page.keyboard.press('ArrowRight'); }
expect(!/Salesforce Flow|decision engine|Decision layer|asks the decision layer/i.test(words), 'No old decision wording on any screen');

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
await narrow.goto(url); await narrow.bringToFront(); await narrow.waitForTimeout(700); await narrow.keyboard.press('5'); await narrow.waitForTimeout(700);
expect(await narrow.locator('.decide-table tr.chosen').count() === 1, 'Reduced motion: finished state at once');
const overflow = await narrow.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
expect(overflow <= 1, `Narrow: page scrolls sideways by ${overflow}px`);
await narrow.screenshot({ path: `${out}/decide-narrow.png`, fullPage: true });
await narrow.close();

await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Walkthrough OK, no console errors.');
