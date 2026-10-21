import { readFile, mkdir, copyFile, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
await import('./build.mjs');
await import('./validate.mjs');
const cli = resolve('node_modules/@shopify/cli/bin/run.js');
function shopify(args) {
  const result = spawnSync(process.execPath, [cli, ...args, '--path', '.', '--no-color', '--no-input'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Shopify ${args.join(' ')} exited ${result.status}`);
}
shopify(['theme', 'check']);
shopify(['theme', 'package']);
const schema = JSON.parse(await readFile('config/settings_schema.json', 'utf8'));
const info = schema.find(group => group.name === 'theme_info');
const filename = `${info.theme_name}-${info.theme_version}.zip`;
await mkdir('dist', { recursive: true });
await copyFile(filename, 'dist/stryde-m01.zip');
await unlink(filename);
console.log('Packaged dist/stryde-m01.zip using Shopify CLI (theme folders only).');
