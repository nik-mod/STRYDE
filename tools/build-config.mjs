import { readdir, unlink } from 'node:fs/promises';
import { basename } from 'node:path';

export const buildOptions = {
  entryPoints: { theme: 'src/theme.mjs' },
  outdir: 'assets', bundle: true, splitting: true, format: 'esm',
  target: ['es2022'], minify: true, sourcemap: false,
  chunkNames: '[name]-[hash]', legalComments: 'eof', metafile: true,
};

export function isGeneratedScript(file) {
  return /^(theme\.js|((?:journey-scene|spotlight-scene|scene|chunk)-).*\.js)$/.test(basename(file));
}

export async function pruneChunks(result) {
  const current = new Set(Object.keys(result.metafile.outputs).map(file => basename(file)));
  for (const file of await readdir('assets')) {
    if (/^((?:journey-scene|spotlight-scene|scene|chunk)-).*\.js$/.test(file) && !current.has(file)) await unlink(`assets/${file}`);
  }
}
