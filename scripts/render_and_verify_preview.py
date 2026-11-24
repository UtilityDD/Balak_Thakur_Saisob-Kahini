"""
Automated Render, Still Extraction, and Visual Verification Script
For Episode 5 Scene 3 (Standoff)
"""

import subprocess
import shutil
import sys
from pathlib import Path
from PIL import Image
import numpy as np

WORKSPACE_DIR = Path(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini")
REMOTION_DIR = WORKSPACE_DIR / "remotion_studio"
PREVIEWS_DIR = WORKSPACE_DIR / "03_Episodes" / "Episode_05_Tortoise_and_Gentle_Cow" / "04_Video_Assembly" / "Previews"
ARTIFACTS_DIR = Path(r"C:\Users\dipnk\.gemini\antigravity\brain\c8775ad3-8164-47a1-ad47-19eb3bafc3c3")

PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

def render_stills():
    print("=== Extracting Exact Scene 3 Stills via Remotion CLI ===")
    
    # Scene 3 startFrame is 3818 in Episode05:
    # Frame 3890: Scene frame 72 -> Hari Rage Close-up (targetCamX = -230, zoom = 1.28)
    # Frame 3836: Scene frame 18 -> Opening Wide Standoff Two-Shot (targetCamX = 0, zoom = 1.05)
    # Frame 4078: Scene frame 260 -> Balak Hero Refusal & Glowing Aura (targetCamX = 210, zoom = 1.28)
    
    targets = [
        ("still_01_haricharan_rage.png", 3890, "Hari Furious Close-up with Bamboo Stick"),
        ("still_02_standoff_twoshot.png", 3836, "Wide Confrontation 2-Shot (Balak, Hari, Cow)"),
        ("still_03_thakur_refusal_aura.png", 4078, "Balak Thakur Fearless Refusal with Glowing Aura"),
    ]
    
    saved_paths = []
    
    for filename, frame_num, desc in targets:
        out_preview_path = PREVIEWS_DIR / filename
        out_artifact_path = ARTIFACTS_DIR / filename
        
        cmd = [
            "npx", "remotion", "still",
            "src/index.ts", "Episode05",
            str(out_preview_path),
            f"--frame={frame_num}",
            "--image-format=png"
        ]
        
        print(f"\nRendering {filename} (Frame {frame_num} - {desc})...")
        res = subprocess.run(cmd, cwd=str(REMOTION_DIR), shell=True, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error rendering {filename}:\n{res.stderr}")
            sys.exit(1)
            
        shutil.copy(out_preview_path, out_artifact_path)
        saved_paths.append((filename, out_preview_path, out_artifact_path))
        print(f"  -> Successfully generated: {out_preview_path}")

    return saved_paths

def verify_stills_difference(saved_paths):
    print("\n=== Mathematical Difference Verification Between Stills ===")
    images = {}
    for filename, path, _ in saved_paths:
        with Image.open(path) as im:
            images[filename] = np.array(im.convert("RGB")).astype(float)
            
    pairs = [
        ("still_01_haricharan_rage.png", "still_02_standoff_twoshot.png"),
        ("still_02_standoff_twoshot.png", "still_03_thakur_refusal_aura.png"),
        ("still_01_haricharan_rage.png", "still_03_thakur_refusal_aura.png"),
    ]
    
    all_distinct = True
    for name1, name2 in pairs:
        arr1 = images[name1]
        arr2 = images[name2]
        # Calculate mean absolute pixel difference across RGB (0 - 255)
        diff = np.mean(np.abs(arr1 - arr2))
        pct_diff = (diff / 255.0) * 100.0
        print(f"Difference between [{name1}] and [{name2}]: {diff:.2f}/255 ({pct_diff:.1f}%)")
        if pct_diff < 5.0:
            print(f"WARNING: [{name1}] and [{name2}] look too similar (diff {pct_diff:.1f}%)!")
            all_distinct = False
        else:
            print(f"  -> Verified distinct shot! ({pct_diff:.1f}% divergence)")
            
    if all_distinct:
        print("\nAll 3 still frames are CONFIRMED DISTINCT AND DIVERGENT!")
    else:
        print("\nVisual verification failed: identical frame detected.")
        sys.exit(1)

def render_preview_video():
    print("\n=== Rendering Scene 3 Preview Video Clip ===")
    out_video = PREVIEWS_DIR / "Scene03_Standoff_Preview.mp4"
    cmd = [
        "npx", "remotion", "render",
        "src/index.ts", "Episode05",
        str(out_video),
        "--frames=3818-4200",
        "--codec=h264"
    ]
    res = subprocess.run(cmd, cwd=str(REMOTION_DIR), shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error rendering video:\n{res.stderr}")
    else:
        print(f"Scene 3 preview video rendered successfully: {out_video}")

if __name__ == "__main__":
    stills = render_stills()
    verify_stills_difference(stills)
    render_preview_video()
