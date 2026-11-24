"""
Episode 05 Visual Asset Pipeline & Processor
Ingests Gemini/Imagen generated images, crops, applies rembg for cutouts,
normalizes 16:9 backgrounds, and places them into remotion_studio/public/visuals/ep05/
"""

import os
import sys
import glob
import shutil
from pathlib import Path
from PIL import Image
import rembg

DOWNLOADS_DIR = Path(r"C:\Users\dipnk\Downloads")
RAW_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\raw")
CUTOUTS_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\cutouts")
REMOTION_EP05_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\public\visuals\ep05")

RAW_DIR.mkdir(parents=True, exist_ok=True)
CUTOUTS_DIR.mkdir(parents=True, exist_ok=True)
REMOTION_EP05_DIR.mkdir(parents=True, exist_ok=True)

def process_background(src_path: Path, dest_name: str):
    """Normalize background to 1920x1080 16:9 high quality"""
    print(f"Processing Background: {src_path.name} -> {dest_name}")
    raw_dest = RAW_DIR / f"{dest_name}.png"
    remotion_dest = REMOTION_EP05_DIR / f"{dest_name}.png"
    
    with Image.open(src_path) as img:
        img = img.convert("RGB")
        # Resize/crop to 1920x1080 maintaining aspect ratio
        target_w, target_h = 1920, 1080
        img_ratio = img.width / img.height
        target_ratio = target_w / target_h
        
        if img_ratio > target_ratio:
            # Crop sides
            new_w = int(img.height * target_ratio)
            left = (img.width - new_w) // 2
            img = img.crop((left, 0, left + new_w, img.height))
        elif img_ratio < target_ratio:
            # Crop top/bottom
            new_h = int(img.width / target_ratio)
            top = (img.height - new_h) // 2
            img = img.crop((0, top, img.width, top + new_h))
            
        img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        img.save(raw_dest, format="PNG", optimize=True)
        img.save(remotion_dest, format="PNG", optimize=True)
        print(f"  Saved 1920x1080 background to {remotion_dest}")

def process_white_isolated_cutout(src_path: Path, dest_name: str, max_height: int = 900, threshold: int = 242):
    """Fast, perfect cutout for objects isolated on pure solid white background"""
    print(f"Processing White Isolated Cutout: {src_path.name} -> {dest_name}")
    raw_dest = RAW_DIR / f"{dest_name}_raw.png"
    cutout_dest = CUTOUTS_DIR / f"{dest_name}.png"
    remotion_dest = REMOTION_EP05_DIR / f"{dest_name}.png"
    
    shutil.copy(src_path, raw_dest)
    
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            r, g, b, a = item
            # Distance from pure white
            if r >= threshold and g >= threshold and b >= threshold:
                # Fully transparent
                new_data.append((255, 255, 255, 0))
            elif r >= threshold - 20 and g >= threshold - 20 and b >= threshold - 20:
                # Feather edge
                diff = max(r, g, b) - (threshold - 20)
                alpha = int(255 * (1.0 - diff / 20.0))
                new_data.append((r, g, b, max(0, min(255, alpha))))
            else:
                new_data.append((r, g, b, 255))
                
        img.putdata(new_data)
        
        # Crop to content
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        if img.height > max_height:
            scale = max_height / img.height
            new_w = int(img.width * scale)
            img = img.resize((new_w, max_height), Image.Resampling.LANCZOS)
            
        img.save(cutout_dest, format="PNG")
        img.save(remotion_dest, format="PNG")
        print(f"  Saved clean cutout ({img.width}x{img.height}) to {remotion_dest}")

    """Isolate object using rembg, trim empty alpha, and save transparent PNG"""
    print(f"Processing Cutout: {src_path.name} -> {dest_name}")
    raw_dest = RAW_DIR / f"{dest_name}_raw.png"
    cutout_dest = CUTOUTS_DIR / f"{dest_name}.png"
    remotion_dest = REMOTION_EP05_DIR / f"{dest_name}.png"
    
    # Save copy of raw
    shutil.copy(src_path, raw_dest)
    
    with Image.open(src_path) as input_img:
        input_img = input_img.convert("RGBA")
        output_img = rembg.remove(input_img)
        
        # Crop to non-transparent bounding box
        bbox = output_img.getbbox()
        if bbox:
            output_img = output_img.crop(bbox)
            
        # Scale if larger than max_height
        if output_img.height > max_height:
            scale = max_height / output_img.height
            new_w = int(output_img.width * scale)
            output_img = output_img.resize((new_w, max_height), Image.Resampling.LANCZOS)
            
        output_img.save(cutout_dest, format="PNG")
        output_img.save(remotion_dest, format="PNG")
        print(f"  Saved transparent cutout ({output_img.width}x{output_img.height}) to {remotion_dest}")

if __name__ == "__main__":
    print("Episode 5 Visual Asset Processor ready.")
