import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const roots = ['layout', 'assets', 'sections', 'snippets', 'templates', 'config', 'locales'];
const files = [];
async function walk(directory) { for (const name of await readdir(directory)) { const file = `${directory}/${name}`; if ((await stat(file)).isDirectory()) await walk(file); else files.push(file); } }
for (const directory of roots) await walk(directory);
const sections = new Set(files.filter(file => file.startsWith('sections/') && file.endsWith('.liquid')).map(file => file.slice(9, -7)));
for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (/\.(liquid|js|css|json)$/.test(file)) {
    assert.ok(!/^(?:<<<<<<< .+|=======|>>>>>>> .+)\r?$/m.test(source), `${file}: unresolved merge conflict`);
  }
  if (file.endsWith('.json')) {
    const data = JSON.parse(source);
    if (file.startsWith('templates/') || /sections\/.*-group\.json$/.test(file)) {
      assert.ok(Array.isArray(data.order), `${file}: missing order`);
      for (const id of data.order) assert.ok(data.sections[id], `${file}: unknown ordered section ${id}`);
      for (const section of Object.values(data.sections)) assert.ok(sections.has(section.type), `${file}: missing section type ${section.type}`);
    }
  }
  if (file.startsWith('sections/') && file.endsWith('.liquid')) {
    const schemaMatch = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
    assert.ok(schemaMatch, `${file}: schema required`);
    const schema = JSON.parse(schemaMatch[1]);
    assert.ok(schema.name.length <= 25, `${file}: section name too long`);
    const ids = (schema.settings || []).map(setting => setting.id).filter(Boolean);
    assert.equal(ids.length, new Set(ids).size, `${file}: duplicate setting IDs`);
  }
  if (file.endsWith('.liquid')) for (const match of source.matchAll(/{%\s*render\s+'([^']+)'/g)) assert.ok(files.includes(`snippets/${match[1]}.liquid`), `${file}: missing snippet ${match[1]}`);
  if (file.endsWith('.js')) for (const match of source.matchAll(/(?:from|import)\s*\(?["']\.\/([^"']+\.js)["']/g)) assert.ok(files.includes(`assets/${match[1]}`), `${file}: missing bundled chunk ${match[1]}`);
}
const layout = await readFile('layout/theme.liquid', 'utf8');
for (const required of ['content_for_header', 'content_for_layout', "sections 'header-group'", "sections 'footer-group'", 'skip-link', 'canonical_url']) assert.ok(layout.includes(required), `Layout missing ${required}`);
assert.ok(files.includes('assets/theme.js'), 'Run npm run build before validation');
const index = JSON.parse(await readFile('templates/index.json', 'utf8'));
const homepage = ['cinematic-hero', 'chapter-deconstruction', 'chapter-materials', 'chapter-technology', 'chapter-collection', 'chapter-featured', 'chapter-brand', 'chapter-finale'];
assert.equal(index.order.length, homepage.length, 'Homepage must stage the eight cinematic chapters');
homepage.forEach((type, position) => assert.equal(index.sections[index.order[position]].type, type, `Homepage chapter ${position + 1} must be ${type}`));
for (const template of ['product', 'collection', 'cart', 'search', 'page', '404']) assert.ok(files.includes(`templates/${template}.json`), `Missing commerce template ${template}`);
for (const template of ['page.contact', 'page.faq', 'page.size-guide']) assert.ok(files.includes(`templates/${template}.json`), `Missing content template ${template}`);
for (const template of ['login', 'register', 'account', 'order', 'addresses', 'activate_account', 'reset_password']) assert.ok(files.includes(`templates/customers/${template}.json`), `Missing customer template ${template}`);
for (const section of ['cart-drawer', 'predictive-search', 'product-recommendations', 'main-contact', 'main-faq', 'main-size-guide']) assert.ok(files.includes(`sections/${section}.liquid`), `Missing commerce section ${section}`);
const english = JSON.parse(await readFile('locales/en.default.json', 'utf8'));
const georgian = JSON.parse(await readFile('locales/ka.json', 'utf8'));
const localeKeys = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => typeof value === 'object' && value !== null ? localeKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`]);
const missingGeorgian = localeKeys(english).filter(key => !localeKeys(georgian).includes(key));
assert.deepEqual(missingGeorgian, [], `locales/ka.json is missing keys: ${missingGeorgian.join(', ')}`);
console.log(`Validated ${files.length} theme files, JSON schemas, section/snippet references, bundled chunks, commerce templates and the eight-chapter homepage.`);
