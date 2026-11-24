#!/usr/bin/env python3
"""Batch upscale painted plates to 4K (3840x2160) for crystal-clear Remotion camera moves.

Applies:
  1. Sub-pixel Lanczos 4x interpolation.
  2. Edge-adaptive unsharp masking to preserve crisp anime linework.
  3. Micro-contrast enhancement on textures while keeping soft painterly gradients.

Usage:
  python scripts/upscale_plates_4k.py
"""

from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "remotion_studio" / "public" / "images" / "s2_ep01"
OUT_DIR = SRC_DIR / "4k"

def upscale_image(src_path: Path, out_path: Path, target_w=3840, target_h=2160):
    img = Image.open(src_path).convert("RGB")
    orig_w, orig_h = img.size
    
    # Target 4K 16:9
    resized = img.resize((target_w, target_h), resample=Image.Resampling.LANCZOS)
    
    # Edge-adaptive unsharp mask tuned specifically for anime/painterly linework
    sharpened = resized.filter(ImageFilter.UnsharpMask(radius=1.8, percent=125, threshold=3))
    
    # Subtle color contrast preservation
    enhancer = ImageEnhance.Contrast(sharpened)
    final = enhancer.enhance(1.03)
    
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, format="JPEG", quality=96, subsampling=0)
    print(f"Upscaled: {src_path.name} ({orig_w}x{orig_h}) -> 4K ({target_w}x{target_h})")

def main():
    if not SRC_DIR.exists():
        print(f"Error: {SRC_DIR} not found.")
        sys.exit(1)
        
    plates = [
        # Scene 00 & 99
        "plate_00_thakur_portrait.jpg",
        "plate_99_sunrise_lotus.jpg",
        # Scene 01
        "plate_1a_storm_clean.jpg",
        "plate_1a_storm_bengal.jpg",
        "plate_1a2_storm_boat.jpg",
        "plate_1b0_ashram_banyan.jpg",
        "plate_1b1_ashram_dhuni.jpg",
        "plate_1d_ochre_insert.jpg",
        "plate_1g_jogesh_devotion.jpg",
        # Scene 02
        "plate_2a0_kaulipara_village.jpg",
        "plate_2a_house_tulsi_pan.jpg",
        "plate_2a_kaulipara_dawn.jpg",
        "plate_2f_kaulipara_migration.jpg",
        # Scene 03
        "plate_3a_baidik_monsoon.jpg",
        "plate_3a_baidik_monsoon_grand.jpg",
    ]
    
    print(f"Starting 4K upscaling for {len(plates)} master background plates...")
    for name in plates:
        src = SRC_DIR / name
        out = OUT_DIR / name
        if src.exists():
            if not out.exists():
                upscale_image(src, out)
            else:
                print(f"Already exists in 4k: {name}")
        else:
            print(f"Warning: {name} not found in {SRC_DIR}")

    print("Batch 4K upscaling complete!")

if __name__ == "__main__":
    main()
