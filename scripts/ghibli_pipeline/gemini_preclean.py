"""
Pre-clean Gemini-generated images before prepare_episode_plates.py.

Gemini output quirks this fixes (seen on the Episode 6 batch, 2026-11-23):
  1. A small four-point "sparkle" mark near the bottom-right corner -> detected and inpainted.
  2. Painted paper borders / white strips around some plates -> cropped to the painted area.
  3. Cutouts painted on a cream paper panel instead of pure white -> the panel is mapped to #FFFFFF.
  4. A 3x2 props sheet -> sliced into one raw file per prop.

Originals are copied once to  raw_original/  beside raw/ and never touched again; the cleaned files replace
the ones in raw/. Usage:
  py scripts/ghibli_pipeline/gemini_preclean.py --dir remotion_studio/public/images/ghibli_ep06
"""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def remove_sparkle(arr: np.ndarray, vertical: bool = False) -> tuple[np.ndarray, int]:
    """Gemini stamps a small four-point sparkle at a fixed spot near the bottom-right corner
    (centre about 91.2% across, 84.6% down; ~40 px wide at 1376x768). Cover it with paper texture
    cloned from just left of it, blended through a feathered round mask, so no smear is left."""
    h, w = arr.shape[:2]
    cx, cy = int(round(w * 0.9124)), int(round(h * 0.8464))
    r = int(round(31 * w / 1376))
    dx = -int(round(78 * w / 1376))
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    m = np.clip((r + 8 - d) / 8.0, 0, 1)  # 1 inside r, feathered over 8 px
    if m.sum() == 0:
        return arr, 0
    if vertical:  # clone from just below (when the area to the left is a different surface)
        src = np.roll(arr, -int(round(70 * h / 768)), axis=0)
    else:
        src = np.roll(arr, -dx, axis=1)  # pixel at x takes the value from x + dx (to the left)
    out = arr.astype(np.float32) * (1 - m[:, :, None]) + src.astype(np.float32) * m[:, :, None]
    return np.clip(out, 0, 255).astype(np.uint8), int((m > 0.5).sum())


def crop_frac(img: Image.Image, box: tuple[float, float, float, float]) -> Image.Image:
    w, h = img.size
    return img.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


def cream_to_white(img: Image.Image, tol: float = 26.0) -> Image.Image:
    """Map the paper colour connected to the border to pure white (soft edge), so border flood-fill works."""
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w = arr.shape[:2]
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    paper = np.median(edge, axis=0)
    dist = np.sqrt(((arr - paper) ** 2).sum(axis=2))
    near = dist < tol
    lab, _ = ndimage.label(near)
    border_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border_labels[border_labels > 0])
    # paper showing through gaps inside the object (between bamboo culms, under leaves): any sizeable
    # paper-coloured pocket becomes white too, so the hole-punch step can clear it
    sizes = ndimage.sum(near, lab, range(1, lab.max() + 1))
    pockets = np.isin(lab, 1 + np.where(sizes >= 30)[0])
    bg = bg | pockets
    soft = ndimage.gaussian_filter(bg.astype(np.float32), 1.2)
    out = arr * (1 - soft[:, :, None]) + 255.0 * soft[:, :, None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def slice_grid(img: Image.Image, cols: int, rows: int, names: list[str], out_dir: Path) -> None:
    """Slice a props sheet laid out on a cols x rows grid; split lines are the emptiest columns / rows."""
    arr = np.asarray(img.convert("RGB")).astype(np.int16)
    ink = ((arr.min(axis=2) < 232) | ((arr.max(axis=2) - arr.min(axis=2)) > 20)).astype(np.float32)
    h, w = ink.shape

    def splits(profile: np.ndarray, n: int, size: int) -> list[int]:
        cuts = [0]
        for k in range(1, n):
            c = int(size * k / n)
            lo, hi = c - size // (3 * n), c + size // (3 * n)
            cuts.append(lo + int(np.argmin(profile[lo:hi])))
        return cuts + [size]

    xs = splits(ink.sum(axis=0), cols, w)
    ys = splits(ink.sum(axis=1), rows, h)
    k = 0
    for r in range(rows):
        for c in range(cols):
            if k >= len(names):
                return
            tile = img.crop((xs[c], ys[r], xs[c + 1], ys[r + 1]))
            # pad with white so the cutout extractor sees a clean margin
            pad = Image.new("RGB", (tile.width + 80, tile.height + 80), (255, 255, 255))
            pad.paste(tile, (40, 40))
            pad.save(out_dir / f"{names[k]}.png")
            k += 1


# Episode 6 batch: what each raw file needs (crop boxes are fractions of width/height)
EP06 = {
    "sky_village_sunset": {"crop": (0.030, 0.045, 0.972, 0.955)},
    "sky_village_late_morning": {"crop": (0.0, 0.0, 1.0, 0.945)},
    "bamboo_clump": {"crop": (0.272, 0.0, 0.728, 1.0), "cream": True},
    "village_lane_back": {"cloneVertical": True},
}
PROPS_SHEET = ("props_sheet_ep06", 3, 2, ["prop_brass_thali", "prop_clay_kolshi", "prop_slate", "prop_rice_sack", "prop_low_stool", "prop_bamboo_basket"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="public/images/ghibli_epNN")
    a = ap.parse_args()
    base = Path(a.dir)
    raw, orig = base / "raw", base / "raw_original"
    orig.mkdir(exist_ok=True)
    for p in sorted(raw.glob("*.png")):
        keep = orig / p.name
        if not keep.exists():
            shutil.copy2(p, keep)
        src = Image.open(keep).convert("RGB")
        spec = EP06.get(p.stem, {})
        arr, n = remove_sparkle(np.asarray(src), vertical=bool(spec.get("cloneVertical")))
        img = Image.fromarray(arr)
        if "crop" in spec:
            img = crop_frac(img, spec["crop"])
        if spec.get("cream"):
            img = cream_to_white(img)
        img.save(p)
        print(f"{p.name:34s} sparkle_px={n:5d}  size={img.size}")
    sheet = raw / f"{PROPS_SHEET[0]}.png"
    if sheet.exists():
        slice_grid(Image.open(sheet), PROPS_SHEET[1], PROPS_SHEET[2], PROPS_SHEET[3], raw)
        print("sliced props sheet ->", ", ".join(PROPS_SHEET[3]))


if __name__ == "__main__":
    main()
