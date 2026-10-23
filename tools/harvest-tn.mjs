// One-off dev automation: loads the local preview page in headless Chromium,
// injects the rebuilt transparent-render harness, waits for the renders and
// saves them over assets/tn-*.webp. Prints the measured profile alpha bounds.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const npxNodeModules = 'C:/Users/LENOVO_LEGION/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/';
const { chromium } = createRequire(npxNodeModules)('playwright');

const EXE = 'C:/Users/LENOVO_LEGION/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const HARNESS = resolve(here, '../assets/render-tn.js');
const OUT_DIR = resolve(here, '../assets');

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:9292/', { waitUntil: 'domcontentloaded' });
// Let the page's own modules settle so WebGL/WebP encoders behave like the live site.
await page.waitForTimeout(1200);
await page.addScriptTag({ content: readFileSync(HARNESS, 'utf8') });

await page.waitForFunction(() => window.__tnDone === true, null, { timeout: 110000 });
const error = await page.evaluate(() => window.__tnError ?? null);
if (error) throw new Error(`Harness failed: ${error}`);

const renders = await page.evaluate(() => window.__tnRenders);
const bounds = await page.evaluate(() => window.__tnProfileBounds);
for (const [name, dataUrl] of Object.entries(renders)) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  writeFileSync(resolve(OUT_DIR, `tn-${name}.webp`), Buffer.from(base64, 'base64'));
  console.log(`saved tn-${name}.webp (${Math.round(base64.length * 3 / 4 / 1024)} KB)`);
}
console.log('profileBounds', JSON.stringify(bounds));
await browser.close();
