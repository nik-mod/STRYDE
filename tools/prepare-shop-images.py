"""Create centered white-background catalog images without overwriting sources.

Requires rembg[CPU] with isnet-general-use weights and Pillow. The manifest
continues to point at the unmodified Takeout photos until the batch finishes.
Low-confidence masks fall back to a centered, uncropped source image on white.
"""
from collections import Counter
from pathlib import Path
import argparse
import json

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tools" / "fixtures" / "photo-shop.json"
CANVAS = 1000
MAX_SUBJECT = 820
MASK_THRESHOLD = 128


def largest_components(alpha):
    labels, count = ndimage.label(alpha >= MASK_THRESHOLD)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    if count == 0:
        return np.zeros(alpha.shape, dtype=bool), 0
    order = np.argsort(sizes[1:])[::-1] + 1
    largest = int(sizes[order[0]])
    keep = [int(order[0])]
    # Keep a second shoe when a clean product-pair photo separates the pair.
    if len(order) > 1 and sizes[order[1]] >= largest * 0.55:
        keep.append(int(order[1]))
    selected = np.isin(labels, keep)
    return selected, int(selected.sum())


def centered_white(source, mask=None):
    if mask is None:
        subject = source.convert("RGB")
        subject.thumbnail((MAX_SUBJECT, MAX_SUBJECT), Image.Resampling.LANCZOS)
        x = (CANVAS - subject.width) // 2
        y = (CANVAS - subject.height) // 2
        output = Image.new("RGB", (CANVAS, CANVAS), "white")
        output.paste(subject, (x, y))
        return output

    box = mask.getbbox()
    if not box:
        return centered_white(source)
    # A little breathing room keeps laces and sole edges away from tile edges.
    left, top, right, bottom = box
    margin = max(8, round(max(right - left, bottom - top) * 0.045))
    crop = (max(0, left - margin), max(0, top - margin),
            min(source.width, right + margin), min(source.height, bottom + margin))
    rgba = source.convert("RGBA")
    rgba.putalpha(mask)
    subject = rgba.crop(crop)
    subject.thumbnail((MAX_SUBJECT, MAX_SUBJECT), Image.Resampling.LANCZOS)
    x = (CANVAS - subject.width) // 2
    y = (CANVAS - subject.height) // 2
    output = Image.new("RGBA", (CANVAS, CANVAS), "white")
    output.alpha_composite(subject, (x, y))
    return output.convert("RGB")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="process only the first N photos")
    parser.add_argument("--source", action="append", default=[], help="process a named source photo; may be repeated")
    parser.add_argument("--preview-dir", type=Path, help="write outputs here without changing the manifest")
    args = parser.parse_args()

    catalog = json.loads(MANIFEST.read_text())
    photos = [photo for item in catalog for photo in item["photos"]]
    if args.source:
        wanted = set(args.source)
        photos = [photo for photo in photos if photo["source"] in wanted]
    if args.limit:
        photos = photos[:args.limit]
    preview_dir = args.preview_dir.expanduser().resolve() if args.preview_dir else None
    if preview_dir:
        preview_dir.mkdir(parents=True, exist_ok=True)

    session = new_session("isnet-general-use")
    summary = Counter()
    review = []
    for index, photo in enumerate(photos, 1):
        source_path = ROOT / photo["src"].lstrip("/")
        with Image.open(source_path) as opened:
            source = opened.convert("RGB")
        try:
            cutout = remove(source, session=session)
            alpha = np.asarray(cutout.getchannel("A"))
            selected, area = largest_components(alpha)
            coverage = area / (source.width * source.height)
            ys, xs = np.where(selected)
            bbox_area = ((xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)) if area else 0
            bbox_coverage = bbox_area / (source.width * source.height) if area else 0
            confident = area > 0 and 0.12 <= coverage <= 0.78 and bbox_coverage >= 0.15
            treatment = "shoe-cutout" if confident else "scene-preserved"
            mask = None
            if confident:
                binary = Image.fromarray(np.where(selected, 255, 0).astype(np.uint8), "L")
                mask = binary.filter(ImageFilter.GaussianBlur(0.7))
                canvas = centered_white(source, mask)
            else:
                canvas = centered_white(source)
                review.append({"source": photo["source"], "coverage": round(coverage, 4), "reason": "uncertain foreground"})
        except Exception as error:
            canvas = centered_white(source)
            treatment = "scene-preserved"
            review.append({"source": photo["source"], "reason": f"segmentation error: {type(error).__name__}"})

        original = Path(photo["src"]).name
        target_name = original.removesuffix(".webp") + "-white.webp"
        if preview_dir:
            target = preview_dir / target_name
        else:
            target = source_path.with_name(target_name)
            photo["src"] = photo["src"].removesuffix(".webp") + "-white.webp"
        canvas.save(target, "WEBP", quality=88, method=5)
        photo["imageTreatment"] = treatment
        summary[treatment] += 1
        if index % 100 == 0 or index == len(photos):
            print(f"Processed {index}/{len(photos)} · {dict(summary)}", flush=True)

    if not preview_dir:
        MANIFEST.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
        (ROOT / "tools" / "fixtures" / "photo-image-review.json").write_text(
            json.dumps(review, indent=2, ensure_ascii=False) + "\n"
        )
    print(json.dumps({"processed": len(photos), "treatments": dict(summary), "review": len(review)}))


if __name__ == "__main__":
    main()
