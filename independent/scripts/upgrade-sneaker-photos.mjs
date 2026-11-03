import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { isSneaker } from "../storefront/src/lib/sneaker-selection.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "backend/package.json"));
const sharp = require("sharp");
const catalogFile = resolve(root, "storefront/src/data/stockx-editorial.json");
const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
const cache = resolve(root, ".data/stockx-import/quality");
const raw = resolve(root, ".data/stockx-import/quality-originals");
await mkdir(cache, { recursive: true });
await mkdir(raw, { recursive: true });
const targets = [
  resolve(root, "design/assets/stockx-archive"),
  resolve(root, "storefront/public/assets/stockx-archive"),
];
const report = {
  startedAt: new Date().toISOString(),
  totalEntries: catalog.length,
  sneakerCandidates: catalog.filter(isSneaker).length,
  nonSneakersHidden: catalog.filter((p) => !isSneaker(p)).length,
  processed: 0,
  nativePhotos: 0,
  unavailable: 0,
  networkRequests: 0,
  blocked: false,
  failures: [],
  visible: 0,
};
const jobs = catalog.filter(isSneaker);
let next = 0,
  stopped = false,
  checkpoint = Promise.resolve();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function signature(bytes) {
  return sharp(bytes, { limitInputPixels: 40000000 })
    .flatten({ background: "#fff" })
    .trim({ background: "#fff", threshold: 12 })
    .resize(64, 48, { fit: "contain", background: "#fff" })
    .removeAlpha()
    .raw()
    .toBuffer();
}
async function samePhoto(original, candidate) {
  const a = await signature(original),
    b = await signature(candidate);
  let delta = 0,
    intersection = 0,
    union = 0;
  for (let i = 0; i < a.length; i += 3) {
    const fa = Math.min(a[i], a[i + 1], a[i + 2]) < 235,
      fb = Math.min(b[i], b[i + 1], b[i + 2]) < 235;
    if (fa || fb) {
      union++;
      for (let c = 0; c < 3; c++) delta += Math.abs(a[i + c] - b[i + c]);
    }
    if (fa && fb) intersection++;
  }
  return {
    error: delta / Math.max(1, union * 3),
    overlap: intersection / Math.max(1, union),
  };
}
function candidates(item) {
  const stem = item.originalFilename.slice(0, -4);
  const normalized = stem
    .replace(/^Nike-Nike-/i, "Nike-")
    .replace(/^Air-Air-Jordan-/i, "Air-Jordan-")
    .replace(/^Nike-Air-Jordan-/i, "Air-Jordan-")
    .replace(/^Adidas-/, "adidas-")
    .replace(/^A-Bathing-Ape-Bape-/, "Bape-")
    .replace(/-W$/, "-Womens");
  const urls = [];
  if (item.sourceImageUrl) {
    const u = new URL(item.sourceImageUrl);
    if (u.protocol === "https:" && u.hostname === "images.stockx.com") {
      u.search = "";
      urls.push(u.href);
    }
  }
  for (const name of [stem + "-Product", normalized + "-Product", normalized])
    urls.push(
      `https://images.stockx.com/images/${encodeURIComponent(name)}.jpg`,
    );
  return [...new Set(urls)];
}
async function fetchImage(url) {
  if (stopped) return null;
  report.networkRequests++;
  const r = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 403 || r.status === 429) {
    stopped = true;
    report.blocked = true;
    report.blockStatus = r.status;
    return null;
  }
  if (!r.ok || !r.headers.get("content-type")?.startsWith("image/"))
    return null;
  const reader = r.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > 12 * 1024 * 1024) {
      await reader.cancel();
      return null;
    }
    chunks.push(result.value);
  }
  return Buffer.concat(chunks);
}
async function install(item, record, bytes) {
  const decoded = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
  if (decoded.width < 800 || decoded.height < 200)
    throw new Error("Source is below the minimum native dimensions");
  const output = await sharp(bytes).rotate().webp({ quality: 90 }).toBuffer();
  const sha256 = hash(output),
    filename = `${item.id}-hq-${sha256.slice(0, 12)}.webp`;
  for (const target of targets)
    await writeFile(resolve(target, filename), output);
  item.photos = [
    { src: "/assets/stockx-archive/" + filename, source: record.url, sha256 },
  ];
  item.sourceImageUrl = record.url;
  item.resolution = "native-source";
  item.imageQuality = {
    status: "ready",
    width: decoded.width,
    height: decoded.height,
    originalSha256: hash(bytes),
    matchingError: record.error,
    matchingOverlap: record.overlap,
  };
}
async function upgrade(item) {
  if (!item.archiveSource) {
    const all = await Promise.all(
      item.photos.map(async (p) =>
        sharp(await readFile(resolve(root, "storefront/public" + p.src)), {
          limitInputPixels: 40000000,
        }).metadata(),
      ),
    );
    const width = Math.min(...all.map((m) => m.width || 0)),
      height = Math.min(...all.map((m) => m.height || 0));
    item.imageQuality = {
      status: width >= 800 ? "ready" : "too-small",
      width,
      height,
    };
    if (width >= 800) report.nativePhotos++;
    else report.unavailable++;
    return;
  }
  const key = item.originalSha256,
    recordFile = resolve(cache, key + ".json");
  let record;
  try {
    record = JSON.parse(await readFile(recordFile, "utf8"));
  } catch {}
  if (record?.status === "ready") {
    try {
      await install(item, record, await readFile(resolve(raw, key)));
      report.nativePhotos++;
      return;
    } catch {
      record = undefined;
    }
  }
  if (
    record?.status === "unavailable" &&
    !process.argv.includes("--retry-unavailable")
  ) {
    item.imageQuality = { status: "unavailable" };
    report.unavailable++;
    return;
  }
  const original = await readFile(
    resolve(root, ".data/stockx-import/originals", key + ".jpg"),
  );
  for (const url of candidates(item)) {
    if (stopped) break;
    let bytes;
    try {
      bytes = await fetchImage(url);
    } catch {
      continue;
    }
    if (!bytes) continue;
    try {
      const meta = await sharp(bytes, {
        limitInputPixels: 40000000,
      }).metadata();
      if (meta.width < 800 || meta.height < 200) continue;
      const match = await samePhoto(original, bytes);
      if (match.error > 17 || match.overlap < 0.8) continue;
      record = {
        status: "ready",
        url,
        error: match.error,
        overlap: match.overlap,
        width: meta.width,
        height: meta.height,
      };
      await writeFile(resolve(raw, key), bytes);
      await writeFile(recordFile, JSON.stringify(record));
      await install(item, record, bytes);
      report.nativePhotos++;
      return;
    } catch {}
  }
  item.imageQuality = { status: "unavailable" };
  report.unavailable++;
  if (!stopped)
    await writeFile(recordFile, JSON.stringify({ status: "unavailable" }));
}
async function save() {
  report.visible = catalog.filter(
    (p) => isSneaker(p) && p.imageQuality?.status === "ready",
  ).length;
  const temporary = catalogFile + `.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(catalog) + "\n");
  // Windows/OneDrive can briefly lock the destination during a file refresh.
  // Keep atomic replacement and retry the transient lock, preserving the data.
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(temporary, catalogFile);
      break;
    } catch (error) {
      if (!["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt >= 80)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  await writeFile(
    resolve(root, "evidence/sneaker-photo-upgrade.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
async function worker() {
  while (next < jobs.length && !stopped) {
    const item = jobs[next++];
    try {
      await upgrade(item);
    } catch (e) {
      report.failures.push({ id: item.id, error: e.message });
      item.imageQuality = { status: "unavailable" };
      report.unavailable++;
    }
    report.processed++;
    if (report.processed % 200 === 0) {
      console.log(
        JSON.stringify({
          processed: report.processed,
          nativePhotos: report.nativePhotos,
          unavailable: report.unavailable,
          requests: report.networkRequests,
        }),
      );
      checkpoint = checkpoint.then(save);
      await checkpoint;
    }
  }
}
const concurrency = Math.max(
  1,
  Math.min(32, Number(process.env.STRYDE_PHOTO_WORKERS) || 16),
);
await Promise.all(Array.from({ length: concurrency }, () => worker()));
await checkpoint;
report.finishedAt = new Date().toISOString();
await save();
console.log(JSON.stringify(report));
