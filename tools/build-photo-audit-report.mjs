/** Record a decision for every image in the manually reviewed 28 contact sheets. */
import { readFile, writeFile } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const inventory = await read('reference/photo-audit/inventory.json');
const flags = await read('tools/fixtures/photo-audit-flags.json');
const archive = await read('tools/fixtures/photo-shop.json');
const replacements = [...await read('tools/fixtures/stockx-edit.json'), ...await read('tools/fixtures/photo-replacements.json')].filter(item => item.replacesProductId);
const byId = new Map(replacements.map(item => [item.replacesProductId, item]));
const poor = new Set(flags.replacement);
const detail = new Set(flags.detail);
const singleView = new Set(archive.filter(item => item.photos.length === 1).map(item => item.id));
const rows = inventory.map(photo => {
  const replacement = byId.get(photo.productId);
  const isOriginal = photo.kind === 'archive';
  const reasons = [];
  if (poor.has(photo.index)) reasons.push('Visual issue: hands, scene/background, damaged cutout, blur, packaging, collage, or incomplete shoe.');
  if (detail.has(photo.index)) reasons.push(singleView.has(photo.productId) ? 'Detail-only image is the only product photo; needs a full-shoe cover.' : 'Secondary detail view; acceptable only alongside a full-shoe cover.');
  if (flags.notes[photo.index]) reasons.push(flags.notes[photo.index]);
  const needsSource = poor.has(photo.index) || detail.has(photo.index) && singleView.has(photo.productId);
  const status = !isOriginal ? 'supplier-studio-photo' : replacement ? 'replaced' : needsSource ? 'exact-source-needed' : detail.has(photo.index) ? 'secondary-detail' : 'studio-compatible';
  return { ...photo, status, reasons, currentPhotos: replacement?.photos || null, supplier: replacement?.sourceUrl || null, matchNotes: replacement?.matchNotes || null };
});
const count = status => rows.filter(row => row.status === status).length;
const unresolvedProducts = [...new Set(rows.filter(row => row.status === 'exact-source-needed').map(row => row.productId))];
const summary = {
  catalogProducts: 908, originalArchiveProducts: archive.length, reviewedPhotos: rows.length,
  reviewedContactSheets: 28, originalArchivePhotos: rows.filter(row => row.kind === 'archive').length,
  replacedProducts: byId.size, newStockXMatches: (await read('tools/fixtures/reviewed-stockx-matches.json')).reduce((n,group) => n + group.productIds.length, 0),
  counts: Object.fromEntries(['supplier-studio-photo','replaced','exact-source-needed','secondary-detail','studio-compatible'].map(status => [status,count(status)])),
  unresolvedProducts: unresolvedProducts.length,
};
await writeFile('reference/photo-audit/report.json', JSON.stringify({ summary, photos: rows }, null, 2) + '\n');
const note = `# Catalog photography audit\n\nAll ${summary.reviewedPhotos} original and replacement photographs were visually reviewed across 28 contact sheets. This includes ${summary.originalArchivePhotos} archive photographs; it is not a count of currently displayed images. All 908 catalog entries remain.\n\n${summary.newStockXMatches} additional existing product entries now use reviewed StockX photographs. ${summary.replacedProducts} archive product entries have supplier replacements in total, including the earlier official Golden Goose match.\n\n${summary.counts['exact-source-needed']} original photos across ${summary.unresolvedProducts} products still need an exact source. These have NOT been fixed or hidden. Some show shelves, mixed models, packaging, close-ups or insufficient markings. StockX candidates with different colors, soles, materials or details were rejected. Exact model/color/SKU information is needed to finish those replacements.\n\nThe JSON report records every photograph, its original path, contact sheet, visual decision, current supplier and replacement photo. Secondary details are separate from unsuitable single-photo covers.\n\n## Original photo decisions\n\n${Object.entries(summary.counts).map(([key,value]) => `- ${key}: ${value}`).join('\n')}\n\n## Still needing an exact source\n\n${unresolvedProducts.map(id => `- [${id}](http://localhost:9292/products/${id})`).join('\n')}\n`;
await writeFile('reference/photo-audit/README.md', note + `\n## Reviewed contact sheets\n\n${Array.from({length:28},(_,index)=>{ const number=String(index+1).padStart(2,'0'); return `- [Sheet ${number}](sheet-${number}.png)`; }).join('\n')}\n\n[Per-photo decisions](report.json) · [Updated collection](updated-collection.png) · [Updated product](updated-product.png) · [Mobile verification](updated-mobile.png)\n`);
console.log(JSON.stringify(summary,null,2));
