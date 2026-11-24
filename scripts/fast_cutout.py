"""
Fast White-Isolated Cutout Processor (Pure PIL - Instantaneous)
Extracts characters and props rendered on pure white background,
adds smooth edge feathering, and crops tightly with safe bounding box.
"""

import sys
import shutil
from pathlib import Path
from PIL import Image

DOWNLOADS_DIR = Path(r"C:\Users\dipnk\Downloads")
RAW_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\raw")
CUTOUTS_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_05_Tortoise_and_Gentle_Cow\03_Visuals\cutouts")
REMOTION_EP05_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\public\visuals\ep05")

RAW_DIR.mkdir(parents=True, exist_ok=True)
CUTOUTS_DIR.mkdir(parents=True, exist_ok=True)
REMOTION_EP05_DIR.mkdir(parents=True, exist_ok=True)

def fast_white_cutout(src_path: Path, dest_name: str, max_height: int = 800, threshold: int = 240):
    print(f"Fast Cutout: {src_path.name} -> {dest_name}")
    raw_dest = RAW_DIR / f"{dest_name}_raw.png"
    cutout_dest = CUTOUTS_DIR / f"{dest_name}.png"
    remotion_dest = REMOTION_EP05_DIR / f"{dest_name}.png"
    
    shutil.copy(src_path, raw_dest)
    
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        feather_range = 18
        lower_threshold = threshold - feather_range
        
        for item in datas:
            r, g, b, a = item
            # White background test
            if r >= threshold and g >= threshold and b >= threshold:
                new_data.append((255, 255, 255, 0))
            elif r >= lower_threshold and g >= lower_threshold and b >= lower_threshold:
                # Soft alpha feather
                min_val = min(r, g, b)
                alpha_factor = 1.0 - ((min_val - lower_threshold) / feather_range)
                new_data.append((r, g, b, int(255 * max(0.0, min(1.0, alpha_factor)))))
            else:
                new_data.append((r, g, b, 255))
                
        img.putdata(new_data)
        
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        if img.height > max_height:
            scale = max_height / img.height
            new_w = int(img.width * scale)
            img = img.resize((new_w, max_height), Image.Resampling.LANCZOS)
            
        img.save(cutout_dest, format="PNG")
        img.save(remotion_dest, format="PNG")
        print(f"  Successfully saved {dest_name}.png ({img.width}x{img.height}) to Remotion public visuals.")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        src = Path(sys.argv[1])
        dest = sys.argv[2]
        h = int(sys.argv[3]) if len(sys.argv) > 3 else 800
        fast_white_cutout(src, dest, max_height=h)
