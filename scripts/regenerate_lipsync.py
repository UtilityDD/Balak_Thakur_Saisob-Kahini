#!/usr/bin/env python3
"""Regenerate the JoyVASA lip-sync character clips for Param Bismoy Ep01 on this machine.

Each clip = one painted plate (public/images/s2_ep01) + one voice WAV (public/audio/s2_ep01), or a stretch of
silence for idle/listening clips. JoyVASA animates the face, pastes it back onto the full plate, and the result
is time-locked to 24.000 fps at the exact WAV length (QA gate 2: duration within 0.10 s).

Output goes to remotion_studio/public/video/s2_ep01/<clip>.mp4 (video only, the episode plays the WAV itself)
and the clip is removed from public/video/_PLACEHOLDERS.txt.

Usage
  python scripts/regenerate_lipsync.py --list
  python scripts/regenerate_lipsync.py p3c_charu_03c_24          # one clip
  python scripts/regenerate_lipsync.py --all                     # every clip still in _PLACEHOLDERS.txt
  python scripts/regenerate_lipsync.py --all --force             # every clip, even real ones

Setup (once): JoyVASA in D:/AI_Tools/JoyVASA with its .venv and pretrained_weights (see scripts/README.md).
Override the location with the JOYVASA_DIR environment variable.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import wave
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "remotion_studio" / "public"
PLATES = PUBLIC / "images" / "s2_ep01"
VOICES = PUBLIC / "audio" / "s2_ep01"
OUT = PUBLIC / "video" / "s2_ep01"
PLACEHOLDERS = PUBLIC / "video" / "_PLACEHOLDERS.txt"
JOYVASA = Path(os.environ.get("JOYVASA_DIR", "D:/AI_Tools/JoyVASA"))
WORK = Path(os.environ.get("JOYVASA_WORK", str(JOYVASA / "_work")))  # temp + raw outputs, kept off C:

# QA bible: driving_multiplier 0.75–0.95 and cfg_scale 1.8–2.3 avoid over-driven, bulging eyes.
DEFAULT_MULT = 0.85
DEFAULT_CFG = 2.0


@dataclass
class Clip:
    name: str
    plate: str
    voice: str | None = None  # WAV in public/audio/s2_ep01; None = idle on silence
    idle_seconds: float = 15.0
    mult: float = DEFAULT_MULT
    cfg: float = DEFAULT_CFG
    # Close the mouth before animating. Needed when the plate is painted mouth-open (shock, grin):
    # otherwise the "rest" pose is open and speech does not read.
    normalize_lip: bool = False
    note: str = ""


# Plates painted mouth-open (shock / laughter) use a "_closed" rest version made with
# scripts/close_mouth_plate.py, so the mouth closes between words (wife & wide wife x1.0, villager x2.0).
# Pagol: x1.0 only narrows his painted grin (x1.2+ smears the beard) -> interim until a closed-mouth plate is drawn.
CLIPS = [
    Clip("p1b_idle_24", "plate_a_lokenath_lap", idle_seconds=16, note="Lokenath seated, Jogesh bowing (idle)"),
    Clip("p1b_01b_24", "plate_a_lokenath_lap", "01b_Lokenath_Prophecy.wav", note="wide, Lokenath speaks"),
    Clip("p1c_01b_24", "plate_1c_lokenath_matched", "01b_Lokenath_Prophecy.wav", note="Lokenath close-up"),
    # Smile line: at 0.85 the smile expression swamped the speech (lips did not follow words) -> top of QA range.
    Clip("p1c_01d_24", "plate_1c_lokenath_matched", "01d_Lokenath_Smile.wav", mult=0.95, cfg=2.3, note="Lokenath close-up, smile line"),
    Clip("p1e_dual_01b_24", "plate_b_lokenath_handover", "01b_Lokenath_Prophecy.wav", note="handover two-shot"),
    Clip("p1f_01c_24", "plate_1f_jogesh_ots", "01c_Jogesh_Awe.wav", note="Jogesh reverse OTS"),
    Clip("p2a_wife_idle_24", "plate_2a_kaulipara_dawn_closed", idle_seconds=8, note="wide, wife small in frame (idle)"),
    Clip("p2a_wife_02b_24", "plate_2a_kaulipara_dawn_closed", "02b_Harnath_Wife.wav", note="wide, wife speaks"),
    Clip("p2b_wife_02b_24", "plate_2b_harnath_wife_cu_closed", "02b_Harnath_Wife.wav", note="wife medium close-up"),
    Clip("p2b_wife_point_02b_24", "plate_2b_wife_point_river", "02b_Harnath_Wife.wav", note="wife pointing and speaking in alarm"),
    Clip("p2b_wife_02d_24", "plate_2b_harnath_wife_cu_closed", "02d_Harnath_Wife_Lead.wav", normalize_lip=True, note="wife medium close-up"),
    Clip("p2c_villager_02c_24", "plate_2c_villager_dawn_closed", "02c_Villager_Shock.wav", note="villager"),
    Clip("p2c_villager_disbelief_02c_24", "plate_2c_villager_disbelief", "02c_Villager_Shock.wav", note="villager disbelief palms raised speaking"),
    Clip("p3b_pagol_03b_24", "plate_3b_pagol_rain_closed", "03b_Pagol_Omen.wav", mult=0.9, normalize_lip=True, note="ecstatic Pagol"),
    Clip("p3b_pagol_arms_03b_24", "plate_3b_pagol_arms_raised", "03b_Pagol_Omen.wav", mult=0.9, note="ecstatic Pagol arms raised speaking"),
    Clip("p3c_charu_idle_24", "plate_3c_charu_veranda", idle_seconds=16, note="Charushila (idle)"),
    Clip("p3c_charu_03c_24", "plate_3c_charu_veranda", "03c_Charu_Wonder.wav", note="Charushila speaks"),
    Clip("thakur_intro_blink_24", "plate_00_thakur_portrait", idle_seconds=13, mult=0.75, note="series intro portrait (idle)"),
    Clip("plate_a_lokenath_lap_lokenath_partA", "plate_a_lokenath_lap", "01b_Lokenath_Prophecy.wav", note="painted demo"),
    Clip("plate_b_lokenath_handover_lokenath_partB", "plate_b_lokenath_handover", "01b_Lokenath_Prophecy.wav", note="painted demo"),
    Clip("plate_b_jogesh_half_jogesh_listen", "plate_b_jogesh_half", idle_seconds=24, note="painted demo (listening)"),
]
BY_NAME = {c.name: c for c in CLIPS}


def run(cmd: list[str], **kw) -> None:
    print("  $", " ".join(str(c) for c in cmd))
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def wav_seconds(p: Path) -> float:
    with wave.open(str(p), "rb") as w:
        return w.getnframes() / w.getframerate()


def placeholders() -> list[str]:
    if not PLACEHOLDERS.is_file():
        return []
    return [l.strip() for l in PLACEHOLDERS.read_text(encoding="utf-8").splitlines() if l.strip()]


def drop_placeholder(rel: str) -> None:
    entries = placeholders()
    if rel in entries:
        PLACEHOLDERS.write_text("".join(e + "\n" for e in entries if e != rel), encoding="utf-8")


def generate(clip: Clip) -> None:
    py = JOYVASA / ".venv" / "Scripts" / "python.exe"
    if not py.is_file():
        py = JOYVASA / ".venv" / "bin" / "python"
    if not py.is_file():
        sys.exit(f"JoyVASA venv not found under {JOYVASA} (set JOYVASA_DIR)")

    work = WORK / clip.name
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)
    tmp = WORK / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, TMP=str(tmp), TEMP=str(tmp), HF_HOME=str(WORK / "hf"), PYTHONIOENCODING="utf-8")

    plate = PLATES / f"{clip.plate}.jpg"
    if clip.voice:
        audio = VOICES / clip.voice
    else:
        audio = work / "silence.wav"
        run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", str(clip.idle_seconds), audio])
    target = wav_seconds(audio)
    print(f"[{clip.name}] {clip.note} | plate {plate.name} | {'voice ' + clip.voice if clip.voice else 'idle'} | {target:.2f}s")

    raw_dir = work / "raw"
    run(
        [
            py, "inference.py",
            "-r", plate, "-a", audio, "-o", raw_dir,
            "--animation_mode", "human",
            "--cfg_scale", clip.cfg,
            "--driving_multiplier", clip.mult,
            "--flag_do_crop", "--flag_pasteback", "--flag_stitching", "--flag_relative_motion",
            "--source_max_dim", "1920",
            *(["--flag_normalize_lip"] if clip.normalize_lip else []),
        ],
        cwd=JOYVASA, env=env,
    )
    encode(clip, target)


def clip_seconds(clip: Clip) -> float:
    return wav_seconds(VOICES / clip.voice) if clip.voice else clip.idle_seconds


def encode(clip: Clip, target: float | None = None) -> None:
    """Convert JoyVASA's raw 25 fps render to the 24 fps clip Remotion plays."""
    target = clip_seconds(clip) if target is None else target
    raw_dir = WORK / clip.name / "raw"
    produced = sorted(raw_dir.rglob("*.mp4"), key=lambda p: p.stat().st_mtime) if raw_dir.is_dir() else []
    # Prefer the full-frame paste-back render over the side-by-side "concat" preview.
    full = [p for p in produced if "concat" not in p.name.lower()] or produced
    if not full:
        sys.exit(f"[{clip.name}] no JoyVASA render in {raw_dir} (generate it first)")
    src = full[-1]

    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{clip.name}.mp4"
    # JoyVASA renders frame i at i/25 s from the first audio sample; any surplus is a few rounding frames at the END.
    # So keep its timestamps (NO setpts stretch, which would squeeze the timeline and make the mouth drift ahead),
    # resample 25 -> 24 fps by timestamp, and trim to the WAV length. QA gate 2: 24/1 fps, duration = WAV ± 0.10 s.
    run([
        "ffmpeg", "-v", "error", "-y", "-i", src,
        "-vf", "fps=24,scale=1920:1080:flags=lanczos,format=yuv420p",
        "-an", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-t", f"{target:.3f}", out,
    ])
    got = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(out)], text=True
    ).strip())
    status = "OK" if abs(got - target) <= 0.10 else "DRIFT"
    print(f"[{clip.name}] {status}: {got:.3f}s vs voice {target:.3f}s -> {out.relative_to(ROOT)}")
    drop_placeholder(out.relative_to(PUBLIC).as_posix())
    if clip.voice:
        # Lip-sync QA: mouth activity must follow the voice (see scripts/check_lipsync.py).
        py = JOYVASA / ".venv" / "Scripts" / "python.exe"
        res = subprocess.run([str(py), str(ROOT / "scripts" / "check_lipsync.py"), str(out), str(VOICES / clip.voice)],
                             capture_output=True, text=True, env=dict(os.environ, PYTHONIOENCODING="utf-8"))
        line = [l for l in res.stdout.splitlines() if l.startswith("[lipsync]")]
        print(line[-1] if line else f"[lipsync] check failed to run: {res.stderr.strip()[-300:]}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="*", help="clip names (without .mp4)")
    ap.add_argument("--all", action="store_true", help="every clip still listed as a placeholder")
    ap.add_argument("--force", action="store_true", help="with --all: regenerate real clips too")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--reencode", action="store_true",
                    help="only redo the 25->24 fps conversion from saved raw renders (all clips that have one)")
    args = ap.parse_args()

    if args.reencode:
        names = args.clips or [c.name for c in CLIPS if (WORK / c.name / "raw").is_dir()]
        for n in names:
            encode(BY_NAME[n])
        return

    pending = {Path(p).stem for p in placeholders()}
    if args.list:
        for c in CLIPS:
            print(f"{'placeholder' if c.name in pending else 'real       '}  {c.name:44} {c.plate:28} {c.voice or 'idle'}")
        return
    names = [c.name for c in CLIPS if args.force or c.name in pending] if args.all else args.clips
    unknown = [n for n in names if n not in BY_NAME]
    if unknown or not names:
        sys.exit(f"Unknown or no clips: {unknown or '(none given)'}. Use --list.")
    for n in names:
        generate(BY_NAME[n])


if __name__ == "__main__":
    main()
