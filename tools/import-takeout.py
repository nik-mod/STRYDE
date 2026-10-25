"""Import every image in a Google Photos Takeout ZIP into a reviewable catalog.

Takeout Internet_<timestamp>_<view> files retain their source-set grouping.
Other filenames are grouped by stable retailer product IDs, exact duplicate
bytes, or explicitly reviewed photo matches. Camera timestamps alone never
merge products; reviewed matches are keyed to source filenames.
"""
from collections import defaultdict
from hashlib import sha256
from pathlib import Path
import json
import re
import subprocess
import sys
import tempfile
import zipfile

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(sys.argv[1]).expanduser()
ASSET_DIR = ROOT / "assets" / "shop-products"
MANIFEST = ROOT / "tools" / "fixtures" / "photo-shop.json"
ASSET_DIR.mkdir(parents=True, exist_ok=True)
for old_asset in ASSET_DIR.glob("pair-*.webp"):
    old_asset.unlink()

image_exts = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic"}
# Human-reviewed views of the same physical shoe. Keep this keyed to original
# Takeout filenames so a re-import does not split a confirmed gallery again.
manual_photo_groups = {
    # November 2024 shop visit: four views of each of two separate shoes.
    **{f"20241125_{stamp}.jpg": "20241125-white-black-low-top" for stamp in (
        "135137", "135142", "135145", "135150")},
    **{f"20241125_{stamp}.jpg": "20241125-black-blue-gum-low-top" for stamp in (
        "135219", "135221", "135224", "135227")},
    **{f"20241125_{stamp}.jpg": "20241125-black-white-pattern-low-top" for stamp in (
        "135432", "135434", "135435", "135437")},
    **{f"20241125_{stamp}.jpg": "20241125-golden-goose-ball-star" for stamp in (
        "140648", "140650", "140651", "140653", "140654")},
    # November 2024: matching in-store views by appearance, including outsole
    # and label shots. Adjacent timestamps that show different shoes stay apart.
    **{f"IMG_20241109_{stamp}.jpg": "20241109-black-grey-orange-runner" for stamp in (
        "155622_878", "155625_542")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-premiata-grey-runner" for stamp in (
        "155627_822", "155630_497", "155632_905")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-grey-orange-air-runner" for stamp in (
        "155635_946", "155638_390", "155646_005", "155651_828")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-black-dg-low-top" for stamp in (
        "155640_696", "155654_476", "155657_475")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-leopard-star-low-top" for stamp in (
        "160040_558", "160045_225", "160047_450", "160052_932", "160054_773", "160058_466")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-white-silver-low-top" for stamp in (
        "160100_015", "160103_173", "160106_265")},
    **{f"IMG_20241109_{stamp}.jpg": "20241109-black-studded-high-top" for stamp in (
        "160101_522", "160104_699", "160109_548", "160111_323")},
    **{f"20241118_{stamp}.jpg": "20241118-white-rockstud-low-top" for stamp in (
        "134058", "134059", "134100")},
    # March 2024 shelf/close-up photos of the same models.
    "20240321_151708.jpg": "20240321-white-strap-sneaker",
    "20240321_151724.jpg": "20240321-white-strap-sneaker",
    "20240321_151717.jpg": "20240321-black-star-golden-goose",
    "20240321_151749.jpg": "20240321-black-star-golden-goose",
    "20240321_151941.jpg": "20240321-black-premiata-low-top",
    "20240321_151944.jpg": "20240321-black-premiata-low-top",
    # July 2025 in-store product close-ups.
    **{f"20250703_{stamp}.jpg": "20250703-white-scribble-low-top" for stamp in (
        "120935", "120940", "120942")},
    **{f"20250703_{stamp}.jpg": "20250703-white-tan-purple-low-top" for stamp in (
        "121751", "121752")},
    **{f"20250703_{stamp}.jpg": "20250703-burgundy-low-top" for stamp in (
        "121847", "121849")},
    **{f"20250703_{stamp}.jpg": "20250703-white-blue-replica" for stamp in (
        "122317", "122320", "122322", "122325", "122328", "122337")},
    **{f"20250703_{stamp}.jpg": "20250703-white-black-graphic-low-top" for stamp in (
        "122404", "122405")},
    **{f"20250703_{stamp}.jpg": "20250703-burgundy-canvas-low-top" for stamp in (
        "122634", "122638", "122640")},
    **{f"20250703_{stamp}.jpg": "20250703-black-star-low-top" for stamp in (
        "122709", "122711", "122712", "122718", "122737", "122739")},
    **{f"20250703_{stamp}.jpg": "20250703-pale-pink-blue-lace-low-top" for stamp in (
        "122727", "122730", "122731")},
    **{f"20250703_{stamp}.jpg": "20250703-green-star-low-top" for stamp in (
        "122746", "122748")},
    **{f"20250703_{stamp}.jpg": "20250703-black-patent-red-sole-low-top" for stamp in (
        "122822", "122824", "122829")},
    **{f"20250703_{stamp}.jpg": "20250703-black-suede-red-sole-low-top" for stamp in (
        "122831", "122832", "122834")},
    **{f"20250703_{stamp}.jpg": "20250703-blue-suede-low-top" for stamp in (
        "122852", "122854", "122857", "122859")},
    **{f"20250703_{stamp}.jpg": "20250703-burgundy-star-high-top" for stamp in (
        "123010", "123012", "123018")},
    # Retail listing screenshots from late November 2024.
    **{f"Screenshot_20241128_{stamp}.jpg": "20241128-all-black-air-max-plus" for stamp in (
        "232943_eBay", "232948_eBay", "233000_eBay", "235001_CapCut", "235012_CapCut", "235018_CapCut")},
    **{f"Screenshot_20241128_{stamp}.jpg": "20241128-black-white-air-max-plus" for stamp in (
        "233203_Chrome", "233208_Chrome", "233214_Chrome")},
}

with zipfile.ZipFile(ARCHIVE) as takeout:
    entries = []
    for info in takeout.infolist():
        if info.is_dir() or info.filename.endswith(".json"):
            continue
        name = Path(info.filename).name
        if Path(name).suffix.lower() not in image_exts:
            continue
        match = re.fullmatch(r"(Internet_\d{8}_\d{6})_(\d+)\.(?:jpe?g|png|webp|avif)", name, re.I)
        if name in manual_photo_groups:
            key = ("reviewed", manual_photo_groups[name])
            time_match = re.search(r"20\d{6}[_-](\d{6})(?:_(\d+))?", name)
            view = int("".join(part for part in time_match.groups() if part)) if time_match else len([entry for entry in entries if entry[0] == key]) + 1
        elif match:
            key = ("set", match.group(1))
            view = int(match.group(2))
        elif re.match(r"^(?:(?!20\d{6}_)(?:\d{8})|P\d{8})[_-]", name, re.I):
            # Retailer gallery filenames carry the product ID before the
            # image index. Treat those images as one verified product gallery.
            product_id = re.match(r"^(\d{8}|P\d{8})[_-]", name, re.I).group(1).upper()
            key = ("product", product_id)
            view = len([entry for entry in entries if entry[0] == key]) + 1
        elif re.match(r"^(?:desc_)?rockstud-sneakers-in-black", name, re.I):
            key = ("product", "VALENTINO-ROCKSTUD-BLACK")
            view = len([entry for entry in entries if entry[0] == key]) + 1
        elif re.match(r"^CALFSKIN-OPEN-SNEAKER", name, re.I):
            key = ("product", "VALENTINO-CALFSKIN-OPEN")
            view = len([entry for entry in entries if entry[0] == key]) + 1
        elif re.match(r"^goldens-limited-edition-stardan-sneakers-in-fuchsia-and-yellow", name, re.I):
            key = ("product", "GOLDEN-GOOSE-STARDAN-FUCHSIA-YELLOW")
            view = len([entry for entry in entries if entry[0] == key]) + 1
        else:
            key = ("file", info.filename)
            view = 1
        entries.append((key, view, info.filename, name))

    # Exact byte duplicates across differently named files share one listing.
    # This conservatively groups duplicates without merging different colorways.
    digest_to_key = {}
    consolidated = defaultdict(list)
    for key, view, archive_path, name in entries:
        data = takeout.read(archive_path)
        digest = sha256(data).hexdigest()
        if key[0] == "file" and digest in digest_to_key:
            key = digest_to_key[digest]
        elif key[0] == "file":
            digest_to_key[digest] = key
        consolidated[key].append((view, archive_path, name, digest))

    def convert(data, name, target):
        try:
            image = Image.open(__import__("io").BytesIO(data))
        except Exception:
            if Path(name).suffix.lower() != ".heic":
                raise
            with tempfile.TemporaryDirectory(prefix="stryde-heic-") as temp:
                source = Path(temp) / "source.heic"
                converted = Path(temp) / "converted.jpg"
                source.write_bytes(data)
                subprocess.run(["sips", "-s", "format", "jpeg", "--out", str(converted), str(source)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                image = Image.open(converted)
                image.load()
        with image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=82, method=0)

    entries = []
    for key, photos in consolidated.items():
        entries.append((key, sorted(photos)))

    # Human-reviewed product identities from the Takeout contact sheets.
    # Where a timestamp batch contains several colorways, the listing says so
    # explicitly instead of presenting every color as one physical shoe.
    known_models = {
        "Internet_20240205_175136": ("Golden Goose Ball Star Sneakers · multiple colorways", "Mixed colorways", "Golden Goose"),
        "Internet_20240205_182935": ("Golden Goose Ball Star Sneakers", "Ivory / Green", "Golden Goose"),
        "Internet_20240205_183011": ("Golden Goose Ball Star Sneakers", "White / Grey", "Golden Goose"),
        "Internet_20240205_183119": ("Golden Goose Ball Star Sneakers", "White / Silver", "Golden Goose"),
        "Internet_20240205_185707": ("Golden Goose Ball Star Sneakers", "Ivory / Burgundy", "Golden Goose"),
        "Internet_20240205_200954": ("Premiata low-top sneakers · model unverified", "Black / White", "Premiata"),
        "Internet_20240205_201945": ("Golden Goose low-top sneakers · model unverified", "White / Green", "Golden Goose"),
        "Internet_20240205_203942": ("Premiata low-top sneakers · model unverified", "White / Silver", "Premiata"),
        "Internet_20240206_093915": ("Maison Margiela Replica Sneakers", "Lavender / Gum", "Maison Margiela"),
        "Internet_20240206_231018": ("Premiata low-top sneakers · model unverified", "Black / White", "Premiata"),
        "Internet_20240206_231440": ("Golden Goose Super-Star Sneakers", "Black / White", "Golden Goose"),
        "Internet_20240206_233756": ("Armani Exchange low-top sneakers", "Black", "Armani Exchange"),
        "Internet_20240207_091927": ("Onitsuka Tiger Mexico 66 Sneakers", "Yellow / Black", "Onitsuka Tiger"),
        "Internet_20240207_092102": ("Onitsuka Tiger Mexico 66 Sneakers", "Yellow / Black", "Onitsuka Tiger"),
        "Internet_20240207_155340": ("Golden Goose Super-Star Sneakers", "Black / Gold", "Golden Goose"),
        "Internet_20240207_155827": ("Golden Goose Super-Star Sneakers", "Leopard / Black / White", "Golden Goose"),
        "Internet_20240205_181917": ("Black leather low-top sneakers · model unverified", "Black", ""),
        "Internet_20240208_193714": ("Maison Margiela Replica Sneakers", "Brown / Grey / Gum", "Maison Margiela"),
        "Internet_20240208_194113": ("Maison Margiela Replica Sneakers", "Blue / Gum", "Maison Margiela"),
        "Internet_20240208_202249": ("Golden Goose Ball Star Sneakers", "White / Gold", "Golden Goose"),
        "Internet_20240208_202628": ("Premiata low-top sneakers · model unverified", "White / Leopard / Pink", "Premiata"),
        "Internet_20240208_203320": ("Golden Goose Super-Star Sneakers", "Black / White / Silver", "Golden Goose"),
        "Internet_20240209_234948": ("Golden Goose Super-Star Sneakers", "Black / White", "Golden Goose"),
        "Internet_20240210_092431": ("Maison Margiela Replica Sneakers", "Pink / Gum", "Maison Margiela"),
        "Internet_20240210_092619": ("Maison Margiela Replica Sneakers", "Pink / Gum", "Maison Margiela"),
        "Internet_20240210_093053": ("Maison Margiela Replica Sneakers", "Pink / Gum", "Maison Margiela"),
        "Internet_20240210_094512": ("Golden Goose Super-Star Custom Sneakers", "White / Silver / Black", "Golden Goose"),
        "Internet_20240210_095554": ("Golden Goose Stardan Sneakers", "Black / Blue", "Golden Goose"),
        "Internet_20240210_101112": ("Premiata Mick Sneakers", "Black / White", "Premiata"),
        "Internet_20240215_053057": ("Off-White Low-Top Sneakers", "Black / White", "Off-White"),
        "Internet_20240215_053634": ("Golden Goose sneakers · model unverified", "Leopard / White / Pink", "Golden Goose"),
        "Internet_20240215_060743": ("Golden Goose Ball Star Sneakers", "White / Green", "Golden Goose"),
        "Internet_20240215_144505": ("Golden Goose Super-Star Sneakers", "Ivory / Gold", "Golden Goose"),
        "Internet_20240215_214427": ("Valentino Garavani Rockstud low-top sneakers", "Burgundy", "Valentino Garavani"),
        "Internet_20240216_152606": ("Golden Goose Super-Star Sneakers", "Pink / Silver", "Golden Goose"),
        "Internet_20240407_190625": ("Nike Air Max Plus Sneakers", "White / Blue", "Nike"),
        "Internet_20240407_191106": ("Nike Air Max Plus Sneakers", "Orange / Black", "Nike"),
        "Internet_20241122_154507": ("Golden Goose Super-Star Sneakers", "White / Silver", "Golden Goose"),
        "Internet_20241122_154817": ("Golden Goose Super-Star Sneakers", "Black / White", "Golden Goose"),
        "Internet_20241122_191251": ("Golden Goose Super-Star Sneakers", "White / Green", "Golden Goose"),
        "Internet_20241122_191543": ("Golden Goose Super-Star Sneakers", "White / Black", "Golden Goose"),
        "Internet_20241128_233445": ("Nike Air Max Plus Sneakers", "White / Black", "Nike"),
        "Internet_20250704_161929": ("Philippe Model low-top sneakers · model unverified", "White / Gold / Fuchsia", "Philippe Model"),
        "Internet_20250704_162654": ("Philippe Model low-top sneakers · model unverified", "White / Silver", "Philippe Model"),
        "Internet_20250704_163031": ("Golden Goose Stardan Sneakers", "White / Black / Red", "Golden Goose"),
        "Internet_20250704_163139": ("Golden Goose Stardan Sneakers", "White / Red", "Golden Goose"),
        "Internet_20250704_163233": ("Golden Goose Ball Star Sneakers", "White / Leopard / Black", "Golden Goose"),
        "Internet_20250704_163325": ("Golden Goose Ball Star Custom Sneakers", "White / Grey / Blue", "Golden Goose"),
        "Internet_20251203_223419": ("High-top sneakers with strap closure · model unverified", "Navy", ""),
        "Internet_20251203_223521": ("High-top sneakers with strap closure · model unverified", "Blue / Grey", ""),
        "Internet_20251203_223607": ("High-top sneakers with strap closure · model unverified", "Grey", ""),
        "Internet_20260306_235443": ("High-top sneakers with strap closure · model unverified", "Navy", ""),
        "Internet_20260306_235500": ("High-top sneakers with strap closure · model unverified", "White", ""),
        "Internet_20260306_235530": ("High-top sneakers with strap closure · model unverified", "Red", ""),
        "Internet_20260306_235757": ("High-top sneakers with strap closure · model unverified", "Blue", ""),
        "Internet_20260307_000044": ("High-top sneakers with strap closure · model unverified", "Navy", ""),
        "Internet_20260307_000134": ("High-top sneakers with strap closure · model unverified", "Navy / White", ""),
        "Internet_20260307_000203": ("High-top sneakers with strap closure · model unverified", "Navy", ""),
        "Internet_20260307_001715": ("High-top sneakers with strap closure · model unverified", "Red", ""),
        "Internet_20260307_131708": ("Low-top sneakers · model unverified", "Navy / White", ""),
    }
    source_products = {
        "11613218": ("Valentino Garavani Rockstud Untitled Leather Sneakers", "Black", "Valentino Garavani"),
        "14549760": ("Valentino Garavani Rockstud Untitled Sneakers", "White / Black", "Valentino Garavani"),
        "18092502": ("Golden Goose Ball Star Sneakers", "Black / White", "Golden Goose"),
        "20834846": ("Premiata Mick Sneakers", "Navy / Grey", "Premiata"),
        "21457247": ("Golden Goose Ball Star Sneakers", "White / Red", "Golden Goose"),
        "31666167": ("Off-White Out Of Office Sneakers", "White / Black", "Off-White"),
        "P00882626": ("Valentino Garavani Open Leather Sneakers", "White / Black", "Valentino Garavani"),
        "VALENTINO-ROCKSTUD-BLACK": ("Valentino Garavani Rockstud Untitled Leather Sneakers", "Black", "Valentino Garavani"),
        "VALENTINO-CALFSKIN-OPEN": ("Valentino Garavani Calfskin Open Sneakers", "White / Navy", "Valentino Garavani"),
        "GOLDEN-GOOSE-STARDAN-FUCHSIA-YELLOW": ("Golden Goose Limited-Edition Stardan Sneakers", "Fuchsia / Yellow", "Golden Goose"),
    }
    # Trust product names only when a filename itself clearly supplies one.
    brand_patterns = [
        (r"nike", "Nike"), (r"adidas|yeezy", "Adidas"), (r"new[-_ ]balance|\bnb\b", "New Balance"),
        (r"asics", "ASICS"), (r"puma", "Puma"), (r"reebok", "Reebok"),
        (r"golden[-_ ]goose|gooses", "Golden Goose"), (r"maison[-_ ]margiela", "Maison Margiela"),
        (r"valentino", "Valentino"), (r"balenciaga", "Balenciaga"), (r"converse", "Converse"),
    ]
    def filename_identity(source):
        normalized = re.sub(r"[-_]+", " ", Path(source).stem).strip()
        low = normalized.lower()
        explicit = [
            ("2019 valentino rockstud open sneaker white", "Valentino Garavani Rockstud Open Sneakers", "White", "Valentino"),
            ("golden goose womens super star lab sneakers in denim and leopard print pony skin", "Golden Goose Super-Star LAB Sneakers", "Denim / Leopard-Print Pony Skin", "Golden Goose"),
            ("maison margiela 22 replica low top sneakers bluette", "Maison Margiela 22 Replica Low-Top Sneakers", "Bluette", "Maison Margiela"),
        ]
        for prefix, title, colorway, brand in explicit:
            if low.startswith(prefix):
                return title, "filename", brand, colorway
        brand = next((label for pattern, label in brand_patterns if re.search(pattern, low)), None)
        # Timestamps and hashes are not product names. Preserve only explicit
        # filename titles that contain a recognized brand and readable words.
        if brand and not re.fullmatch(r"(?:internet )?\d{6,}(?: \d+)?", low):
            words = normalized.replace(brand, "", 1).strip(" -_")
            title = f"{brand} {words}".strip() if len(words) >= 4 else brand + " · Model unverified"
            return title, "filename", brand, ""
        return None, "unverified", None, ""

    catalog = []
    for number, (key, photos) in enumerate(sorted(entries, key=lambda row: (0 if row[0][0] == "set" else 1, str(row[0]))), 1):
        source_id = key[1]
        listing_id = f"pair-{number:04d}"
        photo_rows = []
        names = []
        for index, (view, archive_path, name, digest) in enumerate(photos, 1):
            target = ASSET_DIR / f"{listing_id}-{index:02d}.webp"
            convert(takeout.read(archive_path), name, target)
            photo_rows.append({"src": f"/assets/shop-products/{target.name}", "source": name, "sha256": digest})
            names.append(name)

        if key[0] == "set" and source_id in known_models:
            title, colorway, brand = known_models[source_id]
            identity_status = "visually-identified" if brand else "unverified"
        elif key[0] == "product" and source_id in source_products:
            title, colorway, brand = source_products[source_id]
            identity_status = "source-verified"
        elif key[0] == "product" and source_id.isdigit():
            title = f"Retailer product {source_id} · model unverified"
            colorway, brand, identity_status = "", None, "unverified"
        else:
            identity = filename_identity(names[0])
            title, identity_status, brand, colorway = identity
        if not title:
            title = f"Archive photo {number:04d} · ID needed"
        if identity_status == "source-verified":
            identity_note = "Brand and model name matched the source retailer product ID. Confirm that the photographed colorway matches before publishing."
        elif identity_status == "filename":
            identity_note = "The product name was read from the original image filename; confirm the exact SKU and colorway before publishing."
        elif identity_status == "visually-identified":
            identity_note = ("The brand was visually identified, but the exact model needs confirmation."
                             if "model unverified" in title else
                             "The brand and model family were visually identified from shoe markings and design; confirm the exact SKU before publishing.")
        else:
            identity_note = "Brand and model still need visual verification before this can be published as a product."
        description = f"{len(photo_rows)} photo{'s' if len(photo_rows) != 1 else ''} from the Google Photos Takeout. {identity_note}"
        catalog.append({
            "id": listing_id, "title": title, "description": description,
            "colorway": colorway, "brand": brand, "identityStatus": identity_status,
            "url": f"/products/{listing_id}", "sourceSet": source_id,
            "grouping": "Manually reviewed shoe photo set" if key[0] == "reviewed" else ("Takeout source set · needs shoe matching" if key[0] == "set" else ("Retailer product gallery" if key[0] == "product" else ("Exact duplicate" if len(photos) > 1 else "Single photo · needs grouping review"))),
            "photos": photo_rows, "count": len(photo_rows),
        })

MANIFEST.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
print(f"Imported {sum(item['count'] for item in catalog)} photos into {len(catalog)} review listings")
print(f"Filename-labeled: {sum(item['identityStatus'] == 'filename' for item in catalog)}; visually identified: {sum(item['identityStatus'] == 'visually-identified' for item in catalog)}; needs identity review: {sum(item['identityStatus'] == 'unverified' for item in catalog)}")
print(f"Manifest: {MANIFEST}")
