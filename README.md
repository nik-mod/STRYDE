# STRYDE — Shopify cinematic foundation

Milestone 01 of a custom Shopify Online Store 2.0 theme. This milestone establishes the storefront, design system and reusable motion infrastructure. The eight finished cinematic scenes require the licensed assets and later milestones documented in [the architecture](docs/ARCHITECTURE.md), [asset intake](docs/ASSETS.md) and [milestone checklist](docs/MILESTONES.md).

The visual system uses sky blue, cyan and silver, oversized italic type, an original temporary concept sneaker and restrained scroll-controlled framing. See [the design audit](docs/DESIGN-AUDIT.md) and [direction and chapter palette map](docs/VISUAL-DIRECTION.md). The generated cutout is labeled as temporary artwork; authentic configured product imagery/GLB replaces it. This is still M01, not the complete eight-chapter film.

Use Node 22+ (Node 24 tested). Dependencies are pinned with a lockfile; compiled storefront assets are bundled locally with no runtime CDN dependency.

Start local development without Shopify authentication:

```powershell
npm ci
npm run dev
```

Open **http://localhost:9292**. The command builds the JavaScript bundle first, then serves the same Liquid templates and fixtures used by the standalone preview. Saves to `src`, `assets`, `layout`, `sections`, `snippets`, `templates`, `config` and `locales` automatically refresh open browser pages. Source JavaScript rebuilds incrementally before refresh; failed builds leave the current page in place until the source is fixed. No new dependencies or Shopify credentials are required. Press Ctrl+C to stop the server and watchers.

For validation and theme packaging:

```powershell
npm run build
npm test
npm run validate
npm run theme:check
npm run theme:package
```

`theme:package` rebuilds, validates and writes `dist/stryde-m01.zip`, containing only `layout`, `assets`, `sections`, `snippets`, `templates`, `config` and `locales`. Upload this ZIP in Shopify's theme library as an unpublished theme. `src`, developer tools, dependencies, docs, fixtures and private environment files never enter the package.

`npm run preview` remains available for an unwatched local preview. Run `npm run build` after source JavaScript edits when using that command. Restart the dev server after changing the tooling in `tools/` or installing dependencies. If port 9292 is in use, stop the previous server or choose another port with `$env:PORT='9293'; npm run dev` in PowerShell.

For a preview using an authenticated Shopify store:

```powershell
npm run theme:dev -- --store your-store.myshopify.com
```

For an unwatched local layout review:

```powershell
npm run preview
```

Open `http://127.0.0.1:9292`. This server renders the **same Liquid templates** with a small Shopify-tag adapter. A visible notice identifies fixture mode. Commerce is disabled and POST requests are rejected. `/products/preview-product?variant=103` checks a sold-out deep link; `/collections/all?fixtures=1`, `/cart?fixtures=1` and `/search?q=footwear&fixtures=1` show explicitly labeled fixture data. `/?fixtures=1&variant=102` exercises the hero product data; add `&image=1` for a clearly labeled local test image that replaces the concept artwork. `/?model=/licensed-test.glb` exercises the model-only branch. The default homepage discloses its concept artwork and unselected product; the collection has an honest catalog empty state. The harness is not a Shopify emulator.

Configure global Brand and Colors in Theme Editor. Choose an actual product/collection, licensed image and optional GLB URL under Cinematic foundation. No supplied reference image is used as merchandise. Store policies appear only when configured. A native cart page is provided; drawer polish belongs to later commerce work.

An optional product `custom.cinematic_model` file metafield supplies the GLB and `custom.materials` rich-text metafield supplies materials content. See asset intake for exact model component names, licenses and budgets.

For a future approved deployment, first authenticate to the correct store and push **unpublished**:

```powershell
npx shopify theme push --unpublished --store your-store.myshopify.com
```

Review the generated preview link, test real variants/cart/checkout and obtain explicit publication approval before publishing. Do not use `--live`, overwrite the live theme or publish as part of a routine build. No deployment has been run in M01.

`npm run theme:check` uses the pinned Shopify CLI. Local structural/tests complement it; only a connected store can validate platform behavior and checkout. Current CLI dependencies have moderate npm audit advisories in their logging chain; storefront runtime dependencies have no reported advisories at installation. Re-audit before release. Production 60 FPS, real 3D fidelity and complete film continuity remain unverified until licensed assets and store access exist.
