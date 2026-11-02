import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "storefront/package.json"));
const { build } = require("esbuild");
await mkdir(resolve(root, "storefront/public/assets"), { recursive: true });
await cp(
  resolve(root, "design/assets"),
  resolve(root, "storefront/public/assets"),
  { recursive: true },
);
await cp(resolve(root, "design/markup"), resolve(root, "storefront/design"), {
  recursive: true,
});
await build({
  entryPoints: { experience: resolve(root, "design/motion/theme.mjs") },
  outdir: resolve(root, "storefront/public/motion"),
  bundle: true,
  splitting: true,
  format: "esm",
  target: ["es2022"],
  minify: true,
  chunkNames: "[name]-[hash]",
  nodePaths: [resolve(root, "storefront/node_modules")],
  legalComments: "eof",
});
console.log("Preserved STRYDE assets and cinematic controllers built.");
