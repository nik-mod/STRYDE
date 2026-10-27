// Rebuild after changing bundled GLBs or authored journey poses. This moves
// whole-tour hull fitting out of the visitor's loading/scrolling frame.
import { readFile, writeFile } from 'node:fs/promises';
import { Vector3 } from 'three';
import { chapterCameraDistance, STUDY_EXCHANGE_RADIUS } from '../../src/journey-transition.mjs';

const files = ['nike-tn-blue-white', 'nike-tn-monochrome', 'nike-tn-deep-blue'];
const points = await Promise.all(files.map(async (name, index) => {
  const bytes = await readFile(new URL(`../../assets/${name}.glb`, import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  const hull = gltf.scenes[gltf.scene || 0].extras.strydeFramingHull.map(p => new Vector3(...p).applyAxisAngle(new Vector3(0, 1, 0), index === 0 ? Math.PI / 2 : 0));
  const min = new Vector3(Infinity, Infinity, Infinity), max = min.clone().negate();
  hull.forEach(p => { min.min(p); max.max(p); });
  const center = min.clone().add(max).multiplyScalar(.5), size = max.clone().sub(min);
  return hull.map(p => p.sub(center).multiplyScalar(2.6 / Math.max(size.x, size.y, size.z)));
}));
const layouts = { hero: [0], deconstruction: [1], materials: [0, 1, 2], technology: [0], featured: [2], brand: [0] };
const aspects = Array.from({ length: 49 }, (_, i) => .2 * 40 ** (i / 48));
const data = {};
for (const [chapter, models] of Object.entries(layouts)) {
  const exchangeRanges = chapter === 'materials' ? [1, 2].flatMap(i => [[i / 3 - STUDY_EXCHANGE_RADIUS, i / 3 + STUDY_EXCHANGE_RADIUS], [(i + .16) / 3, (i + .64) / 3]]) : [];
  data[chapter] = aspects.map(aspect => Math.ceil(chapterCameraDistance(models.map(i => points[i]), chapter, { aspect, includeExchange: !!exchangeRanges.length, exchangeRanges }) * 1e6) / 1e6);
}
await writeFile(new URL('../../src/journey-cameras.mjs', import.meta.url), `// Generated from the actual normalized GLB framing hulls and authored poses.\n// Linear interpolation in reciprocal aspect is a conservative camera fit.\nconst aspects = ${JSON.stringify(aspects)};\nconst distances = ${JSON.stringify(data)};\nexport function bundledJourneyCamera(chapter, aspect) {\n  const track = distances[chapter];\n  if (!track || aspect < aspects[0] || aspect > aspects.at(-1)) return null;\n  for (let i = 1; i < aspects.length; i++) if (aspect <= aspects[i]) {\n    const p = (1 / aspect - 1 / aspects[i - 1]) / (1 / aspects[i] - 1 / aspects[i - 1]);\n    return track[i - 1] + (track[i] - track[i - 1]) * p;\n  }\n  return track.at(-1);\n}\n`);
