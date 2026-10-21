import { build } from 'esbuild';
import { buildOptions, pruneChunks } from './build-config.mjs';
const result = await build(buildOptions);
await pruneChunks(result);
console.log('Built assets/theme.js and lazy scene chunks.');
