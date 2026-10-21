import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createReloadQueue } from '../tools/dev-reload.mjs';
import { startDevelopment } from '../tools/dev.mjs';

async function until(predicate) {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Development event timed out');
    await delay(5);
  }
}

test('rapid source saves serialize builds; refresh waits for successful completion', async () => {
  const events = []; let finish; let builds = 0;
  const queue = createReloadQueue({ debounce: 5, broadcast: (...event) => events.push(event), rebuild: async () => { builds++; await new Promise(resolve => { finish = resolve; }); } });
  try {
    queue.add('src/theme.mjs'); await until(() => builds === 1);
    assert.equal(builds, 1); assert.equal(events.length, 0);
    queue.add('src/scene.mjs'); queue.add('assets/theme.css'); await delay(20);
    assert.equal(builds, 1, 'A second save must not start a competing build');
    finish(); await until(() => builds === 2);
    assert.equal(events.length, 1); assert.equal(builds, 2);
    finish(); await until(() => events.length === 2);
    assert.equal(events.length, 2);
    assert.deepEqual(events[1][1].files.sort(), ['assets/theme.css', 'src/scene.mjs']);
  } finally { finish?.(); await queue.close(); }
});

test('a failed source build keeps the page and a later save can recover', async () => {
  const events = []; let attempts = 0;
  const queue = createReloadQueue({ debounce: 5, broadcast: (...event) => events.push(event), rebuild: async () => { if (++attempts === 1) throw new Error('Intentional test failure'); } });
  try {
    queue.add('src/theme.mjs'); await until(() => events.length === 1);
    assert.equal(events[0][0], 'build-error');
    queue.add('src/theme.mjs'); await until(() => events.length === 2);
    assert.equal(events[1][0], 'reload'); assert.equal(events[1][1].rebuilt, true);
  } finally { await queue.close(); }
});

test('local dev serves the same Liquid without authentication and watches CSS and source JS', async () => {
  const development = await startDevelopment({ port: 0, debounce: 20 });
  const abort = new AbortController(); const suffix = `${process.pid}-${Date.now()}`;
  const css = `assets/dev-check-${suffix}.css`; const source = `src/dev-check-${suffix}.mjs`;
  let reader;
  try {
    const page = await fetch(development.url);
    const html = await page.text();
    assert.equal(page.status, 200); assert.match(html, /data-foundation/); assert.match(html, /data-stryde-dev/);
    assert.match(html, /COMMERCE DISABLED/);
    assert.equal((await fetch(`${development.url}/cart/add`, { method: 'POST' })).status, 405);
    const stream = await fetch(`${development.url}/__stryde_dev/events`, { signal: abort.signal });
    assert.match(stream.headers.get('content-type'), /text\/event-stream/); reader = stream.body.getReader();
    const decoder = new TextDecoder();
    async function until(pattern) {
      let text = ''; const timeout = setTimeout(() => abort.abort(), 8000);
      try {
        while (!pattern.test(text)) {
          const { value, done } = await reader.read(); assert.equal(done, false);
          text += decoder.decode(value, { stream: true });
        }
        return text;
      } finally { clearTimeout(timeout); }
    }
    await until(/event: hello/);
    await writeFile(css, '/* filesystem CSS reload check */');
    const cssEvent = await until(new RegExp(`event: reload[\\s\\S]*dev-check-${suffix}\\.css`));
    assert.match(cssEvent, /"rebuilt":false/);
    await writeFile(source, '// filesystem source rebuild check\n');
    const jsEvent = await until(new RegExp(`event: reload[\\s\\S]*dev-check-${suffix}\\.mjs`));
    assert.match(jsEvent, /"rebuilt":true/);
  } finally {
    abort.abort(); await reader?.cancel().catch(() => {}); await development.close();
    await rm(css, { force: true }); await rm(source, { force: true });
  }
});
