#!/usr/bin/env python3
"""Bake exact-match CU plates from ujanchar_veranda_back for Ep05 rewrite soft CUs.

Crops the world viewport at (wx, wy, zoom) from the plate mapped into PLATE_RECT,
then Lanczos-upsamples to 3840x2160 with strong unsharp so Remotion can show a
sharp full-bleed CuDetailScreen (not inside CSS-scaled GhibliLayer).
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PLATE = ROOT / "remotion_studio" / "public" / "images" / "ghibli_ep06" / "ujanchar_veranda_back.png"
OUT_DIR = ROOT / "remotion_studio" / "public" / "images" / "ghibli_ep05r" / "cu"
MARKS_S01 = ROOT / "remotion_studio" / "public" / "ep05r_layout" / "s01_veranda.json"
MARKS_S03 = ROOT / "remotion_studio" / "public" / "ep05r_layout" / "s03_yard.json"

PLATE_RECT = {"x": -240, "y": -135, "w": 2400, "h": 1350}
FRAME_W, FRAME_H = 1920, 1080


def head_y(foot_y: float, zoom: float) -> float:
    return foot_y - round(148 / max(1.0, zoom * 0.55))


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def cu_shots() -> list[dict]:
    s01 = load_json(MARKS_S01)
    s03 = load_json(MARKS_S03)
    charu_y = float(s01["charu"]["y"])
    suren_y = float(s01["suren"]["y"])
    charu_x = float(s01["charu"]["x"])
    suren_x = float(s01["suren"]["x"])
    c3x = float(s03["charu"]["x"])
    c3y = float(s03["charu"]["y"])
    s3x = float(s03["suren"]["x"])
    s3y = float(s03["suren"]["y"])
    return [
        {"id": "s01_shot2_charu", "wx": charu_x + 8, "wy": head_y(charu_y, 2.7), "zoom": 2.7},
        {"id": "s01_shot3_suren", "wx": suren_x, "wy": head_y(suren_y, 2.6), "zoom": 2.6},
        {"id": "s01_shot6_charu_cu", "wx": charu_x + 18, "wy": head_y(charu_y, 3.0), "zoom": 3.0},
        {"id": "s01_shot7_suren", "wx": suren_x, "wy": head_y(suren_y, 2.55), "zoom": 2.55},
        {"id": "s03_shot18_suren", "wx": s3x + 80, "wy": head_y(s3y, 2.6), "zoom": 2.6},
        {"id": "s03_shot21_charu", "wx": c3x + 20, "wy": head_y(c3y, 2.6), "zoom": 2.6},
    ]


def world_to_plate_px(wx: float, wy: float, img_w: int, img_h: int) -> tuple[float, float]:
    rx, ry, rw, rh = PLATE_RECT["x"], PLATE_RECT["y"], PLATE_RECT["w"], PLATE_RECT["h"]
    return ((wx - rx) / rw) * img_w, ((wy - ry) / rh) * img_h


def bake(shot: dict, src: Image.Image) -> Path:
    z = float(shot["zoom"])
    wx, wy = float(shot["wx"]), float(shot["wy"])
    vw, vh = FRAME_W / z, FRAME_H / z
    x0, y0 = world_to_plate_px(wx - vw / 2, wy - vh / 2, src.width, src.height)
    x1, y1 = world_to_plate_px(wx + vw / 2, wy + vh / 2, src.width, src.height)
    pad = 12
    left = max(0, int(x0) - pad)
    top = max(0, int(y0) - pad)
    right = min(src.width, int(x1) + pad)
    bottom = min(src.height, int(y1) + pad)
    crop = src.crop((left, top, right, bottom))
    out_w, out_h = FRAME_W * 2, FRAME_H * 2
    resized = crop.resize((out_w, out_h), resample=Image.Resampling.LANCZOS)
    # two-pass unsharp: recover brick/wall grain lost to the soft plate paint
    sharpened = resized.filter(ImageFilter.UnsharpMask(radius=1.4, percent=90, threshold=2))
    sharpened = sharpened.filter(ImageFilter.UnsharpMask(radius=2.4, percent=140, threshold=4))
    final = ImageEnhance.Contrast(sharpened).enhance(1.04)
    final = ImageEnhance.Sharpness(final).enhance(1.15)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{shot['id']}.png"
    final.save(out, format="PNG", optimize=True)
    rx, ry, rw, rh = PLATE_RECT["x"], PLATE_RECT["y"], PLATE_RECT["w"], PLATE_RECT["h"]
    world_x = rx + (left / src.width) * rw
    world_y = ry + (top / src.height) * rh
    world_w = ((right - left) / src.width) * rw
    world_h = ((bottom - top) / src.height) * rh
    meta = {
        "id": shot["id"],
        "href": f"images/ghibli_ep05r/cu/{shot['id']}.png",
        "wx": wx,
        "wy": wy,
        "zoom": z,
        "rect": {"x": round(world_x, 3), "y": round(world_y, 3), "w": round(world_w, 3), "h": round(world_h, 3)},
    }
    (OUT_DIR / f"{shot['id']}.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"baked {out.name} center=({wx:.0f},{wy:.0f})@{z} crop=({left},{top})-({right},{bottom})")
    return out


def main() -> None:
    if not PLATE.exists():
        raise SystemExit(f"missing plate: {PLATE}")
    src = Image.open(PLATE).convert("RGB")
    print(f"plate {PLATE.name} {src.width}x{src.height}")
    shots = cu_shots()
    for shot in shots:
        bake(shot, src)
    print("done", len(shots), "CU plates ->", OUT_DIR)


if __name__ == "__main__":
    main()
