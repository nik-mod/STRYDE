// Start the complete local stack in dependency order. Reuse healthy services;
// only stop children created by this invocation. Existing database data stays.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import net from 'node:net';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = await readFile(resolve(root, 'backend/.env'), 'utf8');
const database = new URL(env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim() || '');
const localDatabase = ['127.0.0.1', 'localhost'].includes(database.hostname);
if (!localDatabase && !/^STRYDE_ALLOW_REMOTE_DATABASE=true\s*$/m.test(env)) throw new Error('Remote database requires STRYDE_ALLOW_REMOTE_DATABASE=true.');
const children = [];
let stopping = false;
const pause = ms => new Promise(done => setTimeout(done, ms));
const open = (port, host = '127.0.0.1') => new Promise(done => {
  const socket = net.connect({ host, port });
  const finish = value => { socket.destroy(); done(value); };
  socket.once('connect', () => finish(true)); socket.once('error', () => finish(false)); socket.setTimeout(1000, () => finish(false));
});
const healthy = async (port, path) => {
  try { return (await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; }
};
function start(role, script, args, cwd, ipc = false) {
  console.log(`[STRYDE] Starting ${role}…`);
  const child = spawn(process.execPath, [script, ...args], { cwd, windowsHide: true, stdio: ipc ? ['inherit','inherit','inherit','ipc'] : 'inherit' });
  children.push({ role, child });
  child.once('error', () => { console.error(`[STRYDE] Could not start ${role}.`); void shutdown(1); });
  child.once('exit', code => { if (!stopping) { console.error(`[STRYDE] ${role} exited (${code ?? 'signal'}).`); void shutdown(1); } });
  return child;
}
async function waitFor(check, name, timeout = 120000) {
  const until = Date.now() + timeout;
  while (!stopping && Date.now() < until) { if (await check()) return; await pause(500); }
  throw new Error(`${name} did not become ready. Check the service output above.`);
}
async function stopTree(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  if (process.platform === 'win32') await new Promise(done => {
    const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    killer.once('exit', done); killer.once('error', done);
  });
  else child.kill('SIGTERM');
}
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const { role, child } of [...children].reverse()) {
    if (role === 'PostgreSQL' && child.connected) {
      const exited = new Promise(done => child.once('exit', done));
      child.send('stop'); await Promise.race([exited, pause(6000)]);
    }
    await stopTree(child);
  }
  process.exit(code);
}
process.once('SIGINT', () => void shutdown()); process.once('SIGTERM', () => void shutdown());
try {
  if (process.argv.includes('--check')) {
    const state = { database: await open(Number(database.port || 5432), database.hostname), backend: await healthy(9000, '/health'), storefront: await healthy(3000, '/api/health') };
    console.log(JSON.stringify(state)); process.exit(Object.values(state).every(Boolean) ? 0 : 1);
  }
  if (localDatabase && !await open(Number(database.port))) start('PostgreSQL', resolve(root, 'scripts/postgres.mjs'), [], root, true);
  await waitFor(() => open(Number(database.port || 5432), database.hostname), 'PostgreSQL', 30000);
  if (!await healthy(9000, '/health')) {
    if (await open(9000)) throw new Error('Port 9000 is occupied by an unhealthy service.');
    start('Medusa', resolve(root, 'backend/node_modules/@medusajs/cli/cli.js'), ['develop','--host','127.0.0.1'], resolve(root, 'backend'));
    await waitFor(() => healthy(9000, '/health'), 'Medusa');
  }
  if (!await healthy(3000, '/api/health')) {
    if (await open(3000)) throw new Error('Port 3000 is occupied by an unhealthy service.');
    // Use the existing asset pipeline without launching another shell.
    const assets = spawn(process.execPath, [resolve(root, 'scripts/build-motion.mjs')], { cwd: root, windowsHide: true, stdio: 'inherit' });
    if (await new Promise(done => { assets.once('exit', done); assets.once('error', () => done(1)); }) !== 0) throw new Error('Asset build failed.');
    start('Storefront', resolve(root, 'storefront/node_modules/next/dist/bin/next'), ['dev','--webpack','--hostname','127.0.0.1','--port','3000'], resolve(root, 'storefront'));
    await waitFor(() => healthy(3000, '/api/health'), 'Storefront');
  }
  console.log('[STRYDE] Ready: http://127.0.0.1:3000 — commerce: http://127.0.0.1:9000');
  if (!children.length) process.exit(0);
} catch (error) { console.error(`[STRYDE] ${error.message}`); await shutdown(1); }
