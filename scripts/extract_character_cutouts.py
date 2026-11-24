#!/usr/bin/env python3
"""Batch extract borderless transparent RGBA PNG character assets from painterly plates.

Enables 2.5D multi-plane puppet compositing (Plane 4: Character Stage over Plane 1-3: 4K Backgrounds).
"""

from pathlib import Path
from PIL import Image
import rembg
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "remotion_studio" / "public" / "images" / "s2_ep01"
OUT_BASE = ROOT / "remotion_studio" / "public" / "characters"

TARGETS = [
    # (source_image, character_folder, output_name)
    ("plate_1f_jogesh_ots.jpg", "jogesh", "jogesh_ots.png"),
    ("plate_b_jogesh_half.jpg", "jogesh", "jogesh_half.png"),
    ("plate_1c_lokenath_matched.jpg", "lokenath", "lokenath_seated.png"),
    ("plate_2b_harnath_wife_cu.jpg", "wife", "wife_cu.png"),
    ("plate_2b_wife_point_river.jpg", "wife", "wife_pointing.png"),
    ("plate_2c_villager_disbelief.jpg", "villager", "villager_disbelief.png"),
    ("plate_3b_pagol_arms_raised.jpg", "pagol", "pagol_arms_raised.png"),
]

def main():
    # Use u2netp (4.7 MB, ultrafast lightweight background removal)
    session = rembg.new_session("u2netp")
    print(f"Extracting {len(TARGETS)} transparent RGBA character sprites using u2netp...")

    for src_name, char_folder, out_name in TARGETS:
        src_path = SRC_DIR / src_name
        if not src_path.exists():
            print(f"Warning: {src_path} not found")
            continue

        out_dir = OUT_BASE / char_folder
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / out_name

        print(f"Processing: {src_name} -> {char_folder}/{out_name}...")
        img = Image.open(src_path).convert("RGB")
        transparent = rembg.remove(img, session=session)
        transparent.save(out_path, format="PNG")
        print(f"  Saved: {out_path} ({transparent.size[0]}x{transparent.size[1]})")

    print("All character cutouts extracted successfully!")

if __name__ == "__main__":
    main()
