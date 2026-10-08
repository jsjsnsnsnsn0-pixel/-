"""Reduce Android artwork transfer size without removing or renaming app assets.

Runs only in CI build workspace. Repository originals stay unchanged.
Every image is kept under its original JPG filename so UI paths remain valid.
"""
from pathlib import Path
from PIL import Image, ImageOps
import os
import tempfile

root = Path("public/assets/images")
files = sorted(root.glob("*.jpg"))
if len(files) != 128:
    raise SystemExit(f"Unexpected artwork count: {len(files)} (expected 128)")
before = sum(p.stat().st_size for p in files)
for path in files:
    with Image.open(path) as source:
        oriented = ImageOps.exif_transpose(source)
        if oriented.mode not in ("RGB", "L"):
            oriented = oriented.convert("RGB")
        oriented.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".jpg", delete=False) as tmp:
            temp_name = tmp.name
        try:
            oriented.save(temp_name, format="JPEG", quality=83,
                          optimize=True, progressive=True)
            # The originals remain the upper bound: don't inflate an already small image.
            if os.path.getsize(temp_name) < path.stat().st_size:
                os.replace(temp_name, path)
            else:
                os.unlink(temp_name)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
after = sum(p.stat().st_size for p in files)
saved = before - after
print(f"Optimized {len(files)} JPGs; {before:,} -> {after:,} bytes, saved {saved:,} ({100*saved/before:.1f}%)")
if saved < before * 0.15:
    raise SystemExit("Optimization did not materially reduce bundled image size")
