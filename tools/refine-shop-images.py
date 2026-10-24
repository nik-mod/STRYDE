"""Tighten and center uncertain Takeout photos on pure white shop tiles.

Only a visually reviewed allowlist of isolated shoes receives a second
background-removal pass. Other photos keep their full contents; only large
near-white perimeter space is trimmed. Original source files stay untouched.
"""
from collections import Counter
from pathlib import Path
import json

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tools" / "fixtures" / "photo-shop.json"
REVIEW = ROOT / "tools" / "fixtures" / "photo-image-review.json"
CANVAS = 1000
MAX_SUBJECT = 860
WHITE_THRESHOLD = 248
MASK_THRESHOLD = 128
CLEAN_CUTOUTS = {
    "Internet_20240205_203942_3.jpeg", "Internet_20240206_233756_5.jpeg",
    "Internet_20240210_094825_3.jpeg", "Internet_20240215_053057_3.jpeg",
    "Internet_20240512_002141_1.jpeg", "Internet_20240512_002452_1.jpeg",
    "Internet_20240512_002452_2.jpeg", "Internet_20240512_002452_3.jpeg",
    "Internet_20240512_002548_1.jpeg", "Internet_20240512_002548_2.jpeg",
    "Internet_20240512_002548_3.jpeg", "Internet_20240512_002548_6.jpeg",
    "Internet_20240512_002754_1.jpeg", "Internet_20240512_002754_2.jpeg",
    "Internet_20240512_002754_3.jpeg", "Internet_20241119_003212_1.jpeg",
    "Internet_20241207_124107_1.jpeg", "Internet_20241207_124107_3.jpeg",
    "Internet_20241207_124812_2.png", "Internet_20250704_163325_4.jpeg",
    "Internet_20260307_131708_1.jpeg", "Screenshot_20241128_235038_CapCut.jpg",
    "Screenshot_20241128_235102_CapCut.jpg", "Screenshot_20241128_235115_CapCut.jpg",
    "Screenshot_20241128_235012_CapCut.jpg",
}


def fit_white(source):
    source = source.convert("RGB")
    source.thumbnail((MAX_SUBJECT, MAX_SUBJECT), Image.Resampling.LANCZOS)
    result = Image.new("RGB", (CANVAS, CANVAS), "white")
    result.paste(source, ((CANVAS - source.width) // 2,
                          (CANVAS - source.height) // 2))
    return result


def trim_near_white_margin(source):
    """Crop only blank-looking perimeter space, with generous safety padding."""
    rgb = np.asarray(source.convert("RGB"))
    content = np.min(rgb, axis=2) < WHITE_THRESHOLD
    ys, xs = np.where(content)
    if not len(xs):
        return fit_white(source), False

    left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    width, height = right - left, bottom - top
    if width >= source.width * 0.97 and height >= source.height * 0.97:
        return fit_white(source), False

    padding = max(16, round(max(width, height) * 0.055))
    box = (max(0, left - padding), max(0, top - padding),
           min(source.width, right + padding), min(source.height, bottom + padding))
    return fit_white(source.crop(box)), True


def get_subject_mask(alpha):
    labels, count = ndimage.label(alpha >= MASK_THRESHOLD)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    if count == 0 or sizes.max() == 0:
        return np.zeros(alpha.shape, dtype=bool)
    order = np.argsort(sizes[1:])[::-1] + 1
    keep = [int(order[0])]
    if len(order) > 1 and sizes[order[1]] >= sizes[order[0]] * 0.55:
        keep.append(int(order[1]))
    return np.isin(labels, keep)


def clean_cutout(source, bits):
    ys, xs = np.where(bits)
    left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    margin = max(10, round(max(right - left, bottom - top) * 0.045))
    box = (max(0, left - margin), max(0, top - margin),
           min(source.width, right + margin), min(source.height, bottom + margin))
    rgba = source.convert("RGBA")
    rgba.putalpha(Image.fromarray(bits.astype(np.uint8) * 255, "L").filter(
        ImageFilter.GaussianBlur(0.65)))
    subject = rgba.crop(box)
    subject.thumbnail((MAX_SUBJECT, MAX_SUBJECT), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), "white")
    canvas.alpha_composite(subject, ((CANVAS - subject.width) // 2,
                                    (CANVAS - subject.height) // 2))
    return canvas.convert("RGB")


def cover_score(photo):
    path = ROOT / photo["src"].lstrip("/")
    with Image.open(path) as opened:
        rgb = np.asarray(opened.convert("RGB"))
    ys, xs = np.where(np.min(rgb, axis=2) < 245)
    if not len(xs):
        return -1
    width, height = int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)
    aspect = width / height
    occupancy = width * height / (CANVAS * CANVAS)
    if width < 300 or height < 150 or not 0.38 <= aspect <= 3.5:
        return -1
    return max(0, 1 - abs(aspect - 1.9) / 2) * 0.8 + min(1, occupancy / 0.3) * 0.5


def main():
    catalog = json.loads(MANIFEST.read_text())
    summary = Counter()
    remaining = []
    session = new_session("isnet-general-use")
    fallback_treatments = ("scene-", "shoe-cutout-refined")

    for photo in (p for product in catalog for p in product["photos"]
                  if p.get("imageTreatment", "").startswith(fallback_treatments)):
        catalog_path = ROOT / photo["src"].lstrip("/")
        source_path = catalog_path.with_name(
            catalog_path.name.removesuffix("-white.webp") + ".webp")
        with Image.open(source_path) as opened:
            source = opened.convert("RGB")
        treatment = "scene-preserved"
        canvas = None
        if photo["source"] in CLEAN_CUTOUTS:
            predicted = remove(source, session=session)
            bits = get_subject_mask(np.asarray(predicted.getchannel("A")))
            area = int(bits.sum())
            if area:
                ys, xs = np.where(bits)
                left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
                bw, bh = right - left, bottom - top
                coverage = area / (source.width * source.height)
                bbox_coverage = bw * bh / (source.width * source.height)
                safe_margin = min(left, top, source.width - right, source.height - bottom)
                aspect = bw / bh
                solidity = area / (bw * bh)
                if (0.045 <= coverage <= 0.68 and 0.12 <= bbox_coverage <= 0.78 and
                        0.42 <= aspect <= 3.15 and safe_margin >= min(source.size) * 0.015 and
                        solidity >= 0.28):
                    canvas = clean_cutout(source, bits)
                    treatment = "shoe-cutout-refined"
        if canvas is None:
            canvas, trimmed = trim_near_white_margin(source)
            treatment = "scene-trimmed" if trimmed else "scene-preserved"
        canvas.save(catalog_path, "WEBP", quality=90, method=5)
        photo["imageTreatment"] = treatment
        summary[treatment] += 1
        if treatment.startswith("scene-"):
            remaining.append({"source": photo["source"], "imageTreatment": treatment})

    # Keep photo galleries in their original order, but use a clean shoe view
    # on the collection card when the first Takeout frame includes a scene.
    for product in catalog:
        photos = product["photos"]
        product.pop("coverPhoto", None)
        if photos and photos[0].get("imageTreatment", "").startswith("scene-"):
            candidates = [photo for photo in photos
                          if photo.get("imageTreatment", "").startswith("shoe-cutout")]
            if candidates:
                best = max(candidates, key=cover_score)
                if best is not photos[0] and cover_score(best) >= 0:
                    product["coverPhoto"] = best

    MANIFEST.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    REVIEW.write_text(json.dumps(remaining, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"processed": sum(summary.values()),
                      "treatments": dict(summary),
                      "unchanged_full_frames": len(remaining)}))


if __name__ == "__main__":
    main()
