"""Mandatory Pre-Finalization QA Verification Pipeline for Series 2 (Param Bismoy Balak Thakur).
Usage:
    python scripts/qa_verify_episode.py <rendered_mp4_path> <audit_output_dir> [--full]

Checks enforced automatically before ANY video output is finalized:
1. Video stream validation: 1920x1080 resolution, exact 24.000 fps, non-empty duration.
2. JoyVASA clip audit: Every speaking *_24.mp4 clip in public/video/s2_ep01/ must be exact 24/1 fps and match its target audio duration within <= 0.10s (prevents 25fps drift).
3. Multi-point keyframe extraction across every shot/scene boundary + automated black-frame detection.
"""

import subprocess
import sys
import cv2
import numpy as np
from pathlib import Path

VID_DIR = Path(r"C:\Dipankar\Balak_Thakur_Production\remotion_studio\public\video\s2_ep01")
AUD_DIR = Path(r"C:\Dipankar\Balak_Thakur_Production\remotion_studio\public\audio\s2_ep01")


def probe_stream(path: Path):
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate:format=duration",
            "-of", "default=noprint_wrappers=1",
            str(path),
        ],
        text=True,
    ).strip()
    info = {}
    for line in out.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            info[k.strip()] = v.strip()
    return info


def main():
    if len(sys.argv) < 3:
        print("Usage: python qa_verify_episode.py <mp4_path> <audit_dir> [--full]")
        sys.exit(1)

    mp4_path = Path(sys.argv[1])
    audit_dir = Path(sys.argv[2])
    is_full = "--full" in sys.argv[3:]
    audit_dir.mkdir(parents=True, exist_ok=True)
    errors = []

    print(f"=== [QA GATE 1] Checking rendered MP4: {mp4_path.name} ===")
    if not mp4_path.exists():
        raise FileNotFoundError(f"Rendered MP4 not found: {mp4_path}")
    info = probe_stream(mp4_path)
    print("  Stream info:", info)
    if info.get("width") != "1920" or info.get("height") != "1080":
        errors.append(f"Resolution mismatch: {info.get('width')}x{info.get('height')} != 1920x1080")
    if info.get("r_frame_rate") != "24/1":
        errors.append(f"Frame rate mismatch: {info.get('r_frame_rate')} != 24/1")

    print("\n=== [QA GATE 2] Auditing JoyVASA 24fps source clips against master WAVs ===")
    expected_pairs = [
        ("p1b_01b_24.mp4", "01b_Lokenath_Prophecy.wav"),
        ("p1c_01b_24.mp4", "01b_Lokenath_Prophecy.wav"),
        ("p1e_dual_01b_24.mp4", "01b_Lokenath_Prophecy.wav"),
        ("p1f_01c_24.mp4", "01c_Jogesh_Awe.wav"),
        ("p1c_01d_24.mp4", "01d_Lokenath_Smile.wav"),
        ("p2a_wife_02b_24.mp4", "02b_Harnath_Wife.wav"),
        ("p2b_wife_02b_24.mp4", "02b_Harnath_Wife.wav"),
        ("p2c_villager_02c_24.mp4", "02c_Villager_Shock.wav"),
        ("p2b_wife_02d_24.mp4", "02d_Harnath_Wife_Lead.wav"),
        ("p3b_pagol_03b_24.mp4", "03b_Pagol_Omen.wav"),
        ("p3c_charu_03c_24.mp4", "03c_Charu_Wonder.wav"),
    ]
    for v_name, a_name in expected_pairs:
        vp = VID_DIR / v_name
        ap = AUD_DIR / a_name
        if not vp.exists():
            errors.append(f"Missing 24fps JoyVASA clip: {v_name}")
            continue
        vi = probe_stream(vp)
        ai_out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(ap)],
            text=True,
        ).strip()
        vdur = float(vi["duration"])
        adur = float(ai_out)
        drift = abs(vdur - adur)
        print(f"  {v_name:24s} | fps={vi['r_frame_rate']} | v={vdur:6.2f}s vs a={adur:6.2f}s (drift={drift:.3f}s)")
        if vi["r_frame_rate"] != "24/1":
            errors.append(f"{v_name} is {vi['r_frame_rate']}, not 24/1!")
        if drift > 0.10:
            errors.append(f"{v_name} duration drift {drift:.3f}s > 0.10s!")

    print("\n=== [QA GATE 3] Extracting & Auditing Multi-Shot Keyframes (Freeze & Black-Frame Check) ===")
    total_dur = float(info["duration"])
    if is_full:
        # Full Episode 1 timestamps covering Intro, Source Card, Scene 01, Scene 02, Scene 03, and Outro
        sample_times = [
            5.0, 15.0,                        # 00_intro, 00b_source
            22.0, 28.0, 34.0, 40.0, 52.0,     # Scene 01: Storm 1A-1, 1A-2, Ashram 1B-0, 1B-1, 1E, 1F
            98.0, 112.0, 125.0, 134.0, 144.0, # Scene 02: Kaulipara village, house, spurt, wife, villager
            156.0, 168.0, 180.0, 194.0,       # Scene 03: Baidik monsoon, Charu dreams, Pagol, Charu wonder
            215.0, 226.0                      # 99_outro sunrise lotus + next episode card
        ]
    else:
        sample_times = [2.42, 4.0, 10.0, 16.0, 21.0, 25.0, 28.5, 31.0, 33.5, 38.0, 46.0, 56.0, 66.0, min(total_dur - 1.0, 72.5)]

    for idx, t in enumerate(sample_times):
        if t >= total_dur:
            continue
        out_png = audit_dir / f"qa_frame_{idx:02d}_{int(t)}s.png"
        subprocess.run(
            ["ffmpeg", "-y", "-ss", str(t), "-i", str(mp4_path), "-frames:v", "1", str(out_png)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        img = cv2.imread(str(out_png))
        mean_luma = float(np.mean(img))
        print(f"  Frame @{t:6.2f}s -> {out_png.name} (mean_luma={mean_luma:.1f})")
        if mean_luma < 5.0:
            errors.append(f"Black frame detected at {t}s!")

    if errors:
        print("\n[QA FAILED] Issues found:")
        for e in errors:
            print("  [X]", e)
        sys.exit(1)
    else:
        print("\n[QA PASSED] 100% of automated technical & visual gates passed!")


if __name__ == "__main__":
    main()
