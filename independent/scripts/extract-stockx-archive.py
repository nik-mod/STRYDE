"""Read the public image archive as data; never execute archive contents."""
import hashlib
import json
import pathlib
import re
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
cache = root / '.data' / 'stockx-import'
destination = cache / 'originals'
destination.mkdir(parents=True, exist_ok=True)
manifest = []
seen = set()
duplicates = 0
with zipfile.ZipFile(cache / 'stockx-imgs.zip') as archive:
    if len(archive.infolist()) > 30000:
        raise ValueError('Unexpected archive size')
    for entry in archive.infolist():
        if not re.fullmatch(r'imgs/[A-Za-z0-9_,().&+!%\- ]+\.jpg', entry.filename):
            raise ValueError(f'Unexpected archive path: {entry.filename}')
        if entry.file_size > 12 * 1024 * 1024:
            raise ValueError('Unexpected image size')
        data = archive.read(entry)
        if not data.startswith((b'\xff\xd8\xff', b'\x89PNG\r\n\x1a\n')):
            raise ValueError('Unsupported archive image')
        digest = hashlib.sha256(data).hexdigest()
        if digest in seen:
            duplicates += 1
            continue
        seen.add(digest)
        filename = pathlib.PurePosixPath(entry.filename).name
        (destination / f'{digest}.jpg').write_bytes(data)
        manifest.append({'filename': filename, 'sha256': digest, 'bytes': len(data)})
(cache / 'manifest.json').write_text(json.dumps(manifest), encoding='utf8')
print(json.dumps({'images': len(manifest), 'exactDuplicatesRemoved': duplicates}))
