import sharp from "sharp";
import { createHash } from "node:crypto";
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export async function inspectImage(buffer: Buffer) {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES)
    throw new Error("Choose a JPEG, PNG or WebP of at most 12 MiB.");
  const image = sharp(buffer, {
    limitInputPixels: 40000000,
    animated: false,
    failOn: "error",
  });
  const m = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(m.format || "") || (m.pages || 1) > 1)
    throw new Error("Only still JPEG, PNG and WebP images are accepted.");
  if (
    !m.width ||
    !m.height ||
    Math.max(m.width, m.height) < 1000 ||
    Math.min(m.width, m.height) < 500
  )
    throw new Error(
      "Use a sharp image at least 1000 pixels on its long side and 500 on its short side.",
    );
  if (m.width / m.height < 0.4 || m.width / m.height > 2.5)
    throw new Error(
      "Use a studio product photograph with a practical gallery aspect ratio.",
    );
  // Decode the complete image; metadata alone does not detect truncated files.
  await image.clone().stats();
  return {
    width: m.width,
    height: m.height,
    format: m.format!,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}
export async function imageDerivative(buffer: Buffer, width: number) {
  // No crop, background replacement, watermark removal or artificial padding.
  return sharp(buffer, { limitInputPixels: 40000000 })
    .rotate()
    .resize({ width, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 94, effort: 4 })
    .toBuffer();
}
