"""
Fix character cutouts and clear foreground alpha veil for Episode 5
- Haricharan Angry Cutout
- Gentle Cow Cutout
- Foreground Kash Reeds Leaves
- Verification of all 11 visuals
"""

import os
import shutil
import hashlib
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

SRC_HARICHARAN = Path(r"C:\Users\dipnk\Downloads\Gemini_Generated_Image_fsil6pfsil6pfsil.png")
SRC_COW = Path(r"C:\Users\dipnk\Downloads\Gemini_Generated_Image_21rtn621rtn621rt.png")
SRC_KASH = Path(r"C:\Users\dipnk\Downloads\Gemini_Generated_Image_j9ok4oj9ok4oj9ok.png")

REMOTION_EP05 = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\public\visuals\ep05")
RAW_EP05 = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\raw")
CUTOUTS_EP05 = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\cutouts")

REMOTION_EP05.mkdir(parents=True, exist_ok=True)
RAW_EP05.mkdir(parents=True, exist_ok=True)
CUTOUTS_EP05.mkdir(parents=True, exist_ok=True)

def cutout_connected_white(src_path: Path, max_height: int, threshold: int = 240, feather_range: int = 18):
    """
    Remove white background connected to borders with soft feathering.
    Protects interior white regions (such as white cow fur/dhoti) from becoming hollow.
    """
    img = Image.open(src_path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # 1. White pixels
    is_white = (arr[..., 0] >= threshold) & (arr[..., 1] >= threshold) & (arr[..., 2] >= threshold)
    
    # 2. Find background components connected to borders
    num_labels, labels = cv2.connectedComponents(is_white.astype(np.uint8))
    border_labels = set(labels[0, :]).union(labels[-1, :]).union(labels[:, 0]).union(labels[:, -1])
    border_labels.discard(0) # 0 is non-white
    bg_mask = np.isin(labels, list(border_labels))
    
    # 3. Transition zone around background edge
    kernel = np.ones((5, 5), np.uint8)
    bg_dilated = cv2.dilate(bg_mask.astype(np.uint8), kernel) > 0
    trans_zone = bg_dilated & (~bg_mask)
    
    lower_threshold = threshold - feather_range
    near_white = (arr[..., 0] >= lower_threshold) & (arr[..., 1] >= lower_threshold) & (arr[..., 2] >= lower_threshold)
    feather_pixels = trans_zone & near_white
    
    # 4. Compute alpha channel
    alpha = np.full((h, w), 255, dtype=np.uint8)
    alpha[bg_mask] = 0
    
    min_val = np.min(arr[feather_pixels], axis=1).astype(float)
    alpha_factor = 1.0 - ((min_val - lower_threshold) / float(feather_range))
    alpha[feather_pixels] = np.clip(255.0 * alpha_factor, 0, 255).astype(np.uint8)
    
    # 5. Crop to bounding box
    rgba = np.dstack([arr, alpha])
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
        
    # 6. Resize preserving aspect ratio
    if out.height > max_height:
        scale = max_height / float(out.height)
        new_w = int(out.width * scale)
        out = out.resize((new_w, max_height), Image.Resampling.LANCZOS)
        
    return out, bbox

def process_haricharan():
    print("\n--- 1. Processing Haricharan Angry Cutout ---")
    dest_remotion = REMOTION_EP05 / "ep05_prop_haricharan_angry.png"
    dest_raw = RAW_EP05 / "ep05_prop_haricharan_angry_raw.png"
    dest_cutout = CUTOUTS_EP05 / "ep05_prop_haricharan_angry.png"
    
    # Copy raw
    shutil.copy2(SRC_HARICHARAN, dest_raw)
    print(f"Saved raw to: {dest_raw}")
    
    # Cutout with max_height 680
    img, bbox = cutout_connected_white(SRC_HARICHARAN, max_height=680, threshold=240, feather_range=18)
    img.save(dest_remotion, format="PNG", optimize=True)
    img.save(dest_cutout, format="PNG", optimize=True)
    print(f"Cutout bbox: {bbox}")
    print(f"Saved Haricharan ({img.width}x{img.height}) to:\n  {dest_remotion}\n  {dest_cutout}")
    return img

def process_gentle_cow():
    print("\n--- 2. Processing Gentle Cow Cutout ---")
    dest_remotion = REMOTION_EP05 / "ep05_prop_gentle_cow.png"
    dest_raw = RAW_EP05 / "ep05_prop_gentle_cow_raw.png"
    dest_cutout = CUTOUTS_EP05 / "ep05_prop_gentle_cow.png"
    
    # Copy raw
    shutil.copy2(SRC_COW, dest_raw)
    print(f"Saved raw to: {dest_raw}")
    
    # Cutout with max_height 650
    img, bbox = cutout_connected_white(SRC_COW, max_height=650, threshold=240, feather_range=18)
    img.save(dest_remotion, format="PNG", optimize=True)
    img.save(dest_cutout, format="PNG", optimize=True)
    print(f"Cutout bbox: {bbox}")
    print(f"Saved Gentle Cow ({img.width}x{img.height}) to:\n  {dest_remotion}\n  {dest_cutout}")
    return img

def process_kash_reeds():
    print("\n--- 3. Processing Foreground Kash Reeds Leaves ---")
    dest_remotion = REMOTION_EP05 / "ep05_fg_kash_reeds_leaves.png"
    dest_raw = RAW_EP05 / "ep05_fg_kash_reeds_leaves.png"
    
    # Copy source to raw
    shutil.copy2(SRC_KASH, dest_raw)
    print(f"Saved raw copy to: {dest_raw}")
    
    img = Image.open(SRC_KASH).convert("RGB")
    # Resize to 1920x1080
    img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
    arr = np.array(img)
    h, w, _ = arr.shape
    
    threshold = 238
    feather_range = 28
    lower_threshold = threshold - feather_range
    min_rgb = np.min(arr, axis=-1).astype(float)
    
    alpha = np.zeros((h, w), dtype=np.uint8)
    solid = min_rgb < lower_threshold
    feather = (min_rgb >= lower_threshold) & (min_rgb < threshold)
    
    alpha[solid] = 255
    alpha[feather] = np.clip(255.0 * (1.0 - (min_rgb[feather] - lower_threshold) / float(feather_range)), 0, 255).astype(np.uint8)
    
    # Central area: x between 0.20*w and 0.72*w, y between 0.05*h and 0.88*h -> 100% alpha = 0
    x0, x1 = int(0.20 * w), int(0.72 * w)
    y0, y1 = int(0.05 * h), int(0.88 * h)
    alpha[y0:y1, x0:x1] = 0
    
    # Sky / Upper Right (x >= x1, y < 0.50*h) -> 100% alpha = 0 (no haze in sky)
    alpha[0:int(0.50 * h), x1:w] = 0
    
    rgba = np.dstack([arr, alpha])
    out = Image.fromarray(rgba, "RGBA")
    
    out.save(dest_remotion, format="PNG", optimize=True)
    out.save(dest_raw, format="PNG", optimize=True)
    
    center_alpha = alpha[y0:y1, x0:x1]
    print(f"Kash Reeds 1920x1080 saved to:\n  {dest_remotion}\n  {dest_raw}")
    print(f"Center alpha [x:{x0}..{x1}, y:{y0}..{y1}]: min={center_alpha.min()}, max={center_alpha.max()}, mean={center_alpha.mean():.4f}")
    print(f"Foliage solid pixels: {np.sum(alpha == 255):,}, feathered pixels: {np.sum((alpha > 0) & (alpha < 255)):,}")
    return out

def verify_all_visuals():
    print("\n--- 4. Verifying All 11 Visuals in Remotion Studio ---")
    files = sorted(list(REMOTION_EP05.glob("ep05_*.png")))
    print(f"Total ep05 visuals found: {len(files)}")
    
    hashes = {}
    details = []
    
    for f in files:
        with open(f, "rb") as fp:
            data = fp.read()
            md5 = hashlib.md5(data).hexdigest()
            sha256 = hashlib.sha256(data).hexdigest()
            size = len(data)
            
        im = Image.open(f)
        mode = im.mode
        w, h = im.size
        
        if md5 in hashes:
            print(f"ERROR: Duplicate content detected! {f.name} matches {hashes[md5]}")
        hashes[md5] = f.name
        
        info = {
            "name": f.name,
            "dimensions": f"{w}x{h}",
            "size_kb": f"{size / 1024:.1f} KB",
            "bytes": size,
            "mode": mode,
            "md5": md5
        }
        details.append(info)
        print(f"  {f.name:45s} | {w:4d}x{h:4d} | {mode:4s} | {size:8d} bytes | MD5: {md5[:10]}...")

    print("\nVerification Summary:")
    print(f"  Total unique visual files: {len(hashes)} of {len(files)}")
    print(f"  Zero duplicate byte collisions: {len(hashes) == len(files)}")
    return details

if __name__ == "__main__":
    process_haricharan()
    process_gentle_cow()
    process_kash_reeds()
    verify_all_visuals()
