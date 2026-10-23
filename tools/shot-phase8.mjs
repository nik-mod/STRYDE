// Phase-8 visual verification, take two: scrolls with stepped wheel events so
// Lenis and the pinned scenes behave exactly as they do for a real reader.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const npxNodeModules = 'C:/Users/LENOVO_LEGION/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/';
const { chromium } = createRequire(npxNodeModules)('playwright');

const EXE = 'C:/Users/LENOVO_LEGION/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const OUT = 'C:/Users/LENOVO_LEGION/.zcode/v2/visualizations/33502259dee50aa79133fc9623df44984ff7b114817f566362e53ec76b523906';
mkdirSync(OUT, { recursive: true });

const wait = ms => new Promise(done => setTimeout(done, ms));

async function wheelTo(page, targetY) {
  for (let step = 0; step < 60; step++) {
    const current = await page.evaluate(() => window.scrollY);
    const delta = targetY - current;
    if (Math.abs(delta) < 6) break;
    await page.mouse.wheel(0, Math.max(-900, Math.min(900, delta)));
    await wait(90);
  }
  await wait(700);
}

async function capture(viewport, prefix, steps) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto('http://localhost:9292/', { waitUntil: 'domcontentloaded' });
  await wait(3500);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  for (const [name, run] of steps) {
    await run(page);
    await wait(1200);
    await page.screenshot({ path: resolve(OUT, `${prefix}-${name}.png`) });
    console.log(`captured ${prefix}-${name}.png`);
  }
  await browser.close();
}

const top = page => wheelTo(page, 0);
const vh = page => page.evaluate(() => window.innerHeight);
const sectionTop = async (page, selector) => page.evaluate(sel => {
  const el = document.querySelector(sel);
  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
}, selector);

const desktopSteps = [
  ['hero-rest', top],
  ['hero-scroll-mid', async page => wheelTo(page, (await page.evaluate(() => document.querySelector('[data-hero-stage]')?.offsetHeight || 0)) * .5)],
  ['handoff-carry', async page => wheelTo(page, await sectionTop(page, '#chapter-deconstruction') - (await vh(page)) * .45)],
  ['handoff-land', async page => wheelTo(page, await sectionTop(page, '#chapter-deconstruction') - (await vh(page)) * .12)],
  ['decon-crops', async page => wheelTo(page, await sectionTop(page, '#chapter-deconstruction') + (await vh(page)) * 1.25)],
  ['materials-p1', async page => wheelTo(page, await sectionTop(page, '#chapter-materials') + 10)],
  ['materials-p2', async page => wheelTo(page, await sectionTop(page, '#chapter-materials') + (await vh(page)) * .55)],
  ['featured', async page => wheelTo(page, await sectionTop(page, '#chapter-featured') + 260)],
  ['brand', async page => wheelTo(page, await sectionTop(page, '#chapter-brand') + 380)],
  ['finale-pinned', async page => wheelTo(page, await sectionTop(page, '#chapter-finale') + 10)],
  ['finale-end', async page => wheelTo(page, 99999)],
];

const mobileSteps = [
  ['hero-rest', top],
  ['materials-p1', async page => wheelTo(page, await sectionTop(page, '#chapter-materials') + 120)],
  ['featured', async page => wheelTo(page, await sectionTop(page, '#chapter-featured') + 200)],
  ['finale-end', async page => wheelTo(page, 99999)],
];

await capture({ width: 1440, height: 900 }, 'p8-desktop', desktopSteps);
await capture({ width: 390, height: 844 }, 'p8-mobile', mobileSteps);
console.log('done');
