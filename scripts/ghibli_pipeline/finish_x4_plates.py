"""
Finish AI-upscaled (Real-ESRGAN x4) plates for a Ghibli episode.

Opaque plates (skies, back plates, floors, cards): raw_x4/<name>.png -> <name>.jpg at `width` px (no crop: the
fractions measured on the raw image stay valid), light unsharp mask, JPEG q92 (a 4400 px PNG is ~18 MB; the JPEG
~2 MB, so the renderer's browser does not choke). Cutouts go through prepare_episode_plates.py with
"raw": "../raw_x4/<name>.png" in the manifest.

  py scripts/ghibli_pipeline/finish_x4_plates.py --dir remotion_studio/public/images/ghibli_ep06 --width 4400 name1 name2 ...
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--width", type=int, default=4400)
    ap.add_argument("names", nargs="+")
    a = ap.parse_args()
    base = Path(a.dir)
    for n in a.names:
        src = base / "raw_x4" / f"{n}.png"
        im = Image.open(src).convert("RGB")
        h = round(im.height * a.width / im.width)
        im = im.resize((a.width, h), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.0, percent=30, threshold=3))
        out = base / f"{n}.jpg"
        im.save(out, quality=92, optimize=True, subsampling=0)
        print(f"[OK] {out.name} {a.width}x{h} {out.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
