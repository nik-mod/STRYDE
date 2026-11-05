import "server-only";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const cache = new Map<string, string>();
const assetVersions = new Map<string, { stamp: string; src: string }>();
export async function assetSource(path: string) {
  if (!/^(?:assets\/[a-z-]+\.css|motion\/experience\.js)$/.test(path))
    throw new Error("Invalid design asset");
  const filename = resolve(process.cwd(), "public", path);
  const info = await stat(filename);
  const stamp = `${info.mtimeMs}:${info.size}`;
  let version = assetVersions.get(path);
  if (version?.stamp !== stamp) {
    const digest = createHash("sha256")
      .update(await readFile(filename))
      .digest("hex")
      .slice(0, 16);
    version = { stamp, src: `/${path}?v=${digest}` };
    assetVersions.set(path, version);
  }
  return version.src;
}
export const experienceSource = () => assetSource("motion/experience.js");
export async function design(name: string) {
  if (!/^[a-z-]+\.(html|css|js)$/.test(name))
    throw new Error("Invalid design resource");
  // Markup changes must reach the local preview without restarting commerce.
  // Production resources are immutable for the lifetime of a deployment.
  if (process.env.NODE_ENV === "development")
    return (await readFile(resolve(process.cwd(), "design", name), "utf8")).replace(/\r\n?/g, "\n");
  if (!cache.has(name))
    cache.set(
      name,
      (await readFile(resolve(process.cwd(), "design", name), "utf8")).replace(/\r\n?/g, "\n"),
    );
  return cache.get(name)!;
}
