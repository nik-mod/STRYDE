// One-time migration utility. Run FROM THE ORIGINAL REPOSITORY ROOT.
// Liquid is used only to extract the reference once, never to build/run the new app.
import { renderPreview } from "../../tools/preview.mjs";
import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
const out = "independent/design";
await mkdir(`${out}/markup`, { recursive: true });
await cp("src", `${out}/motion`, { recursive: true });
await cp("assets", `${out}/assets`, {
  recursive: true,
  filter: (src) => !src.endsWith(".js"),
});
await cp(
  "assets/commerce-transitions.js",
  `${out}/assets/commerce-transitions.js`,
);
const html = await renderPreview("/");
const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
const intro = html
  .match(/<div[^>]*data-site-intro[\s\S]*?<\/div>\s*<a class="skip-link"/)?.[0]
  ?.replace(/\s*<a class="skip-link"$/, "");
// The intro is nested; delimit it by the known sibling rather than a closing tag.
const before = html
  .split('<a class="skip-link"')[0]
  .split(/<aside class="preview-notice"[^>]*>[\s\S]*?<\/aside>/)[1];
const header = html
  .match(/<header class="site-header">[\s\S]*?<\/header>/)[0]
  .replace(/<a class="account-link[\s\S]*?<\/a>/, "")
  .replaceAll("/collections/all#CollectionSearch", "/search");
const footer = html.match(
  /<footer class="site-footer[^>]*>[\s\S]*?<\/footer>/,
)[0];
const journey =
  html.match(
    /<nav class="journey-nav"[\s\S]*?<\/nav>\s*<div class="journey-progress"[\s\S]*?<\/div>/,
  )?.[0] || "";
for (const [name, value] of Object.entries({
  home: main,
  intro: before,
  header,
  footer,
  journey,
}))
  await writeFile(`${out}/markup/${name}.html`, value || "");
await writeFile(
  `${out}/markup/variables.css`,
  html.match(/<style>([\s\S]*?)<\/style>/)[1],
);
await writeFile(
  `${out}/markup/intro-bootstrap.js`,
  html.match(/<script>\s*(\(\(\) => \{[\s\S]*?)<\/script>/)[1],
);
let theme = await readFile(`${out}/motion/theme.mjs`, "utf8");
theme = theme
  .replace(
    "import { mountProduct, mountRecommendations } from './commerce.mjs';",
    "import { mountProductGallery } from './product-gallery.mjs';\nconst mountProduct = root => { const gallery = mountProductGallery(root); return () => gallery.dispose(); };\nconst mountRecommendations = () => () => {};",
  )
  .replace(
    /import \{ mountCartDrawer \}[^\n]+/,
    "const mountCartDrawer = () => () => {};",
  )
  .replace(
    /import \{ mountCartPage \}[^\n]+/,
    "const mountCartPage = () => () => {};",
  )
  .replace(
    /import \{ mountPredictiveSearch \}[^\n]+/,
    "const mountPredictiveSearch = () => () => {};",
  )
  .replace(/^document.addEventListener\('shopify:section:.*\r?\n/gm, "")
  .replace(
    "modalObserver.disconnect();",
    "modalObserver.disconnect(); scheduler.dispose();",
  );
await writeFile(`${out}/motion/theme.mjs`, theme);
const introController = await readFile(
  `${out}/motion/motion/site-intro.mjs`,
  "utf8",
);
await writeFile(
  `${out}/motion/motion/site-intro.mjs`,
  introController.replace(
    "[...root.parentElement.children].filter(element => element !== root)",
    "[...document.querySelectorAll('.document-shell > *, body > *')].filter(element => element !== root && !element.contains(root) && element.tagName !== 'SCRIPT')",
  ),
);
// Exclude old commerce implementations from the independent source tree.
for (const file of [
  "commerce.mjs",
  "cart.mjs",
  "cart-drawer.mjs",
  "cart-page.mjs",
  "product-form.mjs",
  "predictive-search.mjs",
]) {
  const { unlink } = await import("node:fs/promises");
  await unlink(`${out}/motion/${file}`);
}
console.log(
  "Reference markup, CSS, fonts, models and motion copied without changing originals.",
);
